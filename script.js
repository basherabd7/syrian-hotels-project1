// مصفوفة الفنادق الاحتياطية (لضمان عمل الموقع حتى لو تعطل السيرفر)
let localHotels = [
    { Id: 1, Name: "فندق داماروز", Province: "دمشق", Stars: 5, Price: 120, Description: "من أرقى فنادق العاصمة، يتميز بإطلالة بانورامية.", Image: "img/داماروز.jpg" },
    { Id: 2, Name: "فندق زنوبيا", Province: "اللاذقية", Stars: 3, Price: 80, Description: "قريب من البحر في مدينة اللاذقية الساحرة.", Image: "img/زنوبيا.jpg" },
    { Id: 3, Name: "فندق انترادوس", Province: "طرطوس", Stars: 4, Price: 60, Description: "فندق ومطعم مناسب للعائلات والاطفال.", Image: "img/انترادوس.jpg" },
    { Id: 4, Name: "فندق غولدن مزة", Province: "دمشق", Stars: 5, Price: 100, Description: "فن الضيافة في أفخم فنادق دمشق.", Image: "img/غولدن_مزة.jpg" },
    { Id: 5, Name: "فندق شهباء حلب", Province: "حلب", Stars: 4, Price: 130, Description: "تجربة تراثية فاخرة في قلب حلب.", Image: "img/شهباء_حلب.jpg" },
    { Id: 6, Name: "فندق ريفيرا", Province: "اللاذقية", Stars: 3, Price: 55, Description: "خيار اقتصادي ومريح قريب من الميناء.", Image: "img/ريفيرا.jpg" },
    { Id: 7, Name: "منتجع جونادا", Province: "طرطوس", Stars: 5, Price: 110, Description: "منتجع فخم بإطلالة بحرية ساحرة.", Image: "img/جونادا.jpg" },
    { Id: 8, Name: "فندق الشيراتون", Province: "دمشق", Stars: 5, Price: 100, Description: "طراز شرقي يعكس التراث السوري.", Image: "img/شيراتون.jpg" },
    { Id: 9, Name: "فندق الشام", Province: "دمشق", Stars: 5, Price: 160, Description: "أفخم فنادق دمشق مع مطعم دوار.", Image: "img/الشام.jpg" },
    { Id: 10, Name: "فندق الفورسيزون", Province: "دمشق", Stars: 5, Price: 110, Description: "إطلالة مميزة قريب من مراكز التسوق.", Image: "img/فور_سيزون.jpg" },
    { Id: 11, Name: "فندق سميراميس", Province: "دمشق", Stars: 5, Price: 150, Description: "موقع مثالي في مركز العاصمة.", Image: "img/سميراميس.jpg" },
    { Id: 12, Name: "منتجع لاميرا", Province: "اللاذقية", Stars: 5, Price: 115, Description: "إطلالة مذهلة لمحبي الاستجمام.", Image: "img/لاميرا.jpg" },
    { Id: 13, Name: "فندق الصالح", Province: "طرطوس", Stars: 4, Price: 110, Description: "تجربة فاخرة مع مسبح داخلي وإطلالة خلابة.", Image: "img/الصالح.jpg" }
];

