const express = require("express");
const mysql = require("mysql2"); 
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname)));

// --- الربط بـ Aiven ---
const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const db = pool.promise();

// --- وظيفة بناء الجداول وحقن البيانات ---
async function initDatabase() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS hotels (
                Id INT PRIMARY KEY,
                Name VARCHAR(255),
                Province VARCHAR(255),
                Stars INT,
                Price INT,
                Description TEXT,
                Image VARCHAR(255)
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                Id INT AUTO_INCREMENT PRIMARY KEY,
                HotelId INT,
                FullName VARCHAR(255),
                Email VARCHAR(255),
                CheckIn DATE,
                CheckOut DATE,
                TotalPrice DECIMAL(10,2),
                FOREIGN KEY (HotelId) REFERENCES hotels(Id)
            )
        `);

        const [rows] = await db.query("SELECT COUNT(*) as count FROM hotels");
        if (rows[0].count === 0) {
            const hotelsData = [
                [1, "فندق داماروز", "دمشق", 5, 120, "من أرقى فنادق العاصمة، يتميز بإطلالة بانورامية على دمشق وخدمة راقية تناسب رجال الأعمال والسياح.", "img/داماروز.jpg"],
                [2, "فندق زنوبيا", "اللاذقية", 3, 80, "قريب من البحر في مدينة اللاذقية ذات الطبيعة الساحرة.", "img/زنوبيا.jpg"],
                [3, "فندق انترادوس", "طرطوس", 4, 60, "فندق ومطعم مناسب للعائلات والاطفال يوجد فيه العديد من الخدمات", "img/انترادوس.jpg"],
                [4, "فندق غولدن مزة", "دمشق", 5, 100, "فن الضيافة الحقيقي في أحدث و أفخم فندق خمس نجوم في دمشق", "img/غولدن_مزة.jpg"],
                [5, "فندق شهباء حلب", "حلب", 4, 130, "يقع في قلب المدينة القديمة، يوفر تجربة تراثية فاخرة مع جلسات شرقية مميزة.", "img/شهباء_حلب.jpg"],
                [6, "فندق ريفيرا", "اللاذقية", 3, 55, "خيار اقتصادي ومريح، قريب من الميناء ومناسب للعائلات الصغيرة.", "img/ريفيرا.jpg"],
                [7, "منتجع جونادا", "طرطوس", 5, 110, "منتجع فخم بإطلالة بحرية ساحرة ومسبح خاص وخدمات سياحية راقية.", "img/جونادا.jpg"],
                [8, "فندق الشيراتون", "دمشق", 5, 100, "يقع في قلب العاصمة دمشق ، بطراز شرقي تقليدي وديكور داخلي يعكس التراث السوري.", "img/شيراتون.jpg"],
                [9, "فندق الشام", "دمشق", 5, 160, "من أفخم فنادق دمشق، يقدم خدمات راقية وأجنحة ملكية ومطعم دوار يقدم أشهى المأكولات الشرقية.", "img/الشام.jpg"],
                [10, "فندق الفورسيزون", "دمشق", 5, 110, "فندق مميز بإطلالة على دمشق كاملةً، قريب من مراكز التسوق والمطاعم الراقية.", "img/فور_سيزون.jpg"],
                [11, "فندق سميراميس", "دمشق", 5, 150, "موقع مثالي في مركز العاصمة مع طاقم ودود وخدمة ممتازة للمسافرين والسياح.", "img/سميراميس.jpg"],
                [12, "منتجع لاميرا", "اللاذقية", 5, 115, "إطلالة مذهلة على الشاطئ الذهبي وخدمة راقية لمحبي الهدوء والاستجمام.", "img/لاميرا.jpg"],
                [13, "فندق الصالح", "طرطوس", 4, 110, "يقدم تجربة فاخرة مع مسبح داخلي ومركز لياقة بدنية وإطلالة خلابة على الساحل السوري.", "img/الصالح.jpg"]
            ];
            await db.query("INSERT INTO hotels (Id, Name, Province, Stars, Price, Description, Image) VALUES ?", [hotelsData]);
        }
    } catch (err) { console.error("Init Error: " + err.message); }
}
initDatabase();

app.get("/", (req, res) => { res.sendFile(path.join(__dirname, "index.html")); });

// --- تعديل جلب الفنادق لضمان قراءة البيانات مهما كانت حالة الأحرف ---
app.get("/hotels", async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM hotels");
        
        // تحويل البيانات يدوياً لضمان توافقها مع الـ Frontend
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
    } catch (err) { res.status(500).send(err); }
});

app.post("/bookings", async (req, res) => {
    const { hotelId, fullName, email, checkIn, checkOut, totalPrice } = req.body;
    try {
        await db.query("INSERT INTO bookings (HotelId, FullName, Email, CheckIn, CheckOut, TotalPrice) VALUES (?, ?, ?, ?, ?, ?)", 
        [hotelId, fullName, email, checkIn, checkOut, totalPrice]);
        res.json({ message: "تم الحجز بنجاح" });
    } catch (err) { res.status(500).send(err); }
});

app.post('/ask-ai', async (req, res) => {
    const { prompt } = req.body;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: "أنت مساعد سياحي خبير في سوريا." }, { role: "user", content: prompt }]
        }, { headers: { "Authorization": `Bearer ${GROQ_API_KEY}` } });
        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) { res.status(500).json({ reply: "عذراً، حدث خطأ." }); }
});

app.get('/my-bookings/:email', async (req, res) => {
    try {
        const [results] = await db.query("SELECT b.*, h.Name AS hotelName FROM bookings b LEFT JOIN hotels h ON b.HotelId = h.Id WHERE b.Email = ?", [req.params.email]);
        res.json(results);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/cancel-booking/:id', async (req, res) => {
    try { await db.query("DELETE FROM bookings WHERE Id = ?", [req.params.id]); res.json({ message: "تم الإلغاء" }); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(process.env.PORT || 3000);
