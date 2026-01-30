// القائمة الكاملة والنجوم أرقام ليعمل الفلتر الخاص بك
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

// جلب البيانات من السيرفر
async function fetchHotels() {
    displayHotels(hotels); // عرض البيانات المحلية كاحتياط
    try {
        const response = await fetch('/hotels');
        const dbData = await response.json();
        if (dbData && dbData.length > 0) {
            hotels = dbData.map(h => ({
                Id: h.id || h.Id,
                Name: h.name || h.Name,
                Province: h.province || h.Province,
                Stars: parseInt(h.stars || h.Stars),
                Price: h.price || h.Price,
                Description: h.description || h.Description,
                Image: h.image || h.Image
            }));
            displayHotels(hotels);
        }
    } catch (e) { console.log("استخدام القائمة المحلية حالياً"); }
}

// عرض الفنادق والفلترة
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
                <p>📍 ${h.Province} | 💰 ${h.Price} دولار</p>
                <p class="desc">${h.Description}</p>
                <button class="btn" onclick='openBookingModal(${JSON.stringify(h)})'>احجز الآن</button>
            </div>`;
        list.appendChild(card);
    });
}

// دالة البحث والفلترة (تعتمد على Stars كأرقام)
function filterHotels() {
    const province = document.getElementById("filterProvince").value;
    const stars = document.getElementById("filterStars").value;
    const filtered = hotels.filter(h => {
        return (province === "" || h.Province === province) && 
               (stars === "" || h.Stars.toString() === stars);
    });
    displayHotels(filtered);
}

// تشغيل النظام
fetchHotels();
