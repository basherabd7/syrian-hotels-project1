// مصفوفة الفنادق مع بيانات رقمية صحيحة لضمان عمل الفلتر
let hotels = [
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

// دالة جلب البيانات من السيرفر وتحديث القائمة
async function fetchHotels() {
    displayHotels(hotels); 
    try {
        const response = await fetch('/hotels');
        const dbData = await response.json();
        if (dbData && dbData.length > 0) {
            hotels = dbData.map(h => ({
                Id: h.id || h.Id,
                Name: h.name || h.Name,
                Province: h.province || h.Province,
                Stars: parseInt(h.stars || h.Stars),
                Price: parseFloat(h.price || h.Price),
                Description: h.description || h.Description,
                Image: h.image || h.Image
            }));
            displayHotels(hotels);
        }
    } catch (e) {
        console.log("العمل حالياً على البيانات المحلية");
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
            <img src="${h.Image}" class="hotel-img">
            <div class="hotel-info">
                <h3>${h.Name}</h3>
                <p>النجوم: ${h.Stars}</p>
                <p>المحافظة: ${h.Province} | السعر: ${h.Price} دولار</p>
                <p class="desc">${h.Description}</p>
                <button class="btn" onclick='openBookingModal(${JSON.stringify(h)})'>احجز الآن</button>
            </div>`;
        list.appendChild(card);
    });
}

// دالة الفلترة الصحيحة حسب المحافظة والنجوم
function filterHotels() {
    const province = document.getElementById("filterProvince").value;
    const stars = document.getElementById("filterStars").value;
    const filtered = hotels.filter(h => {
        const matchProvince = (province === "" || h.Province === province);
        const matchStars = (stars === "" || h.Stars.toString() === stars);
        return matchProvince && matchStars;
    });
    displayHotels(filtered);
}

// --- وظائف نافذة الحجز (المودال) ---

function openBookingModal(hotel) {
    const modal = document.getElementById("bookingModal");
    if (!modal) return;
    
    document.getElementById("modalHotelName").innerText = hotel.Name;
    document.getElementById("hotelIdInput").value = hotel.Id;
    document.getElementById("pricePerNight").value = hotel.Price;
    
    modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("bookingModal");
    if (modal) modal.style.display = "none";
}

// دالة إرسال الحجز للسيرفر
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
            alert("تم الحجز بنجاح رقم الحجز هو " + result.id);
            closeModal();
        } else {
            alert("حدث خطأ أثناء الحجز");
        }
    } catch (error) {
        alert("فشل الاتصال بالسيرفر");
    }
}

// تشغيل جلب البيانات عند تحميل الصفحة
window.onload = fetchHotels;
