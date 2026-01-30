const express = require("express");
const { Pool } = require("pg");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// الإعداد المصلح لتجاوز خطأ SELF_SIGNED_CERT_IN_CHAIN
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        // هذا السطر هو الحل الجذري لمشكلة الشهادة الأمنية
        rejectUnauthorized: false 
    },
    connectionTimeoutMillis: 10000,
});

// اختبار الاتصال الابتدائي
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ عطل في الاتصال:', err.message);
    } else {
        console.log('✅ السيرفر متصل بـ Supabase وجاهز للحجز!');
        release();
    }
});

// --- وظيفة الحجز المضمونة ---
app.post("/bookings", async (req, res) => {
    console.log("📥 استلام طلب حجز لـ:", req.body.fullName);
    const { hotelId, fullName, email, checkIn, checkOut, totalPrice } = req.body;

    try {
        const query = `
            INSERT INTO bookings (hotelid, fullname, email, checkin, checkout, totalprice) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
        `;
        const result = await pool.query(query, [hotelId, fullName, email, checkIn, checkOut, totalPrice]);
        
        console.log("🚀 تم الحجز بنجاح! المعرف:", result.rows[0].id);
        res.json({ message: "تم الحجز بنجاح واحتسابه في السجلات!" });
    } catch (err) {
        console.error("❗ خطأ في قاعدة البيانات:", err.message);
        res.status(500).json({ error: "فشل الحجز تقنياً", details: err.message });
    }
});

// --- باقي الوظائف (فنادق، تتبع، AI) ---
app.get("/hotels", async (req, res) => {
    try {
        const results = await pool.query("SELECT * FROM hotels ORDER BY id ASC");
        res.json(results.rows.map(h => ({
            Id: h.id, Name: h.name, Province: h.province, Stars: h.stars,
            Price: h.price, Description: h.description, Image: h.image
        })));
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/my-bookings/:email', async (req, res) => {
    try {
        const query = `SELECT b.*, h.name AS hotelname FROM bookings b LEFT JOIN hotels h ON b.hotelid = h.id WHERE b.email = $1 ORDER BY b.id DESC`;
        const results = await pool.query(query, [req.params.email]);
        res.json(results.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/ask-ai', async (req, res) => {
    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: "أنت مساعد سياحي في سوريا." }, { role: "user", content: req.body.prompt }]
        }, { headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}` } });
        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) { res.status(500).json({ reply: "عذراً، الشات بوت غير متاح." }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`));
