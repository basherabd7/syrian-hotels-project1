const express = require("express");
const mysql = require("mysql2");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// تقديم الملفات الثابتة (HTML, CSS, JS) من المجلد الرئيسي
app.use(express.static(path.join(__dirname)));

// إعداد الاتصال بقاعدة بيانات Railway باستخدام المتغيرات من الصورة رقم 6
const db = mysql.createPool({
    host: process.env.MYSQLHOST || 'yamabiko.proxy.rlwy.net', // العنوان الخارجي
    user: process.env.MYSQLUSER || 'root',                  // المستخدم
    password: process.env.MYSQL_ROOT_PASSWORD || 'wrJQGvQoHMzcGtatSECXmBUWcSyOonBU', // كلمة السر
    database: process.env.MYSQLDATABASE || 'railway',       // قاعدة البيانات
    port: process.env.MYSQLPORT || 31652,                   // المنفذ الخارجي المهم
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 20000 
});

// اختبار الاتصال عند تشغيل السيرفر للتأكد من نجاح الربط
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', err.message);
    } else {
        console.log('✅ السيرفر متصل بنجاح بقاعدة البيانات الخارجية (Railway Proxy)!');
        connection.release();
    }
});

// جلب قائمة الفنادق من قاعدة البيانات
app.get("/hotels", (req, res) => {
    db.query("SELECT * FROM hotels ORDER BY id ASC", (err, results) => {
        if (err) {
            return res.status(500).json({ error: "خطأ في جلب البيانات" });
        }
        res.json(results);
    });
});

// إضافة حجز جديد إلى جدول bookings
app.post("/bookings", (req, res) => {
    const { hotelId, fullName, email, checkIn, checkOut, totalPrice } = req.body;
    
    const query = `INSERT INTO bookings (hotelid, fullname, email, checkin, checkout, totalprice) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
                   
    db.query(query, [hotelId, fullName, email, checkIn, checkOut, totalPrice], (err, result) => {
        if (err) {
            console.error("❌ خطأ أثناء الحجز:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, id: result.insertId });
    });
});

// جلب حجوزات مستخدم معين عن طريق الإيميل
app.get('/my-bookings/:email', (req, res) => {
    const query = `SELECT b.*, h.name AS hotelname 
                   FROM bookings b 
                   LEFT JOIN hotels h ON b.hotelid = h.id 
                   WHERE b.email = ? 
                   ORDER BY b.id DESC`;
                   
    db.query(query, [req.params.email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// مساعد الذكاء الاصطناعي (Groq AI)
app.post('/ask-ai', async (req, res) => {
    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "أنت مساعد سياحي خبير في سوريا. أجب باختصار وودية." },
                { role: "user", content: req.body.prompt }
            ]
        }, {
            headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}` } // قراءة المفتاح من المتغيرات
        });
        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ reply: "عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً." });
    }
});

// تشغيل السيرفر على المنفذ المحدد من قبل Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل الآن على المنفذ ${PORT}`);
});
