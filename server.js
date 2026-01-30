const express = require("express");
const { Pool } = require("pg");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- جلب الفنادق  ---
app.get("/hotels", async (req, res) => {
    try {
        const results = await pool.query("SELECT * FROM hotels ORDER BY id ASC");
        const formatted = results.rows.map(h => ({
            Id: h.id, Name: h.name, Province: h.province, Stars: h.stars,
            Price: h.price, Description: h.description, Image: h.image
        }));
        res.json(formatted);
    } catch (err) { res.status(500).send(err.message); }
});

// --- إضافة حجز جديد  ---
app.post("/bookings", async (req, res) => {
    // استلام البيانات بأي صيغة (كبيرة أو صغيرة) لمنع الخطأ
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
        console.error("Database Error:", err.message);
        res.status(500).json({ error: "فشل الحجز تقنياً: " + err.message }); 
    }
});

// --- تتبع الحجوزات (مع JOIN) ---
app.get('/my-bookings/:email', async (req, res) => {
    try {
        const query = `
            SELECT b.*, h.name AS hotelname 
            FROM bookings b 
            LEFT JOIN hotels h ON b.hotelid = h.id 
            WHERE b.email = $1
        `;
        const results = await pool.query(query, [req.params.email]);
        res.json(results.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- الشات بوت ---
app.post('/ask-ai', async (req, res) => {
    const { prompt } = req.body;
    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: "أنت مساعد سياحي خبير في سوريا." }, { role: "user", content: prompt }]
        }, { headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}` } });
        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) { res.status(500).json({ reply: "عذراً، حدث خطأ." }); }
});

app.listen(process.env.PORT || 3000);