// دالة جلب البيانات مع الفلترة
async function fetchHotels() {
    const province = document.getElementById("filterProvince")?.value || "";
    const stars = document.getElementById("filterStars")?.value || "";
    const priceLimit = document.getElementById("filterPrice")?.value || "";

    const url = `/hotels?location=${encodeURIComponent(province)}&stars=${stars}&maxPrice=${priceLimit}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Server down");
        const dbData = await response.json();
        
        if (dbData && dbData.length > 0) {
            displayHotels(dbData);
        } else {
            // إذا لم يجد نتائج في السيرفر، نجرب الفلترة في البيانات المحلية
            filterLocalData(province, stars, priceLimit);
        }
    } catch (e) {
        console.log("فشل الاتصال، يتم عرض البيانات المحلية احتياطاً");
        filterLocalData(province, stars, priceLimit);
    }
}

// دالة عرض الفنادق في الصفحة
function displayHotels(data) {
    const list = document.getElementById("hotelsList");
    if (!list) return;
    list.innerHTML = "";
    data.forEach(h => {
        const card = document.createElement("div");
        card.className = "hotel-card";
        card.innerHTML = `
            <img src="${h.image || h.Image}" class="hotel-img" onerror="this.src='img/default.jpg'">
            <div class="hotel-info">
                <h3>${h.name || h.Name}</h3>
                <p>النجوم: ${h.stars || h.Stars}</p>
                <p>المحافظة: ${h.province || h.Province} | السعر: ${h.price || h.Price} دولار</p>
                <button class="btn" onclick='openBookingModal(${JSON.stringify(h)})'>احجز الآن</button>
            </div>`;
        list.appendChild(card);
    });
}

// دالة فلترة البيانات المحلية (الاحتياطية)
function filterLocalData(province, stars, price) {
    const filtered = localHotels.filter(h => {
        const matchProvince = (province === "" || h.Province === province);
        const matchStars = (stars === "" || h.Stars.toString() === stars);
        const matchPrice = (price === "" || h.Price <= parseFloat(price));
        return matchProvince && matchStars && matchPrice;
    });
    displayHotels(filtered);
}

// دالة تتبع الحجوزات (المخصصة للصفحة الأولى index.html)
async function getMyBookings() {
    const emailInput = document.getElementById("searchEmail");
    const resultsArea = document.getElementById("userBookingsResults");
    if (!emailInput || !emailInput.value) return alert("يرجى إدخال البريد الإلكتروني");

    try {
        const response = await fetch(`/my-bookings/${emailInput.value.trim()}`);
        const data = await response.json();
        resultsArea.innerHTML = "";
        if (data.length === 0) {
            resultsArea.innerHTML = "<p>لا توجد حجوزات لهذا البريد.</p>";
        } else {
            data.forEach(b => {
                resultsArea.innerHTML += `
                    <div class="booking-result-item" style="background:#f0f0f0; padding:15px; margin-bottom:10px; border-radius:8px; border-right:5px solid #007bff;">
                        <strong>🏨 الفندق: ${b.hotelname}</strong><br>
                        📅 التاريخ: من ${b.checkin} إلى ${b.checkout}<br>
                        💰 السعر الإجمالي: ${b.totalprice} دولار | ✅ مؤكد
                    </div>`;
            });
        }
    } catch (e) { alert("حدث خطأ في جلب بيانات التتبع"); }
}

// وظائف الحجز (نافذة المودال)
function openBookingModal(hotel) {
    const modal = document.getElementById("bookingModal");
    if (!modal) return;
    document.getElementById("modalHotelName").innerText = hotel.name || hotel.Name;
    document.getElementById("hotelIdInput").value = hotel.id || hotel.Id;
    document.getElementById("pricePerNight").value = hotel.price || hotel.Price;
    modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("bookingModal");
    if (modal) modal.style.display = "none";
}

async function submitBooking(event) {
    event.preventDefault();
    const bookingData = {
        hotelId: document.getElementById("hotelIdInput").value,
        fullName: document.getElementById("fullName").value,
        email: document.getElementById("email").value,
        checkIn: document.getElementById("checkIn").value,
        checkOut: document.getElementById("checkOut").value,
        totalPrice: document.getElementById("pricePerNight").value
    };
    try {
        const response = await fetch('/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        const result = await response.json();
        if (result.success) {
            alert("✅ تم الحجز بنجاح! رقم الحجز: " + result.id);
            closeModal();
        }
    } catch (e) { alert("فشل الاتصال بالسيرفر"); }
}

// مساعد الذكاء الاصطناعي (الشات)
async function askArtificialIntelligence() {
    const input = document.getElementById("ai-user-input");
    const chatMessages = document.getElementById("chat-messages");
    if (!input || !input.value) return;

    const userMsg = input.value;
    chatMessages.innerHTML += `<div class="msg user">${userMsg}</div>`;
    input.value = "";

    try {
        const response = await fetch('/ask-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userMsg })
        });
        const data = await response.json();
        chatMessages.innerHTML += `<div class="msg bot">${data.reply}</div>`;
    } catch (e) { chatMessages.innerHTML += `<div class="msg bot">عذراً، المساعد غير متاح حالياً.</div>`; }
}

function btnToggleChat() {
    const chat = document.getElementById("chat-box-container");
    if(chat) chat.style.display = chat.style.display === "block" ? "none" : "block";
}

// تشغيل جلب البيانات عند التحميل
window.onload = () => { 
    if(document.getElementById("hotelsList")) fetchHotels(); 
};
