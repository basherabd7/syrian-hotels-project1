let hotels = []; // سيتم ملؤها من السيرفر

// جلب الفنادق
async function fetchHotels() {
    try {
        const response = await fetch('/hotels');
        const data = await response.json();
        hotels = data;
        displayHotels(hotels);
    } catch (error) {
        console.error("فشل الجلب:", error);
    }
}

// عرض الفنادق
function displayHotels(filteredHotels) {
    const hotelsList = document.getElementById("hotelsList");
    hotelsList.innerHTML = "";
    filteredHotels.forEach(hotel => {
        const card = document.createElement("div");
        card.classList.add("hotel-card");
        card.innerHTML = `
            <img src="${hotel.Image}" alt="${hotel.Name}" class="hotel-img">
            <h3>${hotel.Name}</h3>
            <p>المحافظة: ${hotel.Province}</p>
            <p>السعر: ${hotel.Price} دولار</p>
            <button class="btn book-btn" onclick="openBookingModal(${JSON.stringify(hotel).replace(/"/g, '&quot;')})">احجز الآن</button>
        `;
        hotelsList.appendChild(card);
    });
}

// إرسال الحجز
document.getElementById("bookingForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const bookingData = {
        hotelId: selectedHotel.Id,
        fullName: document.getElementById("userName").value,
        email: document.getElementById("userEmail").value,
        checkIn: document.getElementById("checkIn").value,
        checkOut: document.getElementById("checkOut").value,
        totalPrice: parseFloat(document.getElementById("totalPrice").value)
    };

    try {
        const response = await fetch('/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        if (response.ok) {
            alert("✅ تم الحجز بنجاح!");
            document.getElementById("bookingModal").style.display = "none";
        } else {
            alert("❌ فشل الحجز.");
        }
    } catch (err) { alert("خطأ في الاتصال."); }
});

// جلب حجوزاتي (تعديل الأسماء لتطابق Supabase)
async function getMyBookings() {
    const email = document.getElementById('searchEmail').value;
    const resultsDiv = document.getElementById('userBookingsResults');
    try {
        const response = await fetch(`/my-bookings/${email}`);
        const bookings = await response.json();
        let html = "";
        bookings.forEach(b => {
            html += `
                <div class="booking-item">
                    <h4>🏨 ${b.hotelname || "فندق"}</h4>
                    <p>رقم الحجز: #${b.id}</p>
                    <p>المبلغ: ${b.totalprice} دولار</p>
                    <button onclick="cancelBooking(${b.id})">إلغاء</button>
                </div>`;
        });
        resultsDiv.innerHTML = html || "لا يوجد حجوزات.";
    } catch (e) { resultsDiv.innerHTML = "خطأ في البحث."; }
}

// تشغيل جلب الفنادق عند التحميل
fetchHotels();
