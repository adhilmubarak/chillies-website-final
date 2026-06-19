const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
// const nodemailer = require("nodemailer");

admin.initializeApp();

// Configure the email transporter (Disabled as requested)
// RECOMMENDATION: Replace these with your actual credentials
/*
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'chilliesrestaurant52@gmail.com', 
        pass: 'erei wdxz vvln eeio'    
    }
});
*/

/**
 * Helper to send multicast messages in chunks of 500 (FCM limit)
 * and clean up invalid tokens.
 */
const sendMulticastBatched = async (tokens, payload) => {
    const validTokens = [...new Set(tokens.filter(t => typeof t === 'string' && t.length > 0))];
    if (validTokens.length === 0) {
        console.log("No valid tokens to send to.");
        return { successCount: 0, failureCount: 0 };
    }

    let totalSuccess = 0;
    let totalFailure = 0;
    const allFailedTokens = [];

    for (let i = 0; i < validTokens.length; i += 500) {
        const chunk = validTokens.slice(i, i + 500);
        try {
            const response = await admin.messaging().sendEachForMulticast({ ...payload, tokens: chunk });
            totalSuccess += response.successCount;
            totalFailure += response.failureCount;

            if (response.failureCount > 0) {
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        const code = resp.error?.code;
                        if (code === 'messaging/invalid-registration-token' || code === 'messaging/registration-token-not-registered') {
                            allFailedTokens.push(chunk[idx]);
                        }
                    }
                });
            }
        } catch (err) {
            console.error("Fast-path batch failed:", err);
        }
    }

    if (allFailedTokens.length > 0) {
        try {
            await admin.firestore().collection("settings").doc("general").update({
                adminTokens: admin.firestore.FieldValue.arrayRemove(...allFailedTokens)
            });
            console.log(`Cleaned up ${allFailedTokens.length} invalid tokens.`);
        } catch (err) {
            console.error("Failed to clean up tokens:", err);
        }
    }

    return { successCount: totalSuccess, failureCount: totalFailure };
};

exports.sendOrderNotification = onDocumentCreated("orders/{orderId}", async (event) => {
    const newOrder = event.data.data();
    if (newOrder.status !== 'pending') return;

    const settingsDoc = await admin.firestore().collection("settings").doc("general").get();
    if (!settingsDoc.exists) return;
    
    const adminTokens = settingsDoc.data().adminTokens || [];
    if (adminTokens.length === 0) return;

    const title = "NEW ORDER: ₹" + newOrder.total;
    const bodyText = `Order #${newOrder.id} received from ${newOrder.customerName}.`;

    const payload = {
        notification: {
            title: title,
            body: bodyText
        },
        data: {
            title: title,
            body: bodyText,
            orderId: newOrder.id,
            type: "order",
            url: "/admin"
        },
        android: {
            priority: "high",
            ttl: 86400,
            directBootOk: true
        },
        apns: {
            payload: {
                aps: {
                    alert: { title, body: bodyText },
                    sound: { critical: 1, name: "default", volume: 1.0 }
                }
            }
        },
        webpush: {
            notification: {
                title: title,
                body: bodyText,
                icon: "/pwa-192x192.png",
                badge: "/pwa-192x192.png",
                tag: newOrder.id || "new_order",
                vibrate: [300, 100, 300, 100, 300],
                requireInteraction: true
            },
            fcmOptions: {
                link: "/admin"
            }
        }
    };

    const result = await sendMulticastBatched(adminTokens, payload);
    console.log(`Order notification: ${result.successCount} sent, ${result.failureCount} failed.`);

    // Send Email Alert (Disabled as requested)
});
  
exports.sendComplaintNotification = onDocumentCreated("complaints/{complaintId}", async (event) => {
    const newComplaint = event.data.data();
    
    const settingsDoc = await admin.firestore().collection("settings").doc("general").get();
    if (!settingsDoc.exists) return;
    
    const adminTokens = settingsDoc.data().adminTokens || [];
    if (adminTokens.length === 0) return;

    const title = "NEW COMPLAINT: " + newComplaint.subject;
    const bodyText = `From ${newComplaint.customerName}: ${newComplaint.description.substring(0, 100)}...`;

    const payload = {
        notification: {
            title: title,
            body: bodyText
        },
        data: {
            title: title,
            body: bodyText,
            complaintId: event.params.complaintId,
            type: 'complaint',
            url: "/admin"
        },
        android: {
            priority: "high",
            ttl: 86400,
            directBootOk: true
        },
        webpush: {
            notification: {
                title: title,
                body: bodyText,
                icon: "/pwa-192x192.png",
                badge: "/pwa-192x192.png",
                tag: event.params.complaintId || "complaint",
                vibrate: [300, 100, 300, 100, 300],
                requireInteraction: true
            },
            fcmOptions: {
                link: "/admin"
            }
        }
    };

    const result = await sendMulticastBatched(adminTokens, payload);
    console.log(`Complaint notification: ${result.successCount} sent, ${result.failureCount} failed.`);
});

