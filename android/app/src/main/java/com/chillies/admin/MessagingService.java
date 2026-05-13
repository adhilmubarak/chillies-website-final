package com.chillies.admin;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.media.AudioAttributes;
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
    private static final String CHANNEL_ID = "strict_orders_channel";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager.getNotificationChannel(CHANNEL_ID) != null) return;

            Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmSound == null) alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();

            NotificationChannel channel = new NotificationChannel(CHANNEL_ID,
                    "Strict Order Alerts",
                    NotificationManager.IMPORTANCE_HIGH);
            
            channel.setDescription("Immediate alarms for new orders");
            channel.enableLights(true);
            channel.setLightColor(Color.RED);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 800, 200, 800, 200, 800});
            channel.setSound(alarmSound, audioAttributes);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            channel.setBypassDnd(true);

            notificationManager.createNotificationChannel(channel);
        }
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        // 1. IMMEDIATELY acquire WakeLock to prevent CPU from sleeping
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP, "Chillies:FastAlert");
        wakeLock.acquire(30000); 

        // 2. IMMEDIATELY try to force open the app (even before showing notification)
        forceOpenApp();

        Log.d(TAG, "Fast Message Received");
        
        String title = "NEW ORDER ALERT";
        String body = "Check the admin panel!";
        String type = "order";

        if (remoteMessage.getData().size() > 0) {
            if (remoteMessage.getData().containsKey("title")) title = remoteMessage.getData().get("title");
            if (remoteMessage.getData().containsKey("body")) body = remoteMessage.getData().get("body");
            if (remoteMessage.getData().containsKey("type")) type = remoteMessage.getData().get("type");
        }

        if (title.toLowerCase().contains("order") || title.toLowerCase().contains("complaint") || "order".equals(type)) {
            sendNotification(title, body, type);
        }
    }

    private void sendNotification(String title, String body, String type) {
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
                .setAutoCancel(false) 
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setFullScreenIntent(pendingIntent, true)
                .setContentIntent(pendingIntent)
                .setSound(alarmSound)
                .setVibrate(new long[]{0, 1000, 500, 1000})
                .setLights(Color.RED, 3000, 3000);

        Notification notification = notificationBuilder.build();
        notification.flags |= Notification.FLAG_INSISTENT;

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManager.notify((int)(System.currentTimeMillis() % 100000), notification);
    }

    private void forceOpenApp() {
        try {
            Intent intent = new Intent(this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Force open failed: " + e.getMessage());
        }
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
    }
}
