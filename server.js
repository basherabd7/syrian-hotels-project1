const express = require("express");
const mysql = require("mysql2");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// إعداد الاتصال بريلوي (الذي نجح معك)
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

// وظيفة جلب الفنادق مع الفلترة (إصلاح أسماء الحقول لتطابق قاعدتك)
app.get("/hotels", (req, res) => {
    const { location, stars, maxPrice } = req.query;
    // نستخدم province بدلاً من location لتظهر المحافظة
    let query = "SELECT * FROM hotels WHERE 1=1";
    let params = [];

    if (location && location !== '') {
        query += " AND province = ?";
        params.push(location);
    }
    if (stars && stars !== '') {
        query += " AND stars = ?";
        params.push(stars);
    }
    if (maxPrice && maxPrice !== '') {
        query += " AND price <= ?";
        params.push(parseFloat(maxPrice));
    }

    query += " ORDER BY id ASC";
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// وظيفة الحجز (تعمل بنجاح ولا نغيرها)
app.post("/bookings", (req, res) => {
    const { hotelId, fullName, email, checkIn, checkOut, totalPrice } = req.body;
    const query = "INSERT INTO bookings (hotelid, fullname, email, checkin, checkout, totalprice) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(query, [hotelId, fullName, email, checkIn, checkOut, totalPrice], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, id: result.insertId });
    });
});

// وظيفة تتبع الحجز (لتعمل في الصفحة الأولى)
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

// وظيفة الذكاء الاصطناعي
app.post('/ask-ai', async (req, res) => {
    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "أنت مساعد سياحي في سوريا." },
                { role: "user", content: req.body.prompt }
            ]
        }, {
            headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}` }
        });
        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ reply: "عذراً، الخدمة غير متاحة." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`));
