const express = require("express");
const mysql = require("mysql2"); 
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// بيانات الاتصال الخارجي (Public) من صورتك رقم 8888
const db = mysql.createPool({
    host: 'yamabiko.proxy.rlwy.net', 
    user: 'root',
    password: 'wrJQGvQoHMzcGtatSECXmBUWcSyOonBU',
    database: 'railway',
    port: 31652, // المنفذ الخارجي المهم جداً
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// اختبار الاتصال
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ فشل الاتصال بريلوي:', err.message);
    } else {
        console.log('✅ السيرفر متصل بنجاح بقاعدة البيانات الخارجية!');
        connection.release();
    }
});

// جلب الفنادق
app.get("/hotels", (req, res) => {
    db.query("SELECT * FROM hotels ORDER BY id ASC", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// تنفيذ الحجز
app.post("/bookings", (req, res) => {
    const { hotelId, fullName, email, checkIn, checkOut, totalPrice } = req.body;
    const query = "INSERT INTO bookings (hotelid, fullname, email, checkin, checkout, totalprice) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(query, [hotelId, fullName, email, checkIn, checkOut, totalPrice], (err, result) => {
        if (err) {
            console.error("❌ خطأ حجز:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, id: result.insertId });
    });
});

// تتبع الحجوزات
app.get('/my-bookings/:email', (req, res) => {
    const query = "SELECT b.*, h.name AS hotelname FROM bookings b LEFT JOIN hotels h ON b.hotelid = h.id WHERE b.email = ? ORDER BY b.id DESC";
    db.query(query, [req.params.email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// مساعد الذكاء الاصطناعي
app.post('/ask-ai', async (req, res) => {
    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: "أنت مساعد سياحي في سوريا." }, { role: "user", content: req.body.prompt }]
        }, { headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}` } });
        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ reply: "الخدمة غير متاحة." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`));
