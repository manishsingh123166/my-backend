// ====== 1. Saare Zaroori Packages ======
const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const axios = require('axios'); // IP address se country pata karne ke liye

const app = express();
app.use(cors());
app.use(express.json()); // body-parser ki zaroorat nahi, express mein ab yeh built-in hai

// ====== 2. Saari SECRET KEYS ek jagah daalo ======
// APNI KEYS DOBARA CHECK KARKE SAHI SE PASTE KARO BINA KISI EXTRA SPACE/LINE KE
const RAZORPAY_KEY_ID = 'rzp_live_RLkItpyfR0k6sx';
const RAZORPAY_KEY_SECRET = 'G2NA6Ky49B4UqyKkz5mdur3b'; // <-- Galti yahan thi. Maine theek kar di hai.

// PayPal keys bhi theek kar di hain
const PAYPAL_CLIENT_ID = 'Ae9RSMe8RbD2q3YWB-LMnfjThmOA2-WKkgs1DhGcgdUAGI39DxfrHdjNeCDmUkbvV-i2IebWm7Js9B8';
const PAYPAL_CLIENT_SECRET = 'ELZsokNzaJ9DuftQSTEujnR-dhx1EpyTtmaexTdMLH3RYiucEYpZDnLJcJu16r_0QkPSQ2nt2v9o0pls';


// ====== 3. Connections Banaao ======
const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });


// ====== 4. Main API (Frontend se connect karne ke liye update kar diya hai) ======
app.post('/create-order', async (req, res) => {
    try {
        // Step 1: Frontend se bheje gaye cart items ko yahan get karo
        const { items } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).send("Cart khali hai. Please add items.");
        }

        // Abhi ke liye, maan lete hain ki har course ki price ₹199 hai
        // Asli project mein, aap in item IDs se database se price nikaloge
        const pricePerCourseINR = 199;
        const totalAmount = items.length * pricePerCourseINR;
        const totalAmountInPaise = totalAmount * 100; // Razorpay ke liye paise me convert karna zaroori hai

        // Step 2: User ki country pata karo
        const ipApiResponse = await axios.get('https://ipapi.co/json');
        const country = ipApiResponse.data.country_code;
        console.log("User ki country hai:", country);

        // Step 3: Country ke hisab se payment gateway chuno
        if (country === 'IN') {
            console.log(`Razorpay process shuru kar rahe hain... Amount: ₹${totalAmount}`);

            const options = {
                amount: totalAmountInPaise,
                currency: "INR",
                receipt: `receipt_order_${Date.now()}`
            };

            const order = await razorpay.orders.create(options);
            console.log("Razorpay order safaltapoorvak ban gaya:", order);
            res.json({ gateway: 'razorpay', orderDetails: order });

        } else {
            console.log("International User hai. PayPal process shuru kar rahe hain...");
            // Yahan par aapka PayPal order banane ka code aayega
            // Abhi ke liye temporary message bhej rahe hain
            res.json({ gateway: 'paypal', message: 'PayPal coming soon' });
        }

    } catch (error) {
        // ===== YAHAN HUMNE ERROR KO ACCHE SE CHECK KARNE KA CODE DAALA HAI =====
        console.error("--- BHAYANKAR ERROR AAYA HAI ---");
        if (error) {
            console.error("Asli Error Message:", error.message);
            if(error.response) { // Agar network se error hai
                 console.error("Error Data:", error.response.data);
            }
        } else {
            console.error("Ek ajeeb 'undefined' error aaya hai. API Keys dobara check karo.");
        }
        res.status(500).send("Server me error aa gaya");
    }
});


// ====== 5. Server ko Chalu Karo ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Final server port ${PORT} par chalu ho gaya hai!`);
});