// ====== 1. Saare Zaroori Packages ======
const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1); // Yeh Railway/Render jaise platform ke liye zaroori hai

// Server ko batana ki www aur bina www, dono URL se request accept kare
const allowedOrigins = ['https://skillpermium.store', 'https://www.skillpermium.store'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS ne is domain ko block kar diya hai'));
    }
  }
}));

app.use(express.json());

// ====== 2. Saari SECRET KEYS (process.env se aa rahi hain - SAFE TAREEKA) ======
const IPDATA_API_KEY = process.env.IPDATA_API_KEY; // Nayi key yahan add ki
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// ====== 3. Connections Banaao ======
const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
console.log("Saare connections taiyaar hain!");


// ================================================================
// === YEH NYA API ENDPOINT BANAYA GAYA HAI (LOCATION CHECK KE LIYE) ===
// ================================================================
app.get('/get-location-info', async (req, res) => {
    try {
        // User ka asli IP address nikaalo
        const ip = req.ip;

        // ipdata.co se location ki jaankari maango
        const response = await axios.get(`https://api.ipdata.co/${ip}?api-key=${IPDATA_API_KEY}`);
        
        // Frontend ko sirf desh ka code bhejo (e.g., "IN", "US")
        res.json({ country: response.data.country_code });

    } catch (error) {
        console.error("IP se location पता karne me error aaya:", error.message);
        // Agar koi error aaye, toh by default India maan lo
        res.status(500).json({ country: 'IN' });
    }
});
// ================================================================

// ====== PayPal Helper Function (Ismein koi badlav nahi) ======
const createPayPalOrder = async (totalAmountUSD) => {
    // ... (ye function jaisa tha waisa hi rahega, no change)
};


// ====== 4. Main API (Ismein koi badlav nahi) ======
app.post('/create-order', async (req, res) => {
    try {
        const { items, gatewayPreference } = req.body;
        if (!items || items.length === 0) return res.status(400).send("Cart khali hai.");

        if (gatewayPreference === 'razorpay') {
            const pricePerCourseINR = 350;
            const totalAmount = items.length * pricePerCourseINR;
            const totalAmountInPaise = totalAmount * 100;
            const options = { amount: totalAmountInPaise, currency: "INR", receipt: `receipt_${Date.now()}` };
            const order = await razorpay.orders.create(options);
            console.log("Razorpay order ban gaya!");
            res.json({ gateway: 'razorpay', orderDetails: order });

        } else if (gatewayPreference === 'paypal') {
            const pricePerCourseUSD = 4.50;
            const totalAmountUSD = items.length * pricePerCourseUSD;
            const order = await createPayPalOrder(totalAmountUSD);
            console.log("PayPal order ban gaya!");
            res.json({ gateway: 'paypal', orderDetails: order });
        } else {
            res.status(400).send("Sahi gateway nahi chuna gaya.");
        }
    } catch (error) {
        console.error("Order banane me bhayankar error:", error.message);
        res.status(500).send("Server me order banate waqt error aa gaya");
    }
});


// ====== 5. Server ko Chalu Karo ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Final A-One server ${PORT} par chalu ho gaya hai!`));