exports.testAdminNotification = onDocumentCreated("test_notifications/{testId}", async (event) => {
    const testData = event.data.data();
    
    const settingsDoc = await admin.firestore().collection("settings").doc("general").get();
    if (!settingsDoc.exists) return;
    
    const adminTokens = settingsDoc.data().adminTokens || [];
    if (adminTokens.length === 0) return;

    const title = testData.title || "Test Notification";
    const bodyText = testData.body || "This is a test of the background notification system.";

    const payload = {
        notification: {
            title: title,
            body: bodyText
        },
        data: {
            title: title,
            body: bodyText,
            type: "test",
            url: "/admin"
        },
        android: {
            priority: "high",
            ttl: 86400,
            directBootOk: true
        },
        apns: {
            payload: {
                aps: {
                    alert: { title, body: bodyText },
                    sound: "default"
                }
            }
        },
        webpush: {
            notification: {
                title: title,
                body: bodyText,
                icon: "/pwa-192x192.png",
                badge: "/pwa-192x192.png",
                tag: "test_notification",
                vibrate: [300, 100, 300, 100, 300],
                requireInteraction: true
            },
            fcmOptions: {
                link: "/admin"
            }
        }
    };

    const result = await sendMulticastBatched(adminTokens, payload);
    console.log(`Test notification: ${result.successCount} sent, ${result.failureCount} failed.`);
});

exports.sendGlobalBroadcast = onDocumentCreated("broadcasts/{broadcastId}", async (event) => {
    const broadcastData = event.data.data();
    
    const settingsDoc = await admin.firestore().collection("settings").doc("general").get();
    if (!settingsDoc.exists) return;
    
    const adminTokens = settingsDoc.data().adminTokens || [];
    if (adminTokens.length === 0) return;

    const title = broadcastData.title || "Management Update";
    const bodyText = broadcastData.body || "A new update is available. Check the app for details.";

    const payload = {
        notification: {
            title: title,
            body: bodyText
        },
        data: {
            title: title,
            body: bodyText,
            type: "broadcast",
            url: "/"
        },
        android: {
            priority: "high",
            ttl: 86400
        },
        apns: {
            payload: {
                aps: {
                    alert: { title, body: bodyText },
                    sound: "default"
                }
            }
        },
        webpush: {
            notification: {
                title: title,
                body: bodyText,
                icon: "/pwa-192x192.png",
                badge: "/pwa-192x192.png",
                tag: "broadcast",
                vibrate: [300, 100, 300, 100, 300],
                requireInteraction: true
            },
            fcmOptions: {
                link: "/"
            }
        }
    };

    const result = await sendMulticastBatched(adminTokens, payload);
    console.log(`Global broadcast: ${result.successCount} sent, ${result.failureCount} failed.`);
});

exports.sendDeliveryNotification = onDocumentCreated("delivery_notifications/{notificationId}", async (event) => {
    const newNotification = event.data.data();
    if (!newNotification || !newNotification.deliveryBoyId) return;

    // Fetch the delivery boy document to get tokens
    const boyDoc = await admin.firestore().collection("delivery_boys").doc(newNotification.deliveryBoyId).get();
    if (!boyDoc.exists) {
        console.log(`Delivery boy not found: ${newNotification.deliveryBoyId}`);
        return;
    }

    const tokens = boyDoc.data().tokens || [];
    const validTokens = [...new Set(tokens.filter(t => typeof t === 'string' && t.length > 0))];
    if (validTokens.length === 0) {
        console.log(`No valid tokens for delivery boy: ${newNotification.deliveryBoyId}`);
        return;
    }

    const title = newNotification.title || "New Order Assigned! 🛵";
    const bodyText = newNotification.body || `Order #${newNotification.orderId} is assigned to you.`;

    const payload = {
        notification: {
            title: title,
            body: bodyText
        },
        data: {
            title: title,
            body: bodyText,
            orderId: newNotification.orderId,
            type: "delivery_assign",
            url: "/delivery"
        },
        android: {
            priority: "high",
            ttl: 86400,
            directBootOk: true,
            notification: {
                sound: "default",
                channelId: "delivery_alerts"
            }
        },
        apns: {
            payload: {
                aps: {
                    alert: { title, body: bodyText },
                    sound: { critical: 1, name: "default", volume: 1.0 }
                }
            }
        },
        webpush: {
            notification: {
                title: title,
                body: bodyText,
                icon: "/pwa-192x192.png",
                badge: "/pwa-192x192.png",
                tag: newNotification.orderId || "delivery_assign",
                vibrate: [300, 100, 300, 100, 300],
                requireInteraction: true
            },
            fcmOptions: {
                link: "/delivery"
            }
        }
    };

    let totalSuccess = 0;
    let totalFailure = 0;
    const allFailedTokens = [];

    for (let i = 0; i < validTokens.length; i += 500) {
        const chunk = validTokens.slice(i, i + 500);
        try {
            const response = await admin.messaging().sendEachForMulticast({ ...payload, tokens: chunk });
            totalSuccess += response.successCount;
            totalFailure += response.failureCount;

            if (response.failureCount > 0) {
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        const code = resp.error?.code;
                        if (code === 'messaging/invalid-registration-token' || code === 'messaging/registration-token-not-registered') {
                            allFailedTokens.push(chunk[idx]);
                        }
                    }
                });
            }
        } catch (err) {
            console.error("Batch send failed:", err);
        }
    }

    if (allFailedTokens.length > 0) {
        try {
            await admin.firestore().collection("delivery_boys").doc(newNotification.deliveryBoyId).update({
                tokens: admin.firestore.FieldValue.arrayRemove(...allFailedTokens)
            });
            console.log(`Cleaned up ${allFailedTokens.length} invalid tokens for delivery boy ${newNotification.deliveryBoyId}.`);
        } catch (err) {
            console.error("Failed to clean up delivery boy tokens:", err);
        }
    }

    console.log(`Delivery notification sent to ${newNotification.deliveryBoyId}: ${totalSuccess} success, ${totalFailure} failed.`);
});

