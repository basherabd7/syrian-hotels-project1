const express = require("express");
const mysql = require("mysql2");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 1. الاتصال المباشر الثابت (لم أغير فيه شيء لضمان بقاء الحجز يعمل)
const db = mysql.createPool({
    uri: "mysql://root:wrJQGvQoHMzcGtatSECXmBUWcSyOonBU@yamabiko.proxy.rlwy.net:31652/railway",
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 30000 
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ فشل الاتصال بريلوي:', err.message);
    } else {
        console.log('✅ السيرفر متصل بنجاح بكل الوظائف!');
        connection.release();
    }
});

// 2. وظيفة جلب الفنادق مع تفعيل الفلترة (المحافظة، النجوم، السعر)
app.get("/hotels", (req, res) => {
    const { location, stars, maxPrice } = req.query;
    let query = "SELECT * FROM hotels WHERE 1=1";
    let params = [];

    if (location && location !== 'all') {
        query += " AND location = ?";
        params.push(location);
    }
    if (stars && stars !== 'all') {
        query += " AND stars = ?";
        params.push(stars);
    }
    if (maxPrice) {
        query += " AND price <= ?";
        params.push(maxPrice);
    }

    query += " ORDER BY id ASC";

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 3. وظيفة تنفيذ الحجز (بقيت كما هي لأنها تعمل بنجاح)
app.post("/bookings", (req, res) => {
    const { hotelId, fullName, email, checkIn, checkOut, totalPrice } = req.body;
    const query = "INSERT INTO bookings (hotelid, fullname, email, checkin, checkout, totalprice) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(query, [hotelId, fullName, email, checkIn, checkOut, totalPrice], (err, result) => {
        if (err) {
            console.error("❌ خطأ حجز:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, id: result.insertId });
    });
});

// 4. وظيفة تتبع الحجوزات (تم إصلاح الربط مع جدول الفنادق)
app.get('/my-bookings/:email', (req, res) => {
    // تم تعديل h.Name و h.Id لتطابق الأسماء في قاعدة بياناتك بدقة
    const query = `
        SELECT b.*, h.name AS hotelname 
        FROM bookings b 
        LEFT JOIN hotels h ON b.hotelid = h.id 
        WHERE b.email = ? 
        ORDER BY b.id DESC`;
                   
    db.query(query, [req.params.email], (err, results) => {
        if (err) {
            console.error("❌ خطأ تتبع:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// 5. وظيفة مساعد الذكاء الاصطناعي (كما هي تماماً)
app.post('/ask-ai', async (req, res) => {
    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "أنت مساعد سياحي خبير في سوريا. أجب باختصار وودية." },
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
app.listen(PORT, () => console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`));
