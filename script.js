// دالة جلب البيانات مع الفلترة (تستخدم في صفحة الفنادق)
async function fetchHotels() {
    const province = document.getElementById("filterProvince")?.value || "";
    const stars = document.getElementById("filterStars")?.value || "";
    const priceLimit = document.getElementById("filterPrice")?.value || "";

    const url = `/hotels?location=${province}&stars=${stars}&maxPrice=${priceLimit}`;

    try {
        const response = await fetch(url);
        const dbData = await response.json();
        
        const list = document.getElementById("hotelsList");
        if (!list) return;

        list.innerHTML = "";
        dbData.forEach(h => {
            const card = document.createElement("div");
            card.className = "hotel-card";
            card.innerHTML = `
                <img src="${h.image || h.Image}" class="hotel-img">
                <div class="hotel-info">
                    <h3>${h.name || h.Name}</h3>
                    <p>النجوم: ${h.stars || h.Stars}</p>
                    <p>المحافظة: ${h.location || h.Province} | السعر: ${h.price || h.Price} دولار</p>
                    <button class="btn" onclick='openBookingModal(${JSON.stringify(h)})'>احجز الآن</button>
                </div>`;
            list.appendChild(card);
        });
    } catch (e) {
        console.error("خطأ في الجلب:", e);
    }
}

// دالة تتبع الحجوزات (المخصصة لـ index.html)
async function getMyBookings() {
    const emailInput = document.getElementById("searchEmail");
    const resultsArea = document.getElementById("userBookingsResults");

    if (!emailInput || !emailInput.value) {
        alert("يرجى إدخال البريد الإلكتروني");
        return;
    }

    try {
        const response = await fetch(`/my-bookings/${emailInput.value.trim()}`);
        const data = await response.json();

        if (resultsArea) {
            resultsArea.innerHTML = "";
            if (data.length === 0) {
                resultsArea.innerHTML = "<p>لا توجد حجوزات سابقة لهذا البريد.</p>";
            } else {
                data.forEach(b => {
                    resultsArea.innerHTML += `
                        <div class="booking-result-item" style="background:#f9f9f9; padding:10px; margin:5px; border-radius:5px; border-right:4px solid #007bff;">
                            <strong>🏨 الفندق: ${b.hotelname}</strong><br>
                            📅 التاريخ: من ${b.checkin} إلى ${b.checkout}<br>
                            💰 السعر: ${b.totalprice} دولار | ✅ الحالة: مؤكد
                        </div>`;
                });
            }
        }
    } catch (e) {
        alert("حدث خطأ أثناء البحث عن الحجوزات");
    }
}

// وظائف المودال والحجز (التي تعمل بنجاح)
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
    } catch (e) { alert("❌ فشل الاتصال بالسيرفر"); }
}

// وظيفة الذكاء الاصطناعي
async function askArtificialIntelligence() {
    const input = document.getElementById("ai-user-input");
    const chatMessages = document.getElementById("chat-messages");
    if (!input.value) return;

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
    } catch (e) {
        chatMessages.innerHTML += `<div class="msg bot">عذراً، حدث خطأ.</div>`;
    }
}

function btnToggleChat() {
    const chat = document.getElementById("chat-box-container");
    chat.style.display = chat.style.display === "block" ? "none" : "block";
}

window.onload = () => { if(document.getElementById("hotelsList")) fetchHotels(); };
