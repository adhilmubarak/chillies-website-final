const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendNewOrderNotification = functions.firestore
  .document("orders/{orderId}")
  .onCreate(async (snap, context) => {
    const newOrder = snap.data();
    
    // Check if it's already accepted to prevent weird edge cases
    if (newOrder.status !== 'pending') return;

    // Fetch Admin Tokens from Settings
    const settingsDoc = await admin.firestore().collection("settings").doc("general").get();
    if (!settingsDoc.exists) {
        console.log("No settings document found.");
        return;
    }
    
    const settingsData = settingsDoc.data();
    const adminTokens = settingsData.adminTokens || [];

    if (adminTokens.length === 0) {
        console.log("No admin registered for background notifications.");
        return;
    }

    const title = "NEW ORDER: ₹" + newOrder.total;
    const bodyText = `Order #${newOrder.id} received from ${newOrder.customerName}.`;

    try {
        const response = await admin.messaging().sendEachForMulticast({
            tokens: adminTokens,
            notification: {
                title: title,
                body: bodyText
            },
            data: {
                title: title,
                body: bodyText,
                orderId: newOrder.id,
                click_action: "FLUTTER_NOTIFICATION_CLICK",
                url: "/admin"
            },
            android: {
                priority: "high",
                notification: {
                    channelId: "high_importance_channel",
                    vibrateTimingsMillis: [500, 1000, 500, 1000, 500, 1000, 500, 1000],
                    priority: "max",
                    defaultSound: true
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: {
                            critical: 1,
                            name: "default",
                            volume: 1.0
                        }
                    }
                }
            },
            webpush: {
                fcmOptions: {
                    link: "/admin"
                },
                notification: {
                    icon: "/pwa-192x192.png",
                    badge: "/pwa-192x192.png",
                    requireInteraction: true,
                    vibrate: [500, 1000, 500, 1000, 500, 1000, 500, 1000]
                }
            }
        });
        
        console.log(response.successCount + " messages were sent successfully!");
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(adminTokens[idx]);
                }
            });
            console.log("List of tokens that caused failures: " + failedTokens);
            // Optionally remove stale tokens from Firestore here
        }
    } catch (error) {
        console.error("Error sending push notification", error);
    }
  });
