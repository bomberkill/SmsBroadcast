package expo.modules.smsmanager

import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.telephony.SmsManager
import android.telephony.SubscriptionManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

const val SMS_SENT_ACTION = "SMS_SENT"
const val SMS_DELIVERED_ACTION = "SMS_DELIVERED"
const val EXTRA_PHONE_NUMBER = "phone_number"
const val EXTRA_MESSAGE_ID = "message_id"

class ExpoSmsManagerModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  // Static counter to ensure unique request codes prevents PendingIntent collisions
  companion object {
    private val uniqueIdCounter = java.util.concurrent.atomic.AtomicInteger(0)
  }

  private val smsStatusReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      if (intent.action == SMS_SENT_ACTION || intent.action == SMS_DELIVERED_ACTION) {
        val phoneNumber = intent.getStringExtra(EXTRA_PHONE_NUMBER)
        val messageId = intent.getStringExtra(EXTRA_MESSAGE_ID)
        
        if (phoneNumber != null && messageId != null) {
          val eventName = if (intent.action == SMS_DELIVERED_ACTION) "onSmsDeliveryUpdate" else "onSmsStatusUpdate"
          
          val status = when (resultCode) {
            Activity.RESULT_OK -> if (eventName == "onSmsDeliveryUpdate") "delivered" else "sent"
            else -> "failed"
          }

          val errorCode = if (status == "failed") {
            when (resultCode) {
                SmsManager.RESULT_ERROR_GENERIC_FAILURE -> "GENERIC_FAILURE"
                SmsManager.RESULT_ERROR_NO_SERVICE -> "NO_SERVICE"
                SmsManager.RESULT_ERROR_NULL_PDU -> "NULL_PDU"
                SmsManager.RESULT_ERROR_RADIO_OFF -> "RADIO_OFF"
                SmsManager.RESULT_ERROR_LIMIT_EXCEEDED -> "LIMIT_EXCEEDED"
                SmsManager.RESULT_ERROR_FDN_CHECK_FAILURE -> "FDN_CHECK_FAILURE"
                else -> "UNKNOWN_ERROR ($resultCode)"
            }
          } else null

          if (status == "failed") {
            android.util.Log.e("ExpoSmsManager", "SMS Failed: $eventName, Code: $errorCode")
          }
          
          this@ExpoSmsManagerModule.sendEvent(eventName, mapOf(
            "messageId" to messageId,
            "phoneNumber" to phoneNumber,
            "status" to status,
            "errorCode" to errorCode
          ))
        }
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoSmsManager")
    
    Events("onSmsStatusUpdate", "onSmsDeliveryUpdate")

    OnCreate {
      val filter = IntentFilter().apply {
        addAction(SMS_SENT_ACTION)
        addAction(SMS_DELIVERED_ACTION)
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          context.registerReceiver(smsStatusReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
      } else {
          context.registerReceiver(smsStatusReceiver, filter)
      }
    }

    OnDestroy {
      try {
        context.unregisterReceiver(smsStatusReceiver)
      } catch (e: Exception) {
        // Receiver might not be registered or already unregistered
      }
    }

    AsyncFunction("getAvailableSimsAsync") { ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP_MR1) {
        return@AsyncFunction emptyList<Map<String, Any>>()
      }

      val subscriptionManager = context.getSystemService(SubscriptionManager::class.java)
      val activeSubscriptions = subscriptionManager.activeSubscriptionInfoList

      if (activeSubscriptions.isNullOrEmpty()) {
        return@AsyncFunction emptyList<Map<String, Any>>()
      }

      return@AsyncFunction activeSubscriptions.map { subscriptionInfo ->
        mapOf(
          "subscriptionId" to subscriptionInfo.subscriptionId,
          "displayName" to subscriptionInfo.displayName.toString(),
          "carrierName" to subscriptionInfo.carrierName.toString(),
          "simSlotIndex" to subscriptionInfo.simSlotIndex
        )
      }
    }

    AsyncFunction("sendSms") { messageId: String, phoneNumbers: List<String>, message: String, subscriptionId: Int? ->
      try {
        val smsManager: SmsManager =
          if (subscriptionId != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
            SmsManager.getSmsManagerForSubscriptionId(subscriptionId)
          } else {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
              context.getSystemService(SmsManager::class.java)
            } else {
              @Suppress("DEPRECATION")
              SmsManager.getDefault()
            }
          }

        if (phoneNumbers.isEmpty()) {
          throw Exception("Phone numbers list is empty")
        }

        phoneNumbers.forEachIndexed { _, number ->
           // Unique ID for this specific SMS attempt
           val uniqueId = uniqueIdCounter.getAndIncrement()

           val sentIntent = Intent(SMS_SENT_ACTION).apply {
             putExtra(EXTRA_PHONE_NUMBER, number)
             putExtra(EXTRA_MESSAGE_ID, messageId)
             setPackage(context.packageName)
           }
           
           val sentPendingIntent = PendingIntent.getBroadcast(
             context, 
             uniqueId, 
             sentIntent, 
             PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
           )

           val deliveryIntent = Intent(SMS_DELIVERED_ACTION).apply {
             putExtra(EXTRA_PHONE_NUMBER, number)
             putExtra(EXTRA_MESSAGE_ID, messageId)
             setPackage(context.packageName)
           }

           val deliveryPendingIntent = PendingIntent.getBroadcast(
             context,
             uniqueId,
             deliveryIntent,
             PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
           )

           smsManager.sendTextMessage(number, null, message, sentPendingIntent, deliveryPendingIntent)
        }

        return@AsyncFunction mapOf("status" to "queued", "message" to "SMS sending initiated.")
      } catch (e: Exception) {
        throw Exception("Failed: ${e.message}")
      }
    }

    AsyncFunction("canScheduleExactAlarms") { ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
        return@AsyncFunction alarmManager.canScheduleExactAlarms()
      }
      return@AsyncFunction true
    }

    AsyncFunction("requestExactAlarmPermission") { ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val intent = Intent().apply {
          action = android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM
          data = android.net.Uri.fromParts("package", context.packageName, null)
          flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
      }
    }

    AsyncFunction("scheduleSms") { messageId: String, groupId: String, groupName: String, baseMessage: String, personalizedMessages: Map<String, String>, timestamp: Long, subscriptionId: Int? ->
      try {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
        
        // Ensure permission since Android 12
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
          throw Exception("PERMISSION_DENIED: Exact alarm permission not granted.")
        }

        // 1. Send Alarm
        val sendIntent = Intent(context, SmsSchedulerReceiver::class.java).apply {
            putExtra("message_id", messageId)
            // Convert Map to Bundle for Intent
            val bundle = android.os.Bundle()
            for ((phone, msg) in personalizedMessages) {
                bundle.putString(phone, msg)
            }
            putExtra("personalized_messages", bundle)
            putExtra("recipients", personalizedMessages.keys.toTypedArray())
            if (subscriptionId != null) {
                putExtra("subscription_id", subscriptionId)
            }
        }
        val sendPendingIntent = PendingIntent.getBroadcast(
            context,
            messageId.hashCode(),
            sendIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
                android.app.AlarmManager.RTC_WAKEUP,
                timestamp,
                sendPendingIntent
            )
        } else {
            alarmManager.setExact(
                android.app.AlarmManager.RTC_WAKEUP,
                timestamp,
                sendPendingIntent
            )
        }

        // 2. Reminder Alarm (30s before)
        val reminderTime = timestamp - 30000
        if (reminderTime > System.currentTimeMillis() + 5000) { // Only if useful (more than 5s from now)
            val reminderIntent = Intent(context, SmsReminderReceiver::class.java).apply {
                putExtra("message_id", messageId)
                putExtra("group_id", groupId)
                putExtra("group_name", groupName)
                putExtra("base_message", baseMessage)
            }
            val reminderPendingIntent = PendingIntent.getBroadcast(
                context,
                messageId.hashCode() + 1,
                reminderIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    android.app.AlarmManager.RTC_WAKEUP,
                    reminderTime,
                    reminderPendingIntent
                )
            } else {
                alarmManager.setExact(
                    android.app.AlarmManager.RTC_WAKEUP,
                    reminderTime,
                    reminderPendingIntent
                )
            }
        }

        return@AsyncFunction mapOf("status" to "scheduled", "message" to "SMS scheduled successfully.")
      } catch (e: Exception) {
        throw Exception("Schedule failed: ${e.message}")
      }
    }

    AsyncFunction("cancelScheduledSms") { messageId: String ->
      try {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
        
        // Cancel Send intent
        val sendIntent = Intent(context, SmsSchedulerReceiver::class.java)
        val sendPendingIntent = PendingIntent.getBroadcast(
            context,
            messageId.hashCode(),
            sendIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        alarmManager.cancel(sendPendingIntent)

        // Cancel Reminder intent
        val reminderIntent = Intent(context, SmsReminderReceiver::class.java)
        val reminderPendingIntent = PendingIntent.getBroadcast(
            context,
            messageId.hashCode() + 1,
            reminderIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        alarmManager.cancel(reminderPendingIntent)

        return@AsyncFunction true
      } catch (e: Exception) {
        throw Exception("Cancel failed: ${e.message}")
      }
    }
  }
}
