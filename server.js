const express = require("express");
const { Pool } = require("pg"); // مكتبة Postgres الخاصة بـ Supabase
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// إعداد الاتصال بـ Supabase مع تحسينات الاستقرار لمنع أخطاء الشبكة
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000, // مهلة 10 ثوانٍ للاتصال
});

// وظيفة اختبار الاتصال الفوري (ستظهر في Logs الريندر)
const checkDatabaseConnection = async () => {
    try {
        const client = await pool.connect();
        console.log("✅ مبروك: السيرفر متصل الآن بـ Supabase بنجاح!");
        client.release();
    } catch (err) {
        console.error("❌ خطأ حرج في الاتصال:", err.message);
    }
};
checkDatabaseConnection();

// --- 1. جلب الفنادق (الـ 13 فندق التي أضفتها) ---
app.get("/hotels", async (req, res) => {
    try {
        const results = await pool.query("SELECT * FROM hotels ORDER BY id ASC");
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

// --- 2. إضافة حجز جديد (مع معالجة الأسماء الكبيرة والصغيرة) ---
app.post("/bookings", async (req, res) => {
    const hotelId = req.body.hotelId || req.body.HotelId;
    const fullName = req.body.fullName || req.body.FullName;
    const email = req.body.email || req.body.Email;
    const checkIn = req.body.checkIn || req.body.CheckIn;
    const checkOut = req.body.checkOut || req.body.CheckOut;
    const totalPrice = req.body.totalPrice || req.body.TotalPrice;

    try {
        const query = `
            INSERT INTO bookings (hotelid, fullname, email, checkin, checkout, totalprice) 
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await pool.query(query, [hotelId, fullName, email, checkIn, checkOut, totalPrice]);
        res.json({ message: "تم الحجز بنجاح" });
    } catch (err) {
        console.error("خطأ أثناء تنفيذ الحجز:", err.message);
        res.status(500).json({ error: "فشل الحجز: " + err.message });
    }
});

// --- 3. تتبع حجوزات المستخدم ---
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

// --- 4. إلغاء حجز ---
app.delete('/cancel-booking/:id', async (req, res) => {
    try { 
        await pool.query("DELETE FROM bookings WHERE id = $1", [req.params.id]); 
        res.json({ message: "تم إلغاء الحجز بنجاح" }); 
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// --- 5. الشات بوت الذكي (AI) ---
app.post('/ask-ai', async (req, res) => {
    const { prompt } = req.body;
    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "أنت مساعد سياحي خبير في سوريا. أجب باللغة العربية." },
                { role: "user", content: prompt }
            ]
        }, { headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}` } });
        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) { 
        res.status(500).json({ reply: "عذراً، الشات بوت مشغول حالياً." }); 
    }
});

// تشغيل السيرفر على المنفذ المخصص من ريندر
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`السيرفر يعمل الآن على المنفذ ${PORT}`);
});
