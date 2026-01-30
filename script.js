// 1. قائمة الفنادق الأصلية (تبقى هنا كاحتياط لضمان ظهور الفنادق دائماً)
let hotels = [
  { Id: 1, Name: "فندق داماروز", Province: "دمشق", Stars: 5, Price: 120, Description: "من أرقى فنادق العاصمة، يتميز بإطلالة بانورامية على دمشق وخدمة راقية تناسب رجال الأعمال والسياح.", Image: "img/داماروز.jpg" },
  { Id: 2, Name: "فندق زنوبيا", Province: "اللاذقية", Stars: 3, Price: 80, Description: "قريب من البحر في مدينة اللاذقية ذات الطبيعة الساحرة.", Image: "img/زنوبيا.jpg" },
  { Id: 3, Name: "فندق انترادوس", Province: "طرطوس", Stars: 4, Price: 60, Description: "فندق ومطعم مناسب للعائلات والاطفال يوجد فيه العديد من الخدمات", Image: "img/انترادوس.jpg" },
  { Id: 4, Name: "فندق غولدن مزة", Province: "دمشق", Stars: 5, Price: 100, Description: "فن الضيافة الحقيقي في أحدث و أفخم فندق خمس نوجم في دمشق", Image: "img/غولدن_مزة.jpg" },
  { Id: 5, Name: "فندق شهباء حلب", Province: "حلب", Stars: 4, Price: 130, Description: "يقع في قلب المدينة القديمة، يوفر تجربة تراثية فاخرة مع جلسات شرقية مميزة.", Image: "img/شهباء_حلب.jpg" },
  { Id: 6, Name: "فندق ريفيرا", Province: "اللاذقية", Stars: 3, Price: 55, Description: "خيار اقتصادي ومريح، قريب من الميناء ومناسب للعائلات الصغيرة.", Image: "img/ريفيرا.jpg" },
  { Id: 7, Name: "منتجع جونادا", Province: "طرطوس", Stars: 5, Price: 110, Description: "منتجع فخم بإطلالة بحرية ساحرة ومسبح خاص وخدمات سياحية راقية.", Image: "img/جونادا.jpg" },
  { Id: 8, Name: "فندق الشيراتون", Province: "دمشق", Stars: 5, Price: 100, Description: "يقع في قلب العاصمة دمشق ، بطراز شرقي تقليدي وديكور داخلي يعكس التراث السوري.", Image: "img/شيراتون.jpg" },
  { Id: 9, Name: "فندق الشام", Province: "دمشق", Stars: 5, Price: 160, Description: "من أفخم فنادق دمشق، يقدم خدمات راقية وأجنحة ملكية ومطعم دوار يقدم أشهى المأكولات الشرقية.", Image: "img/الشام.jpg" },
  { Id: 10, Name: "فندق الفورسيزون", Province: "دمشق", Stars: 5, Price: 110, Description: "فندق مميز بإطلالة على دمشق كاملةً، قريب من مراكز التسوق والمطاعم الراقية.", Image: "img/فور_سيزون.jpg" },
  { Id: 11, Name: "فندق سميراميس", Province: "دمشق", Stars: 5, Price: 150, Description: "موقع مثالي في مركز العاصمة مع طاقم ودود وخدمة ممتازة للمسافرين والسياح.", Image: "img/سميراميس.jpg" },
  { Id: 12, Name: "منتجع لاميرا", Province: "اللاذقية", Stars: 5, Price: 115, Description: "إطلالة مذهلة على الشاطئ الذهبي وخدمة راقية لمحبي الهدوء والاستجمام.", Image: "img/لاميرا.jpg" },
  { Id: 13, Name: "فندق الصالح", Province: "طرطوس", Stars: 4, Price: 110, Description: "يقدم تجربة فاخرة مع مسبح داخلي ومركز لياقة بدنية وإطلالة خلابة على الساحل السوري.", Image: "img/الصالح.jpg" }
];

// 2. جلب البيانات من السيرفر
async function fetchHotels() {
    try {
        const response = await fetch('/hotels'); 
        const data = await response.json();
        if (data && data.length > 0) {
            hotels = data.map(dbHotel => {
                const localInfo = hotels.find(h => h.Id === (dbHotel.Id || dbHotel.id));
                return {
                    Id: dbHotel.id || dbHotel.Id,
                    Name: dbHotel.name || dbHotel.Name,
                    Province: dbHotel.province || dbHotel.Province,
                    Stars: dbHotel.stars || dbHotel.Stars,
                    Price: dbHotel.price || dbHotel.Price,
                    Description: dbHotel.description || dbHotel.Description,
                    Image: localInfo ? localInfo.Image : (dbHotel.image || "img/default.jpg")
                };
            });
        }
    } catch (error) {
        console.error("سيتم استخدام البيانات المحلية مؤقتاً:", error);
    }
    displayHotels(hotels);
}

// 3. عرض الفنادق
function displayHotels(filteredHotels) {
    const hotelsList = document.getElementById("hotelsList");
    hotelsList.innerHTML = "";
    filteredHotels.forEach((hotel) => {
        const card = document.createElement("div");
        card.classList.add("hotel-card");
        card.innerHTML = `
            <img src="${hotel.Image}" alt="${hotel.Name}" class="hotel-img">
            <h3>${hotel.Name}</h3>
            <p>المحافظة: ${hotel.Province}</p>
            <p>السعر: ${hotel.Price} دولار</p>
            <button class="btn book-btn" onclick='openBookingModal(${JSON.stringify(hotel)})'>احجز الآن</button>
        `;
        hotelsList.appendChild(card);
    });
}

// 4. إرسال الحجز للسيرفر
let selectedHotel = null;
function openBookingModal(hotel) {
    selectedHotel = hotel;
    document.getElementById("bookingModal").style.display = "flex";
    document.getElementById("modalHotelName").textContent = `حجز ${hotel.Name}`;
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
            alert("تم الحجز بنجاح!");
            document.getElementById("bookingModal").style.display = "none";
        } else {
            alert("فشل الحجز، حاول مجدداً.");
        }
    } catch (error) {
        alert("خطأ في الاتصال بالسيرفر.");
    }
});

// 5. تتبع الحجوزات
async function getMyBookings() {
    const email = document.getElementById('searchEmail').value.trim();
    const resultsDiv = document.getElementById('userBookingsResults');
    try {
        const response = await fetch(`/my-bookings/${email}`);
        const bookings = await response.json();
        let html = "";
        bookings.forEach(b => {
            html += `
                <div class="booking-item" style="border:1px solid #ddd; padding:10px; margin-bottom:10px;">
                    <strong>🏨 ${b.hotelname || "فندق"}</strong><br>
                    التاريخ: من ${new Date(b.checkin).toLocaleDateString()} إلى ${new Date(b.checkout).toLocaleDateString()}<br>
                    السعر الكلي: ${b.totalprice} دولار
                </div>`;
        });
        resultsDiv.innerHTML = html || "لا توجد حجوزات.";
    } catch (e) {
        resultsDiv.innerHTML = "خطأ في البحث.";
    }
}

fetchHotels();
