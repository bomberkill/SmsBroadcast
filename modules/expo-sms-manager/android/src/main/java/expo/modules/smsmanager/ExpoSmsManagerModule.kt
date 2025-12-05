package expo.modules.smsmanager

import android.telephony.SmsManager
import android.telephony.SubscriptionManager
import android.os.Build
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoSmsManagerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoSmsManager")

    AsyncFunction("getAvailableSimsAsync") { ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
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

    AsyncFunction("sendSms") { phoneNumbers: List<String>, message: String, subscriptionId: Int? ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()

      try {
        val smsManager: SmsManager =
          if (subscriptionId != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
            // Utilise la SIM spécifiée si l'ID est fourni et que la version d'Android le permet
            SmsManager.getSmsManagerForSubscriptionId(subscriptionId)
          } else {
            // Comportement par défaut (utilise la SIM par défaut)
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

        phoneNumbers.forEach { number ->
          // Le dernier argument `sentIntent` et `deliveryIntent` sont null, donc nous n'avons pas de retour sur la livraison.
          smsManager.sendTextMessage(number, null, message, null, null)
        }

        return@AsyncFunction mapOf("status" to "sent", "message" to "SMS queued by Android system.")
      } catch (e: Exception) {
        throw Exception("Failed: ${e.message}")
      }
    }
  }
}
