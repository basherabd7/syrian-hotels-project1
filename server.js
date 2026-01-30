const express = require("express");
const { Pool } = require("pg"); // استخدام مكتبة pg للربط مع Supabase
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// إعداد الاتصال بـ Supabase باستخدام DATABASE_URL من إعدادات Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// اختبار الاتصال فور تشغيل السيرفر للتأكد من الرابط
pool.connect((err, client, release) => {
    if (err) {
        return console.error('خطأ في الاتصال بـ Supabase:', err.stack);
    }
    console.log('تم الاتصال بقاعدة بيانات Supabase بنجاح!');
    release();
});

// --- 1. جلب الفنادق (متوافق مع الـ 13 فندق التي أضفتها) ---
app.get("/hotels", async (req, res) => {
    try {
        const results = await pool.query("SELECT * FROM hotels ORDER BY id ASC");
        // تحويل الأسماء لتتوافق مع ملفات الـ HTML/JS الخاصة بك
        const formatted = results.rows.map(h => ({
            Id: h.id, 
            Name: h.name, 
            Province: h.province, 
            Stars: h.stars,
            Price: h.price, 
            Description: h.description, 
            Image: h.image
        }));
        res.json(formatted);
    } catch (err) { 
        res.status(500).send("خطأ في جلب الفنادق: " + err.message); 
    }
});

// --- 2. إضافة حجز جديد (حل مشكلة "فشل الحجز") ---
app.post("/bookings", async (req, res) => {
    // استلام البيانات بمرونة (سواء بدأت بحرف كبير أو صغير)
    const hotelId = req.body.hotelId || req.body.HotelId;
    const fullName = req.body.fullName || req.body.FullName;
    const email = req.body.email || req.body.Email;
    const checkIn = req.body.checkIn || req.body.CheckIn;
    const checkOut = req.body.checkOut || req.body.CheckOut;
    const totalPrice = req.body.totalPrice || req.body.TotalPrice;

    try {
        // كتابة أسماء الأعمدة بالأحرف الصغيرة لتطابق Supabase Schema
        const query = `
            INSERT INTO bookings (hotelid, fullname, email, checkin, checkout, totalprice) 
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await pool.query(query, [hotelId, fullName, email, checkIn, checkOut, totalPrice]);
        res.json({ message: "تم الحجز بنجاح" });
    } catch (err) { 
        console.error("خطأ قاعدة البيانات:", err.message);
        res.status(500).json({ error: "فشل الحجز: " + err.message }); 
    }
});

// --- 3. تتبع حجوزات مستخدم محدد ---
app.get('/my-bookings/:email', async (req, res) => {
    try {
        const query = `
            SELECT b.*, h.name AS hotelname 
            FROM bookings b 
            LEFT JOIN hotels h ON b.hotelid = h.id 
            WHERE b.email = $1
            ORDER BY b.createdat DESC
        `;
        const results = await pool.query(query, [req.params.email]);
        res.json(results.rows);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// --- 4. إلغاء الحجز ---
app.delete('/cancel-booking/:id', async (req, res) => {
    try { 
        await pool.query("DELETE FROM bookings WHERE id = $1", [req.params.id]); 
        res.json({ message: "تم إلغاء الحجز بنجاح" }); 
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// --- 5. الشات بوت الذكي ---
app.post('/ask-ai', async (req, res) => {
    const { prompt } = req.body;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "أنت مساعد سياحي خبير في سوريا. أجب باللغة العربية." },
                { role: "user", content: prompt }
            ]
        }, { headers: { "Authorization": `Bearer ${GROQ_API_KEY}` } });
        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) { 
        res.status(500).json({ reply: "عذراً، الشات بوت غير متاح حالياً." }); 
    }
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`السيرفر يعمل الآن على المنفذ ${PORT}`);
});
