package com.chillies.admin;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MessagingService extends FirebaseMessagingService {
    private static final String TAG = "MessagingService";
    private static final String CHANNEL_ID = "orders_channel";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID,
                    "Critical Order Alerts",
                    NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Rings continuously until order is viewed");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 1000, 500, 1000, 500, 1000});
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            
            Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            if (defaultSoundUri == null) {
            // Long vibration pattern: 1s on, 0.5s off
            channel.setVibrationPattern(new long[]{0, 1000, 500, 1000, 500, 1000, 500, 1000});
            channel.setSound(defaultSoundUri, audioAttributes);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            
            // Allow this notification to bypass "Do Not Disturb" mode
            channel.setBypassDnd(true);

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        
        Log.d(TAG, "Strict Message Received from: " + remoteMessage.getFrom());
        
        // Ensure CPU is awake
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Chillies:StrictAlert");
        wakeLock.acquire(30000); // 30 seconds
        
        String title = "NEW ORDER ALERT";
        String body = "Check the admin panel immediately!";
        String type = "order";

        if (remoteMessage.getData().size() > 0) {
            if (remoteMessage.getData().containsKey("title")) title = remoteMessage.getData().get("title");
            if (remoteMessage.getData().containsKey("body")) body = remoteMessage.getData().get("body");
            if (remoteMessage.getData().containsKey("type")) type = remoteMessage.getData().get("type");
        }

        // Always use high strictness for orders and complaints
        if (title.toLowerCase().contains("order") || title.toLowerCase().contains("complaint") || "test".equals(type)) {
            sendNotification(title, body, type);
        }
    }

    private void sendNotification(String title, String body, String type) {
        createNotificationChannel();

        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("type", type);
        
        PendingIntent pendingIntent = PendingIntent.getActivity(this, (int) System.currentTimeMillis(), intent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);

        NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(false) // Don't auto cancel, force user to interact
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setFullScreenIntent(pendingIntent, true)
                .setContentIntent(pendingIntent)
                .setSound(alarmSound)
                .setVibrate(new long[]{0, 1000, 500, 1000, 500, 1000, 500, 1000})
                .setLights(Color.RED, 3000, 3000)
                .addAction(android.R.drawable.ic_menu_view, "OPEN DASHBOARD", pendingIntent);

        Notification notification = notificationBuilder.build();
        // FLAG_INSISTENT: sound repeats until user dismisses
        // FLAG_NO_CLEAR: prevent swipe away (optional, but makes it "stricter")
        notification.flags |= Notification.FLAG_INSISTENT;

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        int notificationId = (int) (System.currentTimeMillis() % 100000);
        notificationManager.notify(notificationId, notification);

        // Force wake the app
        forceOpenApp();
    }

    private void forceOpenApp() {
        try {
            Intent intent = new Intent(this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to force open app: " + e.getMessage());
        }
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        Log.d(TAG, "Refreshed token: " + token);
    }
}
