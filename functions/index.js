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

    const payload = {
      data: {
        title: "NEW ORDER: ₹" + newOrder.total,
        body: `Order #${newOrder.id} received from ${newOrder.customerName}.`,
        orderId: newOrder.id,
        click_action: "FLUTTER_NOTIFICATION_CLICK"
      }
    };

    try {
        const response = await admin.messaging().sendEachForMulticast({
            tokens: adminTokens,
            data: payload.data
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
