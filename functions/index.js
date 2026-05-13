const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Configure the email transporter
// RECOMMENDATION: Replace these with your actual credentials
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'chilliesrestaurant52@gmail.com', 
        pass: 'erei wdxz vvln eeio'    
    }
});

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
            fcmOptions: { link: "/admin" },
            notification: {
                title: title,
                body: bodyText,
                icon: "/pwa-192x192.png",
                requireInteraction: true,
                vibrate: [500, 1000, 500, 1000]
            }
        }
    };

    const result = await sendMulticastBatched(adminTokens, payload);
    console.log(`Order notification: ${result.successCount} sent, ${result.failureCount} failed.`);

    // Send Email Alert
    try {
        const mailOptions = {
            from: '"CHILLIES ORDERS" <chilliesrestaurant52@gmail.com>', 
            to: 'chilliesrestaurant52@gmail.com', 
            subject: `🔥 NEW ORDER: ${newOrder.id} - ₹${newOrder.total}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #d4af37; text-align: center;">New Order Received!</h2>
                    <p><strong>Order ID:</strong> ${newOrder.id}</p>
                    <p><strong>Customer:</strong> ${newOrder.customerName}</p>
                    <p><strong>Phone:</strong> ${newOrder.phone || 'N/A'}</p>
                    <p><strong>Type:</strong> ${newOrder.type}</p>
                    <p><strong>Total:</strong> ₹${newOrder.total}</p>
                    <hr/>
                    <h3>Items:</h3>
                    <ul>
                        ${newOrder.items.map(item => `<li>${item.quantity}x ${item.name}</li>`).join('')}
                    </ul>
                    <hr/>
                    <p style="font-size: 12px; color: #888;">This is an automated alert from your restaurant dashboard.</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log("Order email alert sent successfully.");
    } catch (error) {
        console.error("Failed to send order email:", error);
    }
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
        }
    };

    const result = await sendMulticastBatched(adminTokens, payload);
    console.log(`Test notification: ${result.successCount} sent, ${result.failureCount} failed.`);
});

