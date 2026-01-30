// 1. قائمة الفنادق الاحتياطية (تظهر فوراً للمستخدم)
let hotels = [
  { Id: 1, Name: "فندق داماروز", Province: "دمشق", Stars: 5, Price: 120, Description: "من أرقى فنادق العاصمة، يتميز بإطلالة بانورامية على دمشق وخدمة راقية.", Image: "img/داماروز.jpg" },
  { Id: 2, Name: "فندق زنوبيا", Province: "اللاذقية", Stars: 3, Price: 80, Description: "قريب من البحر في مدينة اللاذقية ذات الطبيعة الساحرة.", Image: "img/زنوبيا.jpg" },
  { Id: 3, Name: "فندق انترادوس", Province: "طرطوس", Stars: 4, Price: 60, Description: "فندق ومطعم مناسب للعائلات والاطفال يوجد فيه العديد من الخدمات", Image: "img/انترادوس.jpg" },
  { Id: 4, Name: "فندق غولدن مزة", Province: "دمشق", Stars: 5, Price: 100, Description: "فن الضيافة الحقيقي في أحدث و أفخم فندق خمس نوجم في دمشق", Image: "img/غولدن_مزة.jpg" },
  { Id: 5, Name: "فندق شهباء حلب", Province: "حلب", Stars: 4, Price: 130, Description: "يقع في قلب المدينة القديمة، يوفر تجربة تراثية فاخرة.", Image: "img/شهباء_حلب.jpg" },
  { Id: 6, Name: "فندق ريفيرا", Province: "اللاذقية", Stars: 3, Price: 55, Description: "خيار اقتصادي ومريح، قريب من الميناء ومناسب للعائلات الصغيرة.", Image: "img/ريفيرا.jpg" },
  { Id: 7, Name: "منتجع جونادا", Province: "طرطوس", Stars: 5, Price: 110, Description: "منتجع فخم بإطلالة بحرية ساحرة ومسبح خاص.", Image: "img/جونادا.jpg" },
  { Id: 8, Name: "فندق الشيراتون", Province: "دمشق", Stars: 5, Price: 100, Description: "يقع في قلب العاصمة دمشق بطراز شرقي تقليدي.", Image: "img/شيراتون.jpg" },
  { Id: 9, Name: "فندق الشام", Province: "دمشق", Stars: 5, Price: 160, Description: "من أفخم فنادق دمشق، يقدم خدمات راقية وأجنحة ملكية.", Image: "img/الشام.jpg" },
  { Id: 10, Name: "فندق الفورسيزون", Province: "دمشق", Stars: 5, Price: 110, Description: "فندق مميز بإطلالة على دمشق كاملةً.", Image: "img/فور_سيزون.jpg" },
  { Id: 11, Name: "فندق سميراميس", Province: "دمشق", Stars: 5, Price: 150, Description: "موقع مثالي في مركز العاصمة مع خدمة ممتازة.", Image: "img/سميراميس.jpg" },
  { Id: 12, Name: "منتجع لاميرا", Province: "اللاذقية", Stars: 5, Price: 115, Description: "إطلالة مذهلة على الشاطئ الذهبي وخدمة راقية.", Image: "img/لاميرا.jpg" },
  { Id: 13, Name: "فندق الصالح", Province: "طرطوس", Stars: 4, Price: 110, Description: "يقدم تجربة فاخرة مع مسبح داخلي وإطلالة خلابة.", Image: "img/الصالح.jpg" }
];

// 2. دالة جلب الفنادق من السيرفر لتحديث البيانات (الأسعار والنجوم)
async function fetchHotels() {
    // عرض البيانات المحلية أولاً لسرعة التحميل
    displayHotels(hotels);

    try {
        const response = await fetch('/hotels');
        const dbData = await response.json();
        
        if (dbData && dbData.length > 0) {
            // تحديث المصفوفة بالبيانات القادمة من قاعدة البيانات
            hotels = dbData.map(dbH => {
                const local = hotels.find(l => l.Id === dbH.Id);
                return {
                    Id: dbH.Id,
                    Name: dbH.Name,
                    Province: dbH.Province,
                    Stars: dbH.Stars || (local ? local.Stars : 5),
                    Price: dbH.Price,
                    Description: dbH.Description || (local ? local.Description : ""),
                    Image: local ? local.Image : dbH.Image // الحفاظ على مسار الصورة المحلي
                };
            });
            displayHotels(hotels); // إعادة العرض بالبيانات المحدثة
        }
    } catch (error) {
        console.log("السيرفر غير مستجيب، تم الاعتماد على البيانات المحلية احتياطاً.");
    }
}

// 3. عرض الفنادق في الكروت
function displayHotels(filteredHotels) {
    const hotelsList = document.getElementById("hotelsList");
    if (!hotelsList) return;
    
    hotelsList.innerHTML = "";
    filteredHotels.forEach((hotel) => {
        const card = document.createElement("div");
        card.classList.add("hotel-card");
        
        // رسم النجوم ⭐ بناءً على العدد
        const starsHtml = "⭐".repeat(hotel.Stars);

        card.innerHTML = `
            <img src="${hotel.Image}" alt="${hotel.Name}" class="hotel-img">
            <div class="hotel-info">
                <h3>${hotel.Name}</h3>
                <div class="stars-container">${starsHtml}</div>
                <p><strong>📍 المحافظة:</strong> ${hotel.Province}</p>
                <p><strong>💰 السعر:</strong> ${hotel.Price} دولار</p>
                <p class="hotel-desc">${hotel.Description}</p>
                <button class="btn book-btn" onclick='openBookingModal(${JSON.stringify(hotel)})'>احجز الآن</button>
            </div>
        `;
        hotelsList.appendChild(card);
    });
}

// 4. نظام الحجز وتتبع البيانات
let selectedHotel = null;
function openBookingModal(hotel) {
    selectedHotel = hotel;
    document.getElementById("bookingModal").style.display = "flex";
    document.getElementById("modalHotelName").innerText = `حجز في ${hotel.Name}`;
    document.getElementById("totalPrice").value = hotel.Price;
}

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
            alert("❌ فشل الحجز، تأكد من اتصال السيرفر.");
        }
    } catch (err) { alert("عذراً، حدث خطأ في الشبكة."); }
});

// تشغيل الجلب عند التحميل
fetchHotels();
