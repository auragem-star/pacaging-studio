/* Melano Dieline - i18n & Translation Dictionary (Arabic / English) */

const translations = {
  ar: {
    brandName: "ميلانو ديلاين",
    brandTagline: "مولد دايكت وقوالب وتصاميم علب التعبئة والتغليف 3D",
    navHome: "الرئيسية",
    navStudio: "استوديو الدايكت",
    navTemplates: "قوالب العلب",
    navGuide: "دليل الطباعة",
    navPricing: "الأسعار",
    heroTitle: "مولد دايكت العلب التفاعلي وسريع التصدير",
    heroSub: "قم بإنشاء وتعديل خطوط قص وتكسير العلب (Dielines) بدقة عالية بالمليمتر. صمّم علبتك وعاينها ثلاثية الأبعاد 3D ثم اصدر ملفات SVG و PDF و DXF للطباعة والقص مباشرة.",
    btnOpenStudio: "افتح الاستوديو وتصاميم العلب",
    btnExploreTemplates: "استعرض 19 قالب علبة",
    catAll: "جميع القوالب (19)",
    catCartons: "علب كرتون خفيفة (Folding Cartons)",
    catMailers: "علب شحن وبريد (Corrugated Mailers)",
    catDisplay: "علب عرض ومأكولات (Display & Food)",
    catCarriers: "علب شنط وحوامل (Carriers & Bags)",
    searchPlaceholder: "ابحث عن نوع العلبة أو اسمها...",
    dimLength: "الطول (L)",
    dimWidth: "العرض (W)",
    dimHeight: "الارتفاع (H)",
    dimCaliper: "سمك الخامة (t)",
    dimBleed: "هامش الطباعة (Bleed)",
    dimTuck: "لسان الغلق (Tuck Flap)",
    dimGlue: "لسان اللصق (Glue Tab)",
    unitMm: "مليمتر (mm)",
    unitCm: "سنتيمتر (cm)",
    unitIn: "بوصة (in)",
    modeInternal: "مقاس داخلي",
    modeExternal: "مقاس خارجي",
    modeDiecut: "خط القص",
    view2D: "مخطط فلات 2D",
    view3D: "مجسم العلبة 3D",
    foldProgress: "درجة طي العلبة 3D:",
    exportSVG: "تصدير SVG متجهات",
    exportPDF: "تصدير PDF جاهز للطباعة",
    exportDXF: "تصدير DXF لماكينات CNC",
    exportPNG: "تحميل صورة PNG",
    materialKraft: "كرتون كرافت بنّي (Kraft Paper)",
    materialWhite: "ورق مقوى أبيض (White Cardboard)",
    materialCorrugated: "كرتون مضلع (Corrugated Flute)",
    layerCut: "خط القص (Cut Line)",
    layerCrease: "خط الطي والتكسير (Crease Score)",
    layerBleed: "منطقة الزيادة (Bleed Area)",
    layerDimensions: "مقاسات الأبعاد (Dimensions)",
    footerCopy: "جميع الحقوق محفوظة © 2026 ميلانو باكدجينج (Melano Packaging).",
    btnCustomize: "تعديل في الاستوديو",
    prepressTitle: "معايير ألوان خطوط الدايكت في ميلانو ديلاين",
    prepressText: "يتم إنشاء ملفات الدايكت بطلاء ألوان Prepress قياسية لضمان التوافق التام مع مطابع الكرتون وماكينات القص الليزر وZünd."
  },
  en: {
    brandName: "Melano Dieline",
    brandTagline: "Parametric Packaging Dieline & 3D Mockup Generator",
    navHome: "Home",
    navStudio: "Dieline Studio",
    navTemplates: "Box Templates",
    navGuide: "Prepress Guide",
    navPricing: "Pricing",
    heroTitle: "Interactive Parametric Packaging Dieline Generator",
    heroSub: "Generate print-ready packaging dielines in seconds. Customize box dimensions, preview interactive 3D folding models, and export precision vector PDF, SVG, and DXF CAD files.",
    btnOpenStudio: "Open Studio & Dieline Canvas",
    btnExploreTemplates: "Explore 19 Box Templates",
    catAll: "All Templates (19)",
    catCartons: "Folding Cartons",
    catMailers: "Corrugated Mailers",
    catDisplay: "Display & Food Service",
    catCarriers: "Carriers & Bags",
    searchPlaceholder: "Search box styles or names...",
    dimLength: "Length (L)",
    dimWidth: "Width (W)",
    dimHeight: "Height (H)",
    dimCaliper: "Board Caliper (t)",
    dimBleed: "Bleed Margin",
    dimTuck: "Tuck Flap",
    dimGlue: "Glue Tab",
    unitMm: "Millimeters (mm)",
    unitCm: "Centimeters (cm)",
    unitIn: "Inches (in)",
    modeInternal: "Internal Size",
    modeExternal: "External Size",
    modeDiecut: "Die-cut Line",
    view2D: "2D Flat Dieline",
    view3D: "3D Folding Box",
    foldProgress: "3D Fold Progress:",
    exportSVG: "Export Vector SVG",
    exportPDF: "Export Print-Ready PDF",
    exportDXF: "Export DXF CAD File",
    exportPNG: "Download PNG Preview",
    materialKraft: "Brown Kraft Paper",
    materialWhite: "White Cardboard",
    materialCorrugated: "Corrugated Flute Board",
    layerCut: "Cut Line (Cut Contour)",
    layerCrease: "Crease Score Line",
    layerBleed: "Bleed Area Boundary",
    layerDimensions: "Dimension Annotations",
    footerCopy: "All rights reserved © 2026 Melano Packaging.",
    btnCustomize: "Customize in Studio",
    prepressTitle: "Prepress Dieline Color Standards",
    prepressText: "Dieline outputs use standard production vector layers compatible with Adobe Illustrator, ArtiosCAD, Zünd, and Esko cutting software."
  }
};

let currentLang = localStorage.getItem('melano_lang') || 'ar';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('melano_lang', lang);
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  
  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
        el.placeholder = translations[lang][key];
      } else {
        el.textContent = translations[lang][key];
      }
    }
  });

  // Update language toggle button text if exists
  const langBtn = document.getElementById('lang-toggle-btn');
  if (langBtn) {
    langBtn.textContent = lang === 'ar' ? 'English' : 'عربي';
  }
}

function toggleLanguage() {
  setLanguage(currentLang === 'ar' ? 'en' : 'ar');
}

document.addEventListener('DOMContentLoaded', () => {
  setLanguage(currentLang);
});
