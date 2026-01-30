// حل جذري لمشكلة SELF_SIGNED_CERT_IN_CHAIN
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// إعداد الاتصال (تأكد من استخدام الرابط المعدل في Render)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// اختبار الاتصال عند التشغيل
pool.connect((err) => {
    if (err) console.error('❌ عطل في الاتصال:', err.message);
    else console.log('✅ السيرفر متصل بـ Supabase وجاهز للحجز!');
});

// 1. إضافة حجز جديد
app.post("/bookings", async (req, res) => {
    const { hotelId, fullName, email, checkIn, checkOut, totalPrice } = req.body;
    try {
        const query = `
            INSERT INTO bookings (hotelid, fullname, email, checkin, checkout, totalprice) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
        `;
        const result = await pool.query(query, [hotelId, fullName, email, checkIn, checkOut, totalPrice]);
        res.json({ message: "تم الحجز بنجاح!", id: result.rows[0].id });
    } catch (err) {
        console.error("❗ عطل الحجز:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 2. جلب الفنادق (إصلاح النجوم والوصف)
app.get("/hotels", async (req, res) => {
    try {
        const results = await pool.query("SELECT * FROM hotels ORDER BY id ASC");
        res.json(results.rows.map(h => ({
            Id: h.id, 
            Name: h.name, 
            Province: h.province, 
            Stars: h.stars || 5, // قيمة افتراضية في حال كانت فارغة بالقاعدة
            Price: h.price, 
            Description: h.description || "لا يوجد وصف متوفر حالياً.", 
            Image: h.image
        })));
    } catch (err) { res.status(500).send(err.message); }
});

// 3. تتبع الحجوزات
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
