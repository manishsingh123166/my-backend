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
const IPDATA_API_KEY = process.env.IPDATA_API_KEY;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// ====== 3. Connections Banaao ======
const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
console.log("Saare connections taiyaar hain!");


// ================================================================
// === BHAI, YEH SABSE ZAROORI HISSA HAI (COURSE DATABASE) ===
// ================================================================

// Server par aapke sabhi courses ki ek "database" bana rahe hain.
// IMPORTANT: Yahan par har course ki ID aur Price daalna zaroori hai.
// Yeh ID aapke Firebase/Firestore waali course ID se bilkul same honi chahiye.

const coursesDatabase = {
    // FORMAT: "FirebaseCourseID": { name: "Course Ka Naam", priceINR: Price_in_Rupees, priceUSD: Price_in_Dollars },
    
    // Yahan apni asli Firebase Course IDs aur unke price daalo. Main Example de raha hoon:
    "Jqj5gP2fXyYzAbCdeFgh": { name: "Go Viral On Your Phone", priceINR: 350, priceUSD: 4.50 },
    "KlmN8oPqRsTuVwXyZ123": { name: "Web Development Fundamentals", priceINR: 299, priceUSD: 4.00 },
    
    // Aapke jitne bhi courses hain, un sabko yahan aise hi add karte jao
    // "TeesraCourseID": { name: "Course Ka Naam", priceINR: 499, priceUSD: 6.00 }
};


// ================================================================
// === LOCATION CHECK WALA CODE (Ismein koi badlav nahi) ===
// ================================================================
app.get('/get-location-info', async (req, res) => {
    try {
        const ip = req.ip;
        const response = await axios.get(`https://api.ipdata.co/${ip}?api-key=${IPDATA_API_KEY}`);
        res.json({ country: response.data.country_code });
    } catch (error)
    {
        console.error("IP se location पता karne me error aaya:", error.message);
        res.status(500).json({ country: 'IN' });
    }
});


// ====== PayPal Helper Function (Ismein koi badlav nahi) ======
const createPayPalOrder = async (totalAmountUSD) => {
    const auth = Buffer.from(PAYPAL_CLIENT_ID + ':' + PAYPAL_CLIENT_SECRET).toString('base64');
    const response = await axios.post(
        'https://api.paypal.com/v1/oauth2/token', // IMPORTANT: Sandbox se Live URL par switch karo
        'grant_type=client_credentials', 
        { headers: { 'Authorization': `Basic ${auth}` } }
    );
    const accessToken = response.data.access_token;

    const orderResponse = await axios.post('https://api.paypal.com/v2/checkout/orders', {
        intent: 'CAPTURE',
        purchase_units: [{
            amount: {
                currency_code: 'USD',
                value: totalAmountUSD.toFixed(2).toString()
            }
        }]
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    });
    return orderResponse.data;
};


// ====== 4. Main API (YAHAN PAR TOTAL AMOUNT FIX KAR DIYA GAYA HAI) ======
app.post('/create-order', async (req, res) => {
    try {
        const { items, gatewayPreference } = req.body; // items mein ab course IDs hain
        if (!items || items.length === 0) {
            return res.status(400).send("Cart khali hai.");
        }

        // Step 1: Server par total amount calculate karo (security ke liye)
        let totalAmountINR = 0;
        let totalAmountUSD = 0;

        for (const courseId of items) {
            const course = coursesDatabase[courseId];
            if (course) {
                totalAmountINR += course.priceINR;
                totalAmountUSD += course.priceUSD;
            } else {
                // Agar frontend se koi galat ID aa gayi toh error bhej do
                console.error(`Error: Course ID "${courseId}" server ki database mein nahi mili.`);
                return res.status(400).send(`Error: Course ID "${courseId}" nahi mila.`);
            }
        }

        // Step 2: Ab sahi total se order banega
        if (gatewayPreference === 'razorpay') {
            const totalAmountInPaise = Math.round(totalAmountINR * 100);
            const options = { amount: totalAmountInPaise, currency: "INR", receipt: `receipt_${Date.now()}` };
            const order = await razorpay.orders.create(options);
            
            console.log(`Razorpay order ban gaya! Sahi Amount: ₹${totalAmountINR}`);
            res.json({ gateway: 'razorpay', orderDetails: order });

        } else if (gatewayPreference === 'paypal') {
            const order = await createPayPalOrder(totalAmountUSD);
            
            console.log(`PayPal order ban gaya! Sahi Amount: $${totalAmountUSD}`);
            res.json({ gateway: 'paypal', orderDetails: order });
            
        } else {
            res.status(400).send("Sahi gateway nahi chuna gaya.");
        }
    } catch (error) {
        console.error("Order banane me bhayankar error:", error.response ? error.response.data : error.message);
        res.status(500).send("Server me order banate waqt error aa gaya");
    }
});


// ====== 5. Server ko Chalu Karo ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Final A-One server ${PORT} par chalu ho gaya hai!`));