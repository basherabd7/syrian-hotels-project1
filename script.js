// 1. قائمة الفنادق الأصلية 
let hotels = [
  { Id: 1, Name: "فندق داماروز", Province: "دمشق", Stars: 5, Price: 120, Description: "من أرقى فنادق العاصمة، يتميز بإطلالة بانورامية على دمشق وخدمة راقية تناسب رجال الأعمال والسياح.", Image: "img/داماروز.jpg" },
  { Id: 2, Name: "فندق زنوبيا", Province: "اللاذقية", Stars: 3, Price: 80, Description: "قريب من البحر في مدينة اللاذقية ذات الطبيعة الساحرة.", Image: "img/زنوبيا.jpg" },
  { Id: 3, Name: "فندق انترادوس", Province: "طرطوس", Stars: 4, Price: 60, Description: "فندق ومطعم مناسب للعائلات والاطفال يوجد فيه العديد من الخدمات", Image: "img/انترادوس.jpg" },
  { Id: 4, Name: "فندق غولدن مزة", Province: "دمشق", Stars: 5, Price: 100, Description: "فن الضيافة الحقيقي في أحدث و أفخم فندق خمس نجوم في دمشق", Image: "img/غولدن_مزة.jpg" },
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

// 2. جلب البيانات الفعلية من السيرفر (تم تعديل الرابط ليعمل على Railway)
async function fetchHotels() {
    try {
        const response = await fetch('/hotels'); 
        const data = await response.json();
        if (data && data.length > 0) {
            hotels = data.map(dbHotel => {
                const localInfo = hotels.find(h => h.Id === dbHotel.Id);
                return {
                    Id: dbHotel.Id,
                    Name: dbHotel.Name,
                    Province: dbHotel.Location, 
                    Stars: dbHotel.Stars,
                    Price: dbHotel.PricePerNight, 
                    Description: dbHotel.Description,
                    Image: localInfo ? localInfo.Image : "img/default.jpg" 
                };
            });
        }
        displayHotels(hotels);
    } catch (error) {
        console.error("خطأ في جلب الفنادق، سيتم استخدام البيانات المحلية:", error);
        displayHotels(hotels);
    }
}

// 3. عرض الفنادق في الصفحة 
const hotelsList = document.getElementById("hotelsList");
const provinceFilter = document.getElementById("provinceFilter");
const starsFilter = document.getElementById("starsFilter");
const priceFilter = document.getElementById("priceFilter");
const filterBtn = document.getElementById("filterBtn");
const modal = document.getElementById("bookingModal");
const closeModal = document.querySelector(".close");
const modalHotelName = document.getElementById("modalHotelName");
const bookingForm = document.getElementById("bookingForm");

function displayHotels(filteredHotels) {
    hotelsList.innerHTML = "";
    filteredHotels.forEach((hotel) => {
        const card = document.createElement("div");
        card.classList.add("hotel-card");
        card.innerHTML = `
            <img src="${hotel.Image}" alt="${hotel.Name}" class="hotel-img">
            <h3>${hotel.Name}</h3>
            <p>المحافظة: ${hotel.Province}</p>
            <p>عدد النجوم: ${hotel.Stars}</p>
            <p>السعر: ${hotel.Price} دولار</p>
            <p class="desc">${hotel.Description}</p>
            <button class="btn book-btn" data-id="${hotel.Id}">احجز الآن</button>
        `;
        hotelsList.appendChild(card);
    });

    document.querySelectorAll(".book-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const hotelId = e.target.getAttribute("data-id");
            const hotel = hotels.find(h => h.Id == hotelId);
            openBookingModal(hotel);
        });
    });
}

// 4. الفلترة 
filterBtn.addEventListener("click", () => {
    const province = provinceFilter.value;
    const stars = starsFilter.value;
    const price = priceFilter.value;
    const filtered = hotels.filter(h => {
        return (
            (province === "" || h.Province === province) &&
            (stars === "" || h.Stars == stars) &&
            (price === "" || h.Price <= price)
        );
    });
    displayHotels(filtered);
});

// 5. واجهة الحجز
let selectedHotel = null;
function openBookingModal(hotel) {
    selectedHotel = hotel;
    modal.style.display = "flex";
    modalHotelName.textContent = `حجز ${hotel.Name}`;
    document.getElementById("totalPrice").value = hotel.Price;
}
closeModal.addEventListener("click", () => (modal.style.display = "none"));
window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

// 6. حساب السعر الكلي
function calculateTotal() {
    const checkInInput = document.getElementById("checkIn").value;
    const checkOutInput = document.getElementById("checkOut").value;
    if (checkInInput && checkOutInput && selectedHotel) {
        const checkIn = new Date(checkInInput);
        const checkOut = new Date(checkOutInput);
        if (checkOut > checkIn) {
            const days = (checkOut - checkIn) / (1000 * 60 * 60 * 24);
            const total = days * selectedHotel.Price;
            document.getElementById("totalPrice").value = total.toFixed(2);
        }
    }
}
document.getElementById("checkIn").addEventListener("change", calculateTotal);
document.getElementById("checkOut").addEventListener("change", calculateTotal);

