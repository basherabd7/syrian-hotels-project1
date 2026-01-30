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
    ssl: { rejectUnauthorized: false }, // إصلاح عطل الشهادة الأمنية
    connectionTimeoutMillis: 10000,
});

// اختبار الاتصال الابتدائي للتأكد في الـ Logs
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ عطل في الاتصال:', err.message);
    } else {
        console.log('✅ السيرفر متصل وجاهز لتنفيذ الحجوزات!');
        release();
    }
});

app.post("/bookings", async (req, res) => {
    console.log("📥 استلام طلب حجز لـ:", req.body.fullName);
    const { hotelId, fullName, email, checkIn, checkOut, totalPrice } = req.body;

    try {
        const query = `
            INSERT INTO bookings (hotelid, fullname, email, checkin, checkout, totalprice) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
        `;
        // استخدام أسماء الأعمدة كما ظهرت في صورتك لقاعدة البيانات
        const result = await pool.query(query, [hotelId, fullName, email, checkIn, checkOut, totalPrice]);
        
        console.log("🚀 نجاح! تم تسجيل الحجز برقم:", result.rows[0].id);
        res.json({ message: "تم الحجز بنجاح واحتسابه في السجلات!" });
    } catch (err) {
        console.error("❗ عطل في قاعدة البيانات:", err.message);
        res.status(500).json({ error: "فشل الحجز تقنياً", details: err.message });
    }
});

// دالة جلب الفنادق
app.get("/hotels", async (req, res) => {
    try {
        const results = await pool.query("SELECT * FROM hotels ORDER BY id ASC");
        res.json(results.rows.map(h => ({
            Id: h.id, Name: h.name, Province: h.province, Stars: h.stars,
            Price: h.price, Description: h.description, Image: h.image
        })));
    } catch (err) { res.status(500).send(err.message); }
});

// دالة تتبع الحجوزات
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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`));
