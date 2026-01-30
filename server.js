const express = require("express");
const mysql = require("mysql2"); // التغيير الأساسي لدعم MySQL
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// إعداد الاتصال باستخدام المتغيرات التي أضفتها في Render
const db = mysql.createPool({
    // استخدم العنوان العام (Public) من ريلوي
    host: 'yamabiko.proxy.rlwy.net', 
    user: 'root',
    password: 'wrJQGvQoHMzcGtatSECXmBUWcSyOonBU',
    database: 'railway',
    port: 31652, // المنفذ الخارجي من صورتك
    waitForConnections: true,
    connectionLimit: 10
});

// اختبار الاتصال بنجاح عند تشغيل السيرفر
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ فشل الاتصال بقاعدة بيانات ريلوي:', err.message);
    } else {
        console.log('✅ السيرفر متصل بنجاح بقاعدة بيانات MySQL (Railway)!');
        connection.release();
    }
});

// --- 1. وظيفة جلب كافة الفنادق (13 فندقاً) ---
app.get("/hotels", (req, res) => {
    db.query("SELECT * FROM hotels ORDER BY id ASC", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- 2. وظيفة إرسال حجز جديد ---
app.post("/bookings", (req, res) => {
    const { hotelId, fullName, email, checkIn, checkOut, totalPrice } = req.body;
    const query = "INSERT INTO bookings (hotelid, fullname, email, checkin, checkout, totalprice) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(query, [hotelId, fullName, email, checkIn, checkOut, totalPrice], (err, result) => {
        if (err) {
            console.error("❌ خطأ أثناء الحجز:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, id: result.insertId });
    });
});

// --- 3. وظيفة تتبع الحجوزات عبر البريد الإلكتروني ---
app.get('/my-bookings/:email', (req, res) => {
    const query = `
        SELECT b.*, h.name AS hotelname 
        FROM bookings b 
        LEFT JOIN hotels h ON b.hotelid = h.id 
        WHERE b.email = ? 
        ORDER BY b.id DESC`;
    db.query(query, [req.params.email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- 4. وظيفة مساعد الذكاء الاصطناعي (AI Assistant) ---
app.post('/ask-ai', async (req, res) => {
    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "أنت مساعد سياحي خبير في سوريا. ساعد المستخدمين في اختيار الفنادق وتنظيم رحلاتهم." },
                { role: "user", content: req.body.prompt }
            ]
        }, { 
            headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}` } 
        });
        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        console.error("❌ عطل في AI:", error.message);
        res.status(500).json({ reply: "عذراً، نظام الذكاء الاصطناعي غير متاح حالياً." });
    }
});

// تشغيل السيرفر على المنفذ المحدد
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل الآن على المنفذ ${PORT}`);
});

