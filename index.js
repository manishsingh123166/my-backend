// ====== 1. Saare Zaroori Packages ======
const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// ====== 2. Saari SECRET KEYS (Render par Environment se aur yahan testing ke liye) ======
const IPDATA_API_KEY = process.env.IPDATA_API_KEY || 'c70c9cf7304fd5e84bbd6f1b49107108a745c24f457a6fa5092a898f';
const RAZORPAY_KEY_ID = process.env.rzp_live_RLkItpyfR0k6sx;
const RAZORPAY_KEY_SECRET = process.env.G2NA6Ky49B4UqyKkz5mdur3b;
const PAYPAL_CLIENT_ID = process.env.Ae9RSMe8RbD2q3YWB-LMnfjThmOA2-WKkPgs1DhGcgdUAGI39DxfrHdjNeCDmUkbvV-i2IebWm7Js9B8;
const PAYPAL_CLIENT_SECRET = process.env.ELZsokNzaJ9DuftQSTEujnR-dhx1EpyTtmaexTdMLH3RYiucEYpZDnLJcJu16r_0QkPSQ2nt2v9o0pls

;

// ====== 3. Connections Banaao ======
const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
const PAYPAL_API_BASE = 'https://api-m.paypal.com';

// ====== Helper Function: PayPal ka order banane ke liye ======
const createPayPalOrder = async (totalAmountUSD) => {
    try {
        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
        const tokenResponse = await axios.post(`${PAYPAL_API_BASE}/v1/oauth2/token`, 'grant_type=client_credentials', {
            headers: { 'Authorization': `Basic ${auth}` }
        });
        const accessToken = tokenResponse.data.access_token;

        const orderPayload = {
            intent: 'CAPTURE',
            purchase_units: [{ amount: { currency_code: 'USD', value: totalAmountUSD.toFixed(2) } }]
        };
        const orderResponse = await axios.post(`${PAYPAL_API_BASE}/v2/checkout/orders`, orderPayload, {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
        });
        return orderResponse.data;
    } catch (error) {
        console.error("PayPal order banane me bhayankar error aaya hai:", error.response ? error.response.data : error.message);
        throw new Error("PayPal order creation failed");
    }
};

// ====== 4. Main API (Ekdum Final A-One Code) ======
app.post('/create-order', async (req, res) => {
    try {
        const { items, gatewayPreference } = req.body;
        if (!items || items.length === 0) return res.status(400).send("Cart khali hai.");

        if (gatewayPreference === 'razorpay') {
            const pricePerCourseINR = 199;
            const totalAmount = items.length * pricePerCourseINR;
            const totalAmountInPaise = totalAmount * 100;
            
            console.log(`Razorpay process shuru kar rahe hain...`);
            const options = { amount: totalAmountInPaise, currency: "INR", receipt: `receipt_${Date.now()}` };
            const order = await razorpay.orders.create(options);
            res.json({ gateway: 'razorpay', orderDetails: order });

        } else if (gatewayPreference === 'paypal') {
            const pricePerCourseUSD = 2.50; // Aap isse change kar sakte ho
            const totalAmountUSD = items.length * pricePerCourseUSD;

            console.log(`PayPal process shuru kar rahe hain...`);
            const order = await createPayPalOrder(totalAmountUSD);
            res.json({ gateway: 'paypal', orderDetails: order });

        } else {
            res.status(400).send("Sahi gateway nahi chuna gaya.");
        }
    } catch (error) {
        res.status(500).send("Server me order banate waqt error aa gaya");
    }
});


// ====== 5. Server ko Chalu Karo ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Final A-One server ${PORT} par chalu ho gaya hai!`));