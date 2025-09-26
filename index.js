// ====== 1. Saare Zaroori Packages ======
const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// ====== 2. Saari SECRET KEYS ek jagah daalo ======
// YEH AAPKE COMPUTER PAR TESTING KE LIYE HAIN. LIVE SERVER RENDER SE KEYS LEGA.
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_live_RLkItpyfR0k6sx';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'G2NA6Ky49B4UqyKkz5mdur3b';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'Ae9RSMe8RbD2q3YWB-LMnfjThmOA2-WKkgs1DhGcgdUAGI39DxfrHdjNeCDmUkbvV-i2IebWm7Js9B8';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || 'ELZsokNzaJ9DuftQSTEujnR-dhx1EpyTtmaexTdMLH3RYiucEYpZDnLJcJu16r_0QkPSQ2nt2v9o0pls';


// ====== 3. Connections Banaao ======
const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });


// ====== 4. Main API (Final Sahi Code) ======
app.post('/create-order', async (req, res) => {
    try {
        const { items } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).send("Cart khali hai. Please add items.");
        }

        const pricePerCourseINR = 199;
        const totalAmount = items.length * pricePerCourseINR;
        const totalAmountInPaise = totalAmount * 100;

        // Customer ka asli IP Address pata karo
        const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        console.log("Customer ka Asli IP Hai:", userIp);

        // Nayi company se IP se country pata karo
        const ipApiResponse = await axios.get(`http://ip-api.com/json/${userIp}`);
        // ***** YAHAN PAR CODE THEEK KIYA GAYA HAI *****
        const country = ipApiResponse.data.countryCode; // country_code ki jagah countryCode
        
        console.log("User ki Asli country hai:", country);

        if (country === 'IN') {
            console.log(`Razorpay process shuru kar rahe hain... Amount: ₹${totalAmount}`);
            const options = { amount: totalAmountInPaise, currency: "INR", receipt: `receipt_order_${Date.now()}` };
            const order = await razorpay.orders.create(options);
            console.log("Razorpay order safaltapoorvak ban gaya:", order);
            res.json({ gateway: 'razorpay', orderDetails: order });
        } else {
            console.log("International User hai. PayPal process shuru kar rahe hain...");
            res.json({ gateway: 'paypal', message: 'PayPal coming soon' });
        }

    } catch (error) {
        console.error("--- BHAYANKAR ERROR AAYA HAI ---");
        if (error) { 
            console.error("Asli Error Message:", error.message); 
            if(error.response) { 
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