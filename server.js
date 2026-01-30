// تجاوز قيود الأمان للشهادات لضمان الاتصال بـ Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const express = require("express");
const { Pool } = require("pg");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// إعداد الاتصال باستخدام DATABASE_URL من Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// اختبار الاتصال الابتدائي
pool.connect((err) => {
    if (err) console.error('❌ فشل الاتصال بقاعدة البيانات:', err.message);
    else console.log('✅ السيرفر متصل تماماً وقاعدة البيانات جاهزة!');
});

// --- وظيفة الحجز ---
app.post("/bookings", async (req, res) => {
    const { hotelId, fullName, email, checkIn, checkOut, totalPrice } = req.body;
    try {
        const query = `
            INSERT INTO bookings (hotelid, fullname, email, checkin, checkout, totalprice) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
        `;
        const result = await pool.query(query, [hotelId, fullName, email, checkIn, checkOut, totalPrice]);
        res.json({ success: true, id: result.rows[0].id });
    } catch (err) {
        console.error("❗ خطأ في تنفيذ الحجز:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- جلب الفنادق ---
app.get("/hotels", async (req, res) => {
    try {
        const results = await pool.query("SELECT * FROM hotels ORDER BY id ASC");
        res.json(results.rows);
    } catch (err) { 
        res.status(500).send(err.message); 
    }
});

// --- تتبع الحجوزات ---
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
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// --- وظيفة الشات بوت (AI) ---
app.post('/ask-ai', async (req, res) => {
    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "أنت مساعد سياحي خبير في سوريا." },
                { role: "user", content: req.body.prompt }
            ]
        }, { 
            headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}` } 
        });
        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ reply: "عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 السيرفر يعمل الآن على المنفذ ${PORT}`));
