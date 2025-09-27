// ====== 1. Saare Zaroori Packages ======
const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const admin = require('firebase-admin'); // Naya package add kiya

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = ['https://skillpermium.store', 'https://www.skillpermium.store'];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// ====== 2. Firebase Admin ko Setup Karna (Automatic System) ======
try {
  // Service key ko environment variable se nikalna
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();
  console.log("Firebase se successfully connect ho gaya!");
} catch (error) {
  console.error("Firebase se connect karne mein BHYANKAR error aaya:", error);
}

// ====== 3. Saari SECRET KEYS ======
const IPDATA_API_KEY = process.env.IPDATA_API_KEY;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// ====== 4. Connections Banaao ======
const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
console.log("Saare connections taiyaar hain!");

// ====== LOCATION CHECK WALA CODE (Ismein koi badlav nahi) ======
app.get('/get-location-info', async (req, res) => {
    // ... (ye function jaisa tha waisa hi rahega, no change)
});

// ====== PayPal Helper Function (Ismein koi badlav nahi) ======
const createPayPalOrder = async (totalAmountUSD) => {
    // ... (ye function jaisa tha waisa hi rahega, no change)
};

// ====== 5. Main API (Yeh ab poori tarah Automatic hai!) ======
app.post('/create-order', async (req, res) => {
    try {
        const { items, gatewayPreference } = req.body;
        if (!items || items.length === 0) return res.status(400).send("Cart khali hai.");

        let totalAmountINR = 0;
        let totalAmountUSD = 0;

        // Step 1: Har course ka price live Firebase se pucho
        const coursePromises = items.map(courseId => 
            admin.firestore().collection('courses').doc(courseId).get()
        );
        const courseSnapshots = await Promise.all(coursePromises);

        // Step 2: Total amount calculate karo
        for (const doc of courseSnapshots) {
            if (!doc.exists) {
                console.error(`Error: Course ID "${doc.id}" Firebase mein nahi mili.`);
                return res.status(400).send(`Error: Ek course cart mein nahi mil paaya.`);
            }
            const courseData = doc.data();
            totalAmountINR += courseData.priceINR;
            totalAmountUSD += courseData.priceUSD;
        }
        
        console.log(`Live price check kiya gaya. Total INR: ${totalAmountINR}, Total USD: ${totalAmountUSD}`);

        // Step 3: Sahi total ke saath order banao
        if (gatewayPreference === 'razorpay') {
            const totalAmountInPaise = Math.round(totalAmountINR * 100);
            const options = { amount: totalAmountInPaise, currency: "INR", receipt: `receipt_${Date.now()}` };
            const order = await razorpay.orders.create(options);
            res.json({ gateway: 'razorpay', orderDetails: order });
        } else if (gatewayPreference === 'paypal') {
            const order = await createPayPalOrder(totalAmountUSD);
            res.json({ gateway: 'paypal', orderDetails: order });
        } else {
            res.status(400).send("Sahi gateway nahi chuna gaya.");
        }
    } catch (error) {
        console.error("Order banane me bhayankar error:", error.response ? error.response.data : error.message);
        res.status(500).send("Server me order banate waqt error aa gaya");
    }
});

// ====== 6. Server ko Chalu Karo ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Final Automatic server ${PORT} par chalu ho gaya hai!`));