const express = require("express");
const mysql = require("mysql2"); 
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname)));

// إعداد الاتصال مع إضافة SSL لدعم Aiven Cloud
const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false // هذا السطر يحل مشكلة رفض الاتصال من قبل السيرفر السحابي
    }
});

const db = pool.promise();

// --- جلب الفنادق متوافق مع الأسماء الكبيرة والصغيرة ---
app.get("/hotels", async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM hotels");
        const formattedResults = results.map(hotel => {
            return {
                Id: hotel.Id || hotel.id,
                id: hotel.Id || hotel.id,
                Name: hotel.Name || hotel.name,
                name: hotel.Name || hotel.name,
                Province: hotel.Province || hotel.province,
                province: hotel.Province || hotel.province,
                Stars: hotel.Stars || hotel.stars,
                stars: hotel.Stars || hotel.stars,
                Price: hotel.Price || hotel.price,
                price: hotel.Price || hotel.price,
                Description: hotel.Description || hotel.description,
                description: hotel.Description || hotel.description,
                Image: hotel.Image || hotel.image,
                image: hotel.Image || hotel.image
            };
        });
        res.json(formattedResults);
    } catch (err) { 
        res.status(500).send(err); 
    }
});

// --- إرسال الحجز  ---
app.post("/bookings", async (req, res) => {
    const { hotelId, fullName, email, checkIn, checkOut, totalPrice } = req.body;
    try {
        await db.query("INSERT INTO bookings (HotelId, FullName, Email, CheckIn, CheckOut, TotalPrice) VALUES (?, ?, ?, ?, ?, ?)", 
        [hotelId, fullName, email, checkIn, checkOut, totalPrice]);
        res.json({ message: "تم الحجز بنجاح" });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// --- الشات بوت الذكي ---
app.post('/ask-ai', async (req, res) => {
    const { prompt } = req.body;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: "أنت مساعد سياحي خبير في سوريا." }, { role: "user", content: prompt }]
        }, { headers: { "Authorization": `Bearer ${GROQ_API_KEY}` } });
        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) { 
        res.status(500).json({ reply: "عذراً، حدث خطأ في معالجة طلب الذكاء الاصطناعي." }); 
    }
});

// --- جلب حجوزات مستخدم محدد ---
app.get('/my-bookings/:email', async (req, res) => {
    try {
        const [results] = await db.query("SELECT b.*, h.Name AS hotelName FROM bookings b LEFT JOIN hotels h ON b.HotelId = h.Id WHERE b.Email = ?", [req.params.email]);
        res.json(results);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// --- إلغاء الحجز ---
app.delete('/cancel-booking/:id', async (req, res) => {
    try { 
        await db.query("DELETE FROM bookings WHERE Id = ?", [req.params.id]); 
        res.json({ message: "تم إلغاء الحجز بنجاح" }); 
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

app.listen(process.env.PORT || 3000);