// 7. إرسال الحجز للسيرفر (تم تعديل الرابط ليعمل على Railway)
bookingForm.addEventListener("submit", async (e) => {
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
            alert("تم الحجز بنجاح في قاعدة البيانات!");
            modal.style.display = "none";
            bookingForm.reset();
        } else {
            const result = await response.json();
            alert("حدث خطأ: " + (result.message || "فشل الحجز"));
        }
    } catch (error) {
        console.error("خطأ أثناء الحجز:", error);
        alert("فشل الاتصال بالسيرفر.");
    }
});

fetchHotels();

// وظائف الشات بوت الذكي (تم تعديل الرابط ليعمل على Railway)
function btnToggleChat() {
    const chatWindow = document.getElementById('chat-box-container');
    if (chatWindow) {
        chatWindow.style.display = (chatWindow.style.display === 'none' || chatWindow.style.display === '') ? 'flex' : 'none';
    }
}

async function askArtificialIntelligence() {
    const input = document.getElementById('ai-user-input');
    const box = document.getElementById('chat-messages');
    if (!input || !box) return;
    const text = input.value.trim();
    if (!text) return;
    box.innerHTML += `<div class="msg user">${text}</div>`;
    input.value = "";
    box.scrollTop = box.scrollHeight;
    const tempId = "temp_" + Date.now();
    box.innerHTML += `<div class="msg bot" id="${tempId}">جاري التفكير...</div>`;
    try {
        const response = await fetch('/ask-ai', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text })
        });
        const data = await response.json();
        document.getElementById(tempId).innerText = data.reply;
    } catch (error) {
        document.getElementById(tempId).innerText = "عذراً، حدث خطأ في الاتصال.";
    }
    box.scrollTop = box.scrollHeight;
}

// جلب حجوزاتي (تم تعديل الرابط ليعمل على Railway)
async function getMyBookings() {
    const email = document.getElementById('searchEmail').value.trim();
    const resultsDiv = document.getElementById('userBookingsResults');
    if (!email) return alert("يرجى إدخال البريد الإلكتروني");

    resultsDiv.innerHTML = "<p style='text-align:center;'>جاري البحث...</p>";

    try {
        const response = await fetch(`/my-bookings/${email}`); 
        const bookings = await response.json();

        if (!bookings || bookings.length === 0) {
            resultsDiv.innerHTML = "<p style='color:red; text-align:center;'>لا توجد حجوزات لهذا البريد.</p>";
            return;
        }

        let html = "";
        bookings.forEach(b => {
            const bId = b.Id; 
            const bHotel = b.hotelName || "فندق محجوز";
            const bPrice = b.TotalPrice; 
            const rawIn = b.CheckIn;     
            const rawOut = b.CheckOut; 

            const startDate = rawIn ? new Date(rawIn).toLocaleDateString('ar-SY') : "غير محدد";
            const endDate = rawOut ? new Date(rawOut).toLocaleDateString('ar-SY') : "غير محدد";

            html += `
                <div class="booking-item" style="border-right: 5px solid #ff8c42; padding: 20px; background: #fff; margin-bottom: 15px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); text-align: right;">
                    <div style="font-weight: bold; color: #ff8c42; font-size: 1.2rem; margin-bottom: 8px;">🏨 ${bHotel}</div>
                    <div style="margin-bottom: 5px;"><strong>رقم الحجز:</strong> #${bId}</div>
                    <div style="font-size: 0.95rem; color: #555; margin-bottom: 5px;">
                         <strong>التاريخ:</strong> من ${startDate} إلى ${endDate}
                    </div>
                    <div style="font-weight: bold; font-size: 1.1rem; color: #27ae60; margin-bottom: 15px;">
                         <strong>المجموع:</strong> ${bPrice} دولار
                    </div>
                   <button class="btn-cancel" onclick="cancelBooking('${bId}')">إلغاء الحجز</button>
                </div>
            `;
        });
        resultsDiv.innerHTML = html;
    } catch (e) {
        console.error("خطأ في الجافا سكريبت:", e);
        resultsDiv.innerHTML = "<p style='color:red; text-align:center;'>فشل الاتصال بالسيرفر.</p>";
    }
}

// إلغاء الحجز (تم تعديل الرابط ليعمل على Railway)
async function cancelBooking(id) {
    if (!id || id === 'undefined') return alert("عذراً، معرف الحجز غير صحيح");
    if (!confirm("هل أنت متأكد من إلغاء الحجز رقم #" + id + "؟")) return;

    try {
        const response = await fetch(`/cancel-booking/${id}`, { 
            method: 'DELETE'
        });
        
        if (response.ok) {
            const result = await response.json();
            alert(result.message);
            getMyBookings(); 
        } else {
            alert("فشل إلغاء الحجز.");
        }
    } catch (e) {
        alert("خطأ في الاتصال بالسيرفر.");
    }
}