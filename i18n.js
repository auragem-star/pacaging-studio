/* Melano Dieline - i18n & Translation Dictionary (Default: English) */

const translations = {
  en: {
    brandName: "Melano Dieline",
    brandTagline: "Parametric Packaging Dieline & 3D Mockup Generator",
    navHome: "Templates",
    navStudio: "Studio Generator",
    navGuide: "Prepress Standards",
    navPricing: "Pricing",
    heroTitle: "Free Packaging Dieline Generator — 19 Box Templates",
    heroSub: "Draw print-ready packaging dielines in the browser. Type your dimensions, board caliper and bleed, preview interactive 3D box models, and export PDF, AI or SVG.",
    btnOpenStudio: "Open Dieline Studio",
    btnExploreTemplates: "Explore 19 Templates",
    catAll: "All Templates (19)",
    catCartons: "Folding Cartons",
    catMailers: "Mailers & Trays",
    catDisplay: "Food & Display",
    catCarriers: "Bottle Carriers",
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
    footerCopy: "All rights reserved © 2026 Melano Dieline.",
    btnCustomize: "Customize in Studio",
    prepressTitle: "Prepress Line Standards",
    prepressText: "Vector output generated at true millimeter scale with production colors separated on clean layers."
  },
  ar: {
    brandName: "ميلانو ديلاين",
    brandTagline: "مولد دايكت وقوالب وتصاميم علب التعبئة والتغليف 3D",
    navHome: "القوالب",
    navStudio: "استوديو الدايكت",
    navGuide: "دليل الطباعة",
    navPricing: "الأسعار",
    heroTitle: "مولد دايكت العلب والتغليف مجاناً — 19 قالب",
    heroSub: "قم بإنشاء وتعديل خطوط قص وتكسير العلب (Dielines) بدقة عالية بالمليمتر. صمّم علبتك وعاينها ثلاثية الأبعاد 3D ثم اصدر ملفات SVG و PDF و DXF للطباعة والقص مباشرة.",
    btnOpenStudio: "افتح استوديو الدايكت",
    btnExploreTemplates: "استعرض 19 قالب علبة",
    catAll: "جميع القوالب (19)",
    catCartons: "علب كرتون خفيفة",
    catMailers: "علب شحن وبريد",
    catDisplay: "علب عرض ومأكولات",
    catCarriers: "علب شنط وحوامل",
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
    materialKraft: "كرتون كرافت بنّي",
    materialWhite: "ورق مقوى أبيض",
    materialCorrugated: "كرتون مضلع",
    layerCut: "خط القص (Cut Line)",
    layerCrease: "خط الطي والتكسير",
    layerBleed: "منطقة الزيادة (Bleed Area)",
    layerDimensions: "مقاسات الأبعاد",
    footerCopy: "جميع الحقوق محفوظة © 2026 ميلانو ديلاين.",
    btnCustomize: "تعديل في الاستوديو",
    prepressTitle: "معايير ألوان خطوط الدايكت",
    prepressText: "يتم إنشاء ملفات الدايكت بطلاء ألوان Prepress قياسية لضمان التوافق التام مع مطابع الكرتون وماكينات القص."
  }
};

let currentLang = localStorage.getItem('melano_lang') || 'en';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('melano_lang', lang);
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  
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

  const langBtn = document.getElementById('lang-toggle-btn');
  if (langBtn) {
    langBtn.textContent = lang === 'en' ? 'عربي' : 'English';
  }
}

function toggleLanguage() {
  setLanguage(currentLang === 'en' ? 'ar' : 'en');
}

document.addEventListener('DOMContentLoaded', () => {
  setLanguage(currentLang);
});
