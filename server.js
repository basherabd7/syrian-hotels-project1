const express = require("express");
const { Pool } = require("pg");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// إعداد الاتصال بـ Supabase (تأكد من استخدام رابط الـ Pooler في Render)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// اختبار الاتصال عند التشغيل
pool.connect((err, client, release) => {
    if (err) return console.error('❌ فشل الاتصال بـ Supabase:', err.message);
    console.log('✅ السيرفر متصل بـ Supabase وجاهز للعمل!');
    release();
});

// 1. جلب الفنادق
app.get("/hotels", async (req, res) => {
    try {
        const results = await pool.query("SELECT * FROM hotels ORDER BY id ASC");
        res.json(results.rows.map(h => ({
            Id: h.id, Name: h.name, Province: h.province, Stars: h.stars,
            Price: h.price, Description: h.description, Image: h.image
        })));
    } catch (err) { res.status(500).send(err.message); }
});

// 2. إضافة حجز جديد (حل مشكلة الفشل)
app.post("/bookings", async (req, res) => {
    const { hotelId, fullName, email, checkIn, checkOut, totalPrice } = req.body;
    try {
        const query = `
            INSERT INTO bookings (hotelid, fullname, email, checkin, checkout, totalprice) 
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await pool.query(query, [
            hotelId || req.body.HotelId, 
            fullName || req.body.FullName, 
            email || req.body.Email, 
            checkIn || req.body.CheckIn, 
            checkOut || req.body.CheckOut, 
            totalPrice || req.body.TotalPrice
        ]);
        res.json({ message: "تم الحجز بنجاح" });
    } catch (err) {
        console.error("Booking Error:", err.message);
        res.status(500).json({ error: "فشل الحجز: " + err.message });
    }
});

// 3. تتبع الحجوزات (مع دمج اسم الفندق)
app.get('/my-bookings/:email', async (req, res) => {
    try {
        const query = `
            SELECT b.*, h.name AS hotelname 
            FROM bookings b 
            LEFT JOIN hotels h ON b.hotelid = h.id 
            WHERE b.email = $1 ORDER BY b.id DESC
        `;
        const results = await pool.query(query, [req.params.email]);
        res.json(results.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. إلغاء حجز
app.delete('/cancel-booking/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM bookings WHERE id = $1", [req.params.id]);
        res.json({ message: "تم إلغاء الحجز بنجاح" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. الشات بوت
app.post('/ask-ai', async (req, res) => {
    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: "أنت مساعد سياحي في سوريا." }, { role: "user", content: req.body.prompt }]
        }, { headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}` } });
        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) { res.status(500).json({ reply: "عذراً، الشات بوت غير متاح." }); }
});

app.listen(process.env.PORT || 10000);
