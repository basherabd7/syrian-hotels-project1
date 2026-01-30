// حل مشكلة الشهادة الأمنية على مستوى النظام
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const express = require("express");
const { Pool } = require("pg");
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

// اختبار الاتصال مع طباعة واضحة
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ عطل أمني في الشهادة:', err.message);
    } else {
        console.log('✅✅ نجح الاتصال النهائي بـ Supabase!');
        release();
    }
});

app.post("/bookings", async (req, res) => {
    console.log("📥 محاولة حجز جديدة لـ:", req.body.fullName);
    
    // تأكد من تحويل القيم لأنواعها الصحيحة (رقم للـ ID ورقم للسعر)
    const hotelId = parseInt(req.body.hotelId);
    const fullName = req.body.fullName;
    const email = req.body.email;
    const checkIn = req.body.checkIn;
    const checkOut = req.body.checkOut;
    const totalPrice = parseFloat(req.body.totalPrice);

    try {
        const query = `
            INSERT INTO bookings (hotelid, fullname, email, checkin, checkout, totalprice) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
        `;
        const result = await pool.query(query, [hotelId, fullName, email, checkIn, checkOut, totalPrice]);
        
        console.log("🚀🚀 مبروك! تم الحجز برقم:", result.rows[0].id);
        res.json({ message: "تم الحجز بنجاح!" });
    } catch (err) {
        console.error("❗ فشل الكتابة في الجدول:", err.message);
        res.status(500).json({ error: "فشل الحجز", details: err.message });
    }
});

// وظائف الجلب تبقى كما هي لأنها تعمل بمجرد حل مشكلة SSL
app.get("/hotels", async (req, res) => {
    try {
        const results = await pool.query("SELECT * FROM hotels ORDER BY id ASC");
        res.json(results.rows);
    } catch (err) { res.status(500).send(err.message); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 السيرفر يعمل الآن`));
