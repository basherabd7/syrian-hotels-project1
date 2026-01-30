const express = require("express");
const mysql = require("mysql2"); 
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname)));

// إعداد الاتصال مع SSL لضمان التوافق مع Aiven
const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false 
    }
});

const db = pool.promise();

// 
async function initDatabase() {
    try {
        // . إنشاء جدول الفنادق
        await db.query(`
            CREATE TABLE IF NOT EXISTS hotels (
                Id INT PRIMARY KEY,
                Name VARCHAR(255),
                Province VARCHAR(255),
                Stars INT,
                Price DECIMAL(10, 2),
                Description TEXT,
                Image VARCHAR(255)
            )
        `);

        // . إنشاء جدول الحجوزات
        await db.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                Id INT AUTO_INCREMENT PRIMARY KEY,
                HotelId INT NOT NULL,
                FullName VARCHAR(255) NOT NULL,
                Email VARCHAR(255) NOT NULL,
                CheckIn DATE NOT NULL,
                CheckOut DATE NOT NULL,
                TotalPrice DECIMAL(10, 2) NOT NULL,
                CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("تم فحص وإنشاء الجداول بنجاح في defaultdb");
    } catch (err) {
        console.error("خطأ في تهيئة قاعدة البيانات:", err.message);
    }
}

initDatabase();

// --- جلب الفنادق ---
app.get("/hotels", async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM hotels");
        const formattedResults = results.map(hotel => ({
            Id: hotel.Id || hotel.id,
            Name: hotel.Name || hotel.name,
            Province: hotel.Province || hotel.province,
            Stars: hotel.Stars || hotel.stars,
            Price: hotel.Price || hotel.price,
            Description: hotel.Description || hotel.description,
            Image: hotel.Image || hotel.image
        }));
        res.json(formattedResults);
    } catch (err) { 
        res.status(500).send(err); 
    }
});

// --- إضافة حجز جديد ---
app.post("/bookings", async (req, res) => {
    const { hotelId, fullName, email, checkIn, checkOut, totalPrice } = req.body;
    try {
        await db.query("INSERT INTO bookings (HotelId, FullName, Email, CheckIn, CheckOut, TotalPrice) VALUES (?, ?, ?, ?, ?, ?)", 
        [hotelId, fullName, email, checkIn, checkOut, totalPrice]);
        res.json({ message: "تم الحجز بنجاح" });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// --- الشات بوت الذكي ---
app.post('/ask-ai', async (req, res) => {
    const { prompt } = req.body;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: "أنت مساعد سياحي خبير في سوريا." }, { role: "user", content: prompt }]
        }, { headers: { "Authorization": `Bearer ${GROQ_API_KEY}` } });
        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) { 
        res.status(500).json({ reply: "عذراً، حدث خطأ." }); 
    }
});

// --- تتبع الحجوزات  ---
app.get('/my-bookings/:email', async (req, res) => {
    try {
        const [results] = await db.query(
            "SELECT b.*, h.Name AS hotelName FROM bookings b LEFT JOIN hotels h ON b.HotelId = h.Id WHERE b.Email = ?", 
            [req.params.email]
        );
        res.json(results);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// --- إلغاء حجز ---
app.delete('/cancel-booking/:id', async (req, res) => {
    try { 
        await db.query("DELETE FROM bookings WHERE Id = ?", [req.params.id]); 
        res.json({ message: "تم الإلغاء" }); 
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

app.listen(process.env.PORT || 3000);
