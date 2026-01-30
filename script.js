// مصفوفة الفنادق الكاملة (13 فندقاً)
let hotels = [
  { Id: 1, Name: "فندق داماروز", Province: "دمشق", Stars: 5, Price: 120, Description: "من أرقى فنادق العاصمة، يتميز بإطلالة بانورامية على دمشق وخدمة راقية تناسب رجال الأعمال والسياح.", Image: "img/داماروز.jpg" },
  { Id: 2, Name: "فندق زنوبيا", Province: "اللاذقية", Stars: 3, Price: 80, Description: "قريب من البحر في مدينة اللاذقية ذات الطبيعة الساحرة.", Image: "img/زنوبيا.jpg" },
  { Id: 3, Name: "فندق انترادوس", Province: "طرطوس", Stars: 4, Price: 60, Description: "فندق ومطعم مناسب للعائلات والاطفال يوجد فيه العديد من الخدمات", Image: "img/انترادوس.jpg" },
  { Id: 4, Name: "فندق غولدن مزة", Province: "دمشق", Stars: 5, Price: 100, Description: "فن الضيافة الحقيقي في أحدث و أفخم فندق خمس نوجم في دمشق", Image: "img/غولدن_مزة.jpg" },
  { Id: 5, Name: "فندق شهباء حلب", Province: "حلب", Stars: 4, Price: 130, Description: "يقع في قلب المدينة القديمة، يوفر تجربة تراثية فاخرة مع جلسات شرقية مميزة.", Image: "img/شهباء_حلب.jpg" },
  { Id: 6, Name: "فندق ريفيرا", Province: "اللاذقية", Stars: 3, Price: 55, Description: "خيار اقتصادي ومريح، قريب من الميناء ومناسب للعائلات الصغيرة.", Image: "img/ريفيرا.jpg" },
  { Id: 7, Name: "منتجع جونادا", Province: "طرطوس", Stars: 5, Price: 110, Description: "منتجع فخم بإطلالة بحرية ساحرة ومسبح خاص وخدمات سياحية راقية.", Image: "img/جونادا.jpg" },
  { Id: 8, Name: "فندق الشيراتون", Province: "دمشق", Stars: 5, Price: 100, Description: "يقع في قلب العاصمة دمشق ، بطراز شرقي تقليدي وديكور داخلي يعكس التراث السوري.", Image: "img/شيراتون.jpg" },
  { Id: 10, Name: "فندق الفورسيزون", Province: "دمشق", Stars: 5, Price: 110, Description: "فندق مميز بإطلالة على دمشق كاملةً، قريب من مراكز التسوق والمطاعم الراقية.", Image: "img/فور_سيزون.jpg" },
  { Id: 11, Name: "فندق سميراميس", Province: "دمشق", Stars: 5, Price: 150, Description: "موقع مثالي في مركز العاصمة مع طاقم ودود وخدمة ممتازة للمسافرين والسياح.", Image: "img/سميراميس.jpg" },
  { Id: 12, Name: "منتجع لاميرا", Province: "اللاذقية", Stars: 5, Price: 115, Description: "إطلالة مذهلة على الشاطئ الذهبي وخدمة راقية لمحبي الهدوء والاستجمام.", Image: "img/لاميرا.jpg" },
  { Id: 13, Name: "فندق الصالح", Province: "طرطوس", Stars: 4, Price: 110, Description: "يقدم تجربة فاخرة مع مسبح داخلي ومركز لياقة بدنية وإطلالة خلابة على الساحل السوري.", Image: "img/الصالح.jpg" },
  { Id: 9, Name: "فندق الشام", Province: "دمشق", Stars: 5, Price: 160, Description: "من أفخم فنادق دمشق، يقدم خدمات راقية وأجنحة ملكية ومطعم دوار يقدم أشهى المأكولات الشرقية.", Image: "img/الشام.jpg" }
];

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
                Stars: parseInt(h.stars || h.Stars) || 5,
                Price: h.price || h.Price,
                Description: h.description || h.Description,
                Image: h.image || h.Image || "img/default.jpg"
            }));
            displayHotels(hotels);
        }
    } catch (e) { console.log("استخدام البيانات المحلية"); }
}

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
                <p>📍 ${h.Province} | 💰 السعر: ${h.Price} دولار</p>
                <p class="desc">${h.Description}</p>
                <button class="btn book-btn" onclick='openBookingModal(${JSON.stringify(h)})'>احجز الآن</button>
            </div>
        `;
        list.appendChild(card);
    });
}

// دوال فتح المودال والبحث تبقى كما هي في ملفك الأصلي
fetchHotels();
