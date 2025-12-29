const express = require("express");
const mysql = require("mysql2"); 
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// تشغيل السيرفر ليخدم ملفات الموقع الأمامية من المجلد الحالي
app.use(express.static(path.join(__dirname)));

// --- إعدادات الاتصال بالسيرفر السحابي (Railway) ---
const db = mysql.createConnection({
    host: "switchback.proxy.rlwy.net", 
    user: "root", 
    password: "AVBCkmCsRuvaorIcHRjBZxMflPGeyQJi", 
    database: "railway", 
    port: 55494, 
    ssl: {
        rejectUnauthorized: false 
    }
});

db.connect(err => {
    if (err) {
        console.error(" ❌ MySQL Connection Error: " + err.message);
        return;
    }
    console.log(" ✅ Connected to Cloud MySQL Database (Railway)");
});

// --- مسار إضافي للتأكد من تشغيل الصفحة الرئيسية عند فتح الرابط ---
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// --- جلب الفنادق ---
app.get("/hotels", (req, res) => {
    const query = "SELECT * FROM hotels"; 
    db.query(query, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// --- اضافة حجز ---
app.post("/bookings", (req, res) => {
    const { hotelId, fullName, email, checkIn, checkOut, totalPrice } = req.body;

    const query = "INSERT INTO bookings (HotelId, FullName, Email, CheckIn, CheckOut, TotalPrice) VALUES (?, ?, ?, ?, ?, ?)";
    
    db.query(query, [hotelId, fullName, email, checkIn, checkOut, totalPrice], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "تم الحجز بنجاح", id: result.insertId });
    });
});

// --- الشات بوت ---
app.post('/ask-ai', async (req, res) => {
    const { prompt } = req.body;
    const GROQ_API_KEY = "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"; 

    try {
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "أنت مساعد سياحي خبير في سوريا. أجب باللغة العربية بأسلوب ودود ومختصر." },
                    { role: "user", content: prompt }
                ]
            },
            { headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" } }
        );

        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ reply: "عذراً، تأكد من تشغيل الـ VPN على الجهاز." });
    }
});

// --- جلب الحجوزات ---
app.get('/my-bookings/:email', (req, res) => {
    const email = req.params.email;
    const sql = `
        SELECT b.*, h.Name AS hotelName 
        FROM bookings b 
        LEFT JOIN hotels h ON b.HotelId = h.Id 
        WHERE b.Email = ?`;

    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- إلغاء الحجز ---
app.delete('/cancel-booking/:id', (req, res) => {
    const bookingId = req.params.id;
    const sql = "DELETE FROM bookings WHERE Id = ?"; 

    db.query(sql, [bookingId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "تم إلغاء الحجز بنجاح" });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});