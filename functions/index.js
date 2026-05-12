const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendOrderNotification = onDocumentCreated("orders/{orderId}", async (event) => {
    const newOrder = event.data.data();
    
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
            data: {
                title: title,
                body: bodyText,
                orderId: newOrder.id,
                click_action: "FLUTTER_NOTIFICATION_CLICK",
                url: "/admin"
            },
            android: {
                priority: "high",
                // We DON'T put a notification block here for Android 
                // to ensure onMessageReceived is triggered in the background
            },
            apns: {
                payload: {
                    aps: {
                        alert: {
                            title: title,
                            body: bodyText
                        },
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
                    title: title,
                    body: bodyText,
                    icon: "/pwa-192x192.png",
                    badge: "/pwa-192x192.png",
                    requireInteraction: true,
                    vibrate: [500, 1000, 500, 1000, 500, 1000, 500, 1000]
                }
            }
        });
        
        console.log(response.successCount + " messages were sent successfully!");
        
        // Clean up invalid tokens
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error?.code;
                    if (errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered') {
                        failedTokens.push(adminTokens[idx]);
                    }
                }
            });

            if (failedTokens.length > 0) {
                await admin.firestore().collection("settings").doc("general").update({
                    adminTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
                });
                console.log(`Cleaned up ${failedTokens.length} invalid admin tokens.`);
            }
        }
    } catch (error) {
        console.error("Error sending push notification", error);
    }
  });
  
exports.sendComplaintNotification = onDocumentCreated("complaints/{complaintId}", async (event) => {
    const newComplaint = event.data.data();
    
    // Fetch Admin Tokens from Settings
    const settingsDoc = await admin.firestore().collection("settings").doc("general").get();
    if (!settingsDoc.exists) return;
    
    const settingsData = settingsDoc.data();
    const adminTokens = settingsData.adminTokens || [];

    if (adminTokens.length === 0) return;

    const title = "NEW COMPLAINT: " + newComplaint.subject;
    const bodyText = `From ${newComplaint.customerName}: ${newComplaint.description.substring(0, 100)}...`;

    try {
        const response = await admin.messaging().sendEachForMulticast({
            tokens: adminTokens,
            data: {
                title: title,
                body: bodyText,
                complaintId: event.params.complaintId,
                type: 'complaint',
                url: "/admin"
            },
            android: {
                priority: "high",
            }
        });

        // Clean up invalid tokens
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error?.code;
                    if (errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered') {
                        failedTokens.push(adminTokens[idx]);
                    }
                }
            });

            if (failedTokens.length > 0) {
                await admin.firestore().collection("settings").doc("general").update({
                    adminTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
                });
                console.log(`Cleaned up ${failedTokens.length} invalid admin tokens.`);
            }
        }
    } catch (error) {
        console.error("Error sending complaint notification", error);
    }
});

exports.testAdminNotification = onDocumentCreated("test_notifications/{testId}", async (event) => {
    const testData = event.data.data();
    
    const settingsDoc = await admin.firestore().collection("settings").doc("general").get();
    if (!settingsDoc.exists) return;
    
    const settingsData = settingsDoc.data();
    const adminTokens = settingsData.adminTokens || [];
    if (adminTokens.length === 0) return;

    const title = testData.title || "Test Notification";
    const bodyText = testData.body || "This is a test of the background notification system.";

    try {
        const response = await admin.messaging().sendEachForMulticast({
            tokens: adminTokens,
            data: {
                title: title,
                body: bodyText,
                orderId: "TEST-123",
                type: "test",
                url: "/admin"
            },
            android: {
                priority: "high",
            },
            apns: {
                payload: {
                    aps: {
                        alert: { title, body: bodyText },
                        sound: "default"
                    }
                }
            }
        });

        // Clean up invalid tokens
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error?.code;
                    if (errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered') {
                        failedTokens.push(adminTokens[idx]);
                    }
                }
            });

            if (failedTokens.length > 0) {
                await admin.firestore().collection("settings").doc("general").update({
                    adminTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
                });
                console.log(`Cleaned up ${failedTokens.length} invalid admin tokens.`);
            }
        }
    } catch (error) {
        console.error("Error sending test notification", error);
    }
});
