package expo.modules.smsmanager

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

class SmsReminderReceiver : BroadcastReceiver() {
    companion object {
        const val CHANNEL_ID = "sms_reminder_channel"
        const val CHANNEL_NAME = "SMS Scheduled Reminders"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val messageId = intent.getStringExtra("message_id") ?: return
        val groupId = intent.getStringExtra("group_id") ?: return

        createNotificationChannel(context)

        // Deep link back into the app
        val deepLinkIntent = Intent(Intent.ACTION_VIEW, Uri.parse("smsbroadcast://group-chat/$groupId")).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        
        val pendingIntent = PendingIntent.getActivity(
            context,
            messageId.hashCode() + 1,
            deepLinkIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val groupName = intent.getStringExtra("group_name") ?: "SmsBroadcast"
        val baseMessage = intent.getStringExtra("base_message") ?: ""

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(context.applicationInfo.icon) // Use app icon 
            .setContentTitle("${context.getString(R.string.notification_reminder_title)} ($groupName)")
            .setContentText(if (baseMessage.isNotEmpty()) baseMessage else context.getString(R.string.notification_reminder_text))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setStyle(NotificationCompat.BigTextStyle().bigText(baseMessage)) // Support long messages

        try {
            with(NotificationManagerCompat.from(context)) {
                notify(messageId.hashCode() + 1, builder.build())
            }
        } catch (e: Exception) {
            // Permission for notification might be missing on Android 13+, but the alarm already fired.
        }
    }

    private fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, importance).apply {
                description = "Notifie l'utilisateur juste avant l'envoi d'un message planifié"
            }
            val notificationManager: NotificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
}
