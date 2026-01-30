const express = require("express");
const { Pool } = require("pg");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// إعداد الاتصال بـ Supabase (باستخدام رابط الـ Pooler الذي وضعته)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
});

// اختبار الاتصال فور التشغيل
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ خطأ في الاتصال الابتدائي:', err.message);
    } else {
        console.log('✅ تم الاتصال بـ Supabase بنجاح!');
        release();
    }
});

// --- إضافة حجز جديد مع كشف أعطال دقيق ---
app.post("/bookings", async (req, res) => {
    // 1. طباعة البيانات التي أرسلها المتصفح (لنرى هل هي ناقصة؟)
    console.log("📥 بيانات الحجز الواردة:", req.body);

    const { hotelId, fullName, email, checkIn, checkOut, totalPrice } = req.body;

    try {
        // 2. محاولة الكتابة في الجدول
        const query = `
            INSERT INTO bookings (hotelid, fullname, email, checkin, checkout, totalprice) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
        `;
        const values = [
            hotelId || null, 
            fullName || null, 
            email || null, 
            checkIn || null, 
            checkOut || null, 
            totalPrice || 0
        ];

        const result = await pool.query(query, values);
        
        console.log("🚀 نجح الحجز! رقم السجل في القاعدة:", result.rows[0].id);
        res.json({ message: "تم الحجز بنجاح واحتسابه في السجلات!" });

    } catch (err) {
        // 3. طباعة الخطأ الحقيقي (هنا سنعرف العطل 100%)
        console.error("❗ عطل في قاعدة البيانات:", err.message);
        console.error("❗ التفاصيل الكاملة للخطأ:", err);

        res.status(500).json({ 
            error: "فشل الحجز تقنياً", 
            details: err.message 
        });
    }
});

// --- جلب الفنادق ---
app.get("/hotels", async (req, res) => {
    try {
        const results = await pool.query("SELECT * FROM hotels ORDER BY id ASC");
        res.json(results.rows.map(h => ({
            Id: h.id, Name: h.name, Province: h.province, Stars: h.stars,
            Price: h.price, Description: h.description, Image: h.image
        })));
    } catch (err) { 
        console.error("❌ فشل جلب الفنادق:", err.message);
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
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- الشات بوت ---
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
