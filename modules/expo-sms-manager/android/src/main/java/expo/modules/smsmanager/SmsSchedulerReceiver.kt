package expo.modules.smsmanager

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.SmsManager
import android.app.PendingIntent
import android.os.Build

class SmsSchedulerReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val messageId = intent.getStringExtra("message_id") ?: return
        val personalizedMessages = intent.getBundleExtra("personalized_messages") ?: return
        val recipients = intent.getStringArrayExtra("recipients") ?: return
        val subscriptionId = if (intent.hasExtra("subscription_id")) {
            intent.getIntExtra("subscription_id", -1)
        } else null

        val smsManager: SmsManager = if (subscriptionId != null && subscriptionId != -1 && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
            SmsManager.getSmsManagerForSubscriptionId(subscriptionId)
        } else {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                context.getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }
        }

        recipients.forEachIndexed { index, number ->
            val uniqueId = (messageId.hashCode() + index + System.currentTimeMillis().toInt())
            
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

            val message = personalizedMessages.getString(number) ?: ""
            if (message.isNotEmpty()) {
                smsManager.sendTextMessage(number, null, message, sentPendingIntent, deliveryPendingIntent)
            }
        }
    }
}
