/* Melano Dieline - Parametric Packaging Geometry Engine (19 Box Structures) */

const BOX_TEMPLATES = [
  { id: 'rte', code: 'RTE', cat: 'cartons', nameAr: 'علبة تكسير عكسي (Reverse Tuck End)', nameEn: 'Reverse Tuck End', descAr: 'علبة كرتون قياسية بغلق من الأعلى والأسبل باتجاهين متعاكسين.', descEn: 'Standard folding carton with top and bottom tuck flaps facing opposite sides.' },
  { id: 'ste', cat: 'cartons', code: 'STE', nameAr: 'علبة تكسير مستقيم (Straight Tuck End)', nameEn: 'Straight Tuck End', descAr: 'علبة كرتون فاخرة لأدوات التجميل والأدوية بفتحة ناعمة.', descEn: 'Premium carton for cosmetics and pharmaceuticals with smooth top fold.' },
  { id: 'alb', cat: 'cartons', code: 'ALB', nameAr: 'علبة قاع قفل تلقائي (Auto-Lock Bottom)', nameEn: 'Auto-Lock Bottom', descAr: 'علبة تتحمل الأوزان الثقيلة بقاع يغلق أوتوماتيكياً عند الفتح.', descEn: 'Heavy-duty carton featuring a pre-glued auto-locking bottom.' },
  { id: 'tcb', cat: 'cartons', code: 'TCB', nameAr: 'علبة قاع 1-2-3 (123 Bottom Tuck Top)', nameEn: '1-2-3 Bottom Tuck Top', descAr: 'علبة بقاع متشابك يدوي من 3 خطوات دون الحاجة للصق.', descEn: 'Carton with snap-locking bottom flaps assembled without glue.' },
  { id: 'snl', cat: 'cartons', code: 'SNL', nameAr: 'علبة قفل سناب محكم (Snap-Lock Tuck End)', nameEn: 'Snap-Lock Tuck End', descAr: 'علبة بإغلاق إضافي جانبي لمنع الفتح التلقائي.', descEn: 'Carton with secure locking ears on tuck flaps.' },
  { id: 'slf', cat: 'cartons', code: 'SLF', nameAr: 'علبة غطاء قفل ذاتي (Self-Locking Flip Top)', nameEn: 'Self-Locking Flip Top', descAr: 'علبة هدايا بغطاء قلاب ولسان قفل جانبي محكم.', descEn: 'Gift and retail box with hinged lid and side locking tabs.' },
  { id: 'rhm', cat: 'mailers', code: 'RHM', nameAr: 'صندوق شحن بريدي Rollover Mailer', nameEn: 'Rollover Hinged Mailer', descAr: 'صندوق كرتون مضلع للشحن والتجارة الإلكترونية بحواشي دبل.', descEn: 'Corrugated E-commerce mailer box with double-wall sides.' },
  { id: 'slt', cat: 'mailers', code: 'SLT', nameAr: 'صينية قفل ذاتي (Self-Locking Tray)', nameEn: 'Self-Locking Tray', descAr: 'صينية مفتوحة بدون غطاء لتجميع المنتجات والشحن.', descEn: 'Open-top corrugated display and shipping tray.' },
  { id: 't26', cat: 'mailers', code: 'T26', nameAr: 'صينية غطاء مفصلي (Hinged Lid Tray)', nameEn: 'Hinged Lid Tray', descAr: 'علبة أحذية ومخبوزات صلبة بغطاء متصل.', descEn: 'Shoe and bakery box tray with connected top lid.' },
  { id: 'mbh', cat: 'mailers', code: 'MBH', nameAr: 'صندوق شحن بمقبض (Mailer Box with Handle)', nameEn: 'Mailer Box with Handle', descAr: 'علبة كرتون مضلع مجهزة بمسكة يد سهلة الحمل.', descEn: 'Portable corrugated box featuring a die-cut carry handle.' },
  { id: 'mbz', cat: 'mailers', code: 'MBZ', nameAr: 'صندوق شحن بفرط سحاب (Mailer with Zipper)', nameEn: 'Mailer Box with Zipper', descAr: 'صندوق بريدي مجهز بشريط فتح سحاب ممتع للتجربة.', descEn: 'E-commerce box with tear-strip zipper opening.' },
  { id: 'ps1', cat: 'display', code: 'PS1', nameAr: 'علبة عرض ستاند (POS Display Box)', nameEn: 'POS Display Box', descAr: 'علبة عرض على المحاسبة تفتح لتصبح ستاند منتجات.', descEn: 'Point of sale counter display box with tear-away header.' },
  { id: 'ps2', cat: 'display', code: 'PS2', nameAr: 'علبة عرض مدرجة (POS Display Type 2)', nameEn: 'POS Display Box (Type 2)', descAr: 'ستاند عرض منتجات بدرجتين لزيادة رؤية المنتجات.', descEn: 'Two-tier counter display container for retail shelves.' },
  { id: 'pcn', cat: 'display', code: 'PCN', nameAr: 'علبة بوب كورن (Popcorn / Tapered Box)', nameEn: 'Popcorn Box', descAr: 'علبة مخروطية متسعة للأعلى للأغذية والمأكولات السريعة.', descEn: 'Tapered open container for popcorn and food service.' },
  { id: 'plw', cat: 'display', code: 'PLW', nameAr: 'علبة وسادة بيضاوية (Pillow Box)', nameEn: 'Pillow Box', descAr: 'علبة منحنية للإكسسوارات والعطور والملابس الخفيفة.', descEn: 'Curved pillow-shaped box for jewelry, apparel, and gifts.' },
  { id: 'gbh', cat: 'carriers', code: 'GBH', nameAr: 'علبة جابل بمقبض (Gable Box with Handle)', nameEn: 'Gable Box with Handle', descAr: 'علبة وجبات وهدايا بمقبض علوي مثلث أنيق.', descEn: 'Gable top gift and food takeaway box with top handle.' },
  { id: 'pbg', cat: 'carriers', code: 'PBG', nameAr: 'كيس ورقي بقاع مسطح (Grocery SOS Paper Bag)', nameEn: 'Grocery SOS Paper Bag', descAr: 'كيس ورقي للمتاجر والمطاعم بقاع مربع قابل للطي.', descEn: 'Flat-bottom self-opening paper bag for retail and food.' },
  { id: 'cr4', cat: 'carriers', code: 'CR4', nameAr: 'حامل 4 زجاجات (4-Pack Bottle Carrier)', nameEn: '4-Pack Bottle Carrier', descAr: 'حامل مشروبات كرتوني لـ 4 عبوات بمقبض أوسط.', descEn: '4-bottle carton carrier with central divider handle.' },
  { id: 'cr6', cat: 'carriers', code: 'CR6', nameAr: 'حامل 6 زجاجات (6-Pack Bottle Carrier)', nameEn: '6-Pack Bottle Carrier', descAr: 'حامل كرتوني قوي لـ 6 عبوات زجاجية أو معدنية.', descEn: '6-bottle heavy-duty carrier box with individual slots.' }
];

class DielineEngine {
  constructor() {
    this.unitFactor = 1.0; // mm default
  }

  // Generate complete SVG and geometric data for selected box model
  generateBoxData(styleId, params) {
    let { L = 100, W = 60, H = 140, t = 0.5, bleed = 3, tuck = 15, glue = 15, unit = 'mm' } = params;

    // Convert to mm for calculation
    if (unit === 'cm') { L *= 10; W *= 10; H *= 10; t *= 10; bleed *= 10; tuck *= 10; glue *= 10; }
    if (unit === 'in') { L *= 25.4; W *= 25.4; H *= 25.4; t *= 25.4; bleed *= 25.4; tuck *= 25.4; glue *= 25.4; }

    let result = {
      cutPaths: [],
      creasePaths: [],
      bleedPaths: [],
      dimLines: [],
      bbox: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
      panels3D: []
    };

    switch (styleId) {
      case 'ste':
      case 'rte':
        result = this.generateRTE(L, W, H, t, bleed, tuck, glue, styleId === 'ste');
        break;
      case 'alb':
        result = this.generateALB(L, W, H, t, bleed, tuck, glue);
        break;
      case 'rhm':
        result = this.generateRHM(L, W, H, t, bleed, tuck);
        break;
      case 'plw':
        result = this.generatePillow(L, W, H, bleed);
        break;
      case 'gbh':
        result = this.generateGable(L, W, H, bleed, glue);
        break;
      default:
        // Generic parametric folding box layout fallback
        result = this.generateRTE(L, W, H, t, bleed, tuck, glue, false);
        break;
    }

    return result;
  }

  // Reverse Tuck End (RTE) & Straight Tuck End (STE) Engine
  generateRTE(L, W, H, t, bleed, tuck, glue, isStraight = false) {
    const cutPaths = [];
    const creasePaths = [];
    const bleedPaths = [];
    const dimLines = [];
    const dustHeight = Math.min(W * 0.5, 30);

    // Origin offset
    const x0 = glue + bleed + 20;
    const y0 = tuck + dustHeight + bleed + 20;

    // Panel Coordinates
    // Glue Tab -> Panel A (L) -> Panel B (W) -> Panel C (L) -> Panel D (W)
    const xGlue = x0 - glue;
    const xA = x0;
    const xB = xA + L;
    const xC = xB + W;
    const xD = xC + L;
    const xEnd = xD + W;

    const yTop = y0;
    const yBot = y0 + H;

    // Crease Lines (Main Body Folds)
    creasePaths.push({ x1: xA, y1: yTop, x2: xA, y2: yBot });
    creasePaths.push({ x1: xB, y1: yTop, x2: xB, y2: yBot });
    creasePaths.push({ x1: xC, y1: yTop, x2: xC, y2: yBot });
    creasePaths.push({ x1: xD, y1: yTop, x2: xD, y2: yBot });

    creasePaths.push({ x1: xA, y1: yTop, x2: xEnd, y2: yTop });
    creasePaths.push({ x1: xA, y1: yBot, x2: xEnd, y2: yBot });

    // Top Tuck Flap on Panel A (or C if STE)
    const xTopFlap = isStraight ? xA : xC;
    const yTuckTop = yTop - tuck;
    creasePaths.push({ x1: xTopFlap, y1: yTop - 10, x2: xTopFlap + L, y2: yTop - 10 });

    // Cut Outline Path (Outer Contour)
    const dCut = [
      `M ${xGlue} ${yTop + 5}`,
      `L ${xGlue + 3} ${yTop}`,
      `L ${xA} ${yTop}`,
      // Top Flaps
      `L ${xA} ${yTop - dustHeight}`,
      `L ${xA + dustHeight * 0.8} ${yTop - dustHeight}`,
      `L ${xB} ${yTop}`,
      `L ${xB} ${yTop - dustHeight}`,
      `L ${xB + dustHeight * 0.8} ${yTop - dustHeight}`,
      `L ${xC} ${yTop}`,
      // Top Tuck Flap
      `L ${xC} ${yTuckTop + 3}`,
      `Q ${xC} ${yTuckTop} ${xC + 5} ${yTuckTop}`,
      `L ${xC + L - 5} ${yTuckTop}`,
      `Q ${xC + L} ${yTuckTop} ${xC + L} ${yTuckTop + 3}`,
      `L ${xC + L} ${yTop}`,
      `L ${xD} ${yTop - dustHeight}`,
      `L ${xD + dustHeight * 0.8} ${yTop - dustHeight}`,
      `L ${xEnd} ${yTop}`,
      // Right Side Edge
      `L ${xEnd} ${yBot}`,
      // Bottom Flaps
      `L ${xD} ${yBot + dustHeight}`,
      `L ${xC + L} ${yBot}`,
      `L ${xC} ${yBot + tuck}`,
      `L ${xB} ${yBot}`,
      `L ${xA} ${yBot + dustHeight}`,
      `L ${xA} ${yBot}`,
      `L ${xGlue + 3} ${yBot}`,
      `L ${xGlue} ${yBot - 5}`,
      `Z`
    ].join(' ');

    cutPaths.push(dCut);

    // Bleed Outline
    const b = bleed;
    const dBleed = [
      `M ${xGlue - b} ${yTop - b}`,
      `L ${xEnd + b} ${yTop - b}`,
      `L ${xEnd + b} ${yBot + b}`,
      `L ${xGlue - b} ${yBot + b}`,
      `Z`
    ].join(' ');
    bleedPaths.push(dBleed);

    // Dimensions Annotations
    dimLines.push({ type: 'H', x1: xA, x2: xB, y: yBot + 25, label: `L = ${L}mm` });
    dimLines.push({ type: 'H', x1: xB, x2: xC, y: yBot + 25, label: `W = ${W}mm` });
    dimLines.push({ type: 'V', y1: yTop, y2: yBot, x: xEnd + 25, label: `H = ${H}mm` });

    // 3D Panel Definition Hierarchy
    const panels3D = [
      { id: 'front', width: L, height: H, x: xA, y: yTop, rotY: 0 },
      { id: 'right', width: W, height: H, x: xB, y: yTop, rotY: 90, parent: 'front' },
      { id: 'back', width: L, height: H, x: xC, y: yTop, rotY: 180, parent: 'right' },
      { id: 'left', width: W, height: H, x: xD, y: yTop, rotY: 270, parent: 'back' },
      { id: 'topLid', width: L, height: W, x: xC, y: yTop - W, rotX: 90, parent: 'back' },
      { id: 'botLid', width: L, height: W, x: xA, y: yBot, rotX: -90, parent: 'front' }
    ];

    return {
      cutPaths,
      creasePaths,
      bleedPaths,
      dimLines,
      bbox: { minX: xGlue - 20, minY: yTop - tuck - 40, maxX: xEnd + 50, maxY: yBot + tuck + 40 },
      panels3D
    };
  }

  // Auto-Lock Bottom (ALB) Engine
  generateALB(L, W, H, t, bleed, tuck, glue) {
    const res = this.generateRTE(L, W, H, t, bleed, tuck, glue, false);
    // Add Auto-Lock diagonal score creases in bottom panels
    const xA = glue + bleed + 20;
    const yBot = tuck + Math.min(W * 0.5, 30) + bleed + 20 + H;
    res.creasePaths.push({ x1: xA, y1: yBot, x2: xA + L * 0.5, y2: yBot + W * 0.5 });
    res.creasePaths.push({ x1: xA + L, y1: yBot, x2: xA + L + W * 0.5, y2: yBot + W * 0.5 });
    return res;
  }

  // Rollover Hinged Mailer Box (RHM) Engine
  generateRHM(L, W, H, t, bleed, tuck) {
    const cutPaths = [];
    const creasePaths = [];
    const bleedPaths = [];
    const dimLines = [];

    const x0 = H * 2 + bleed + 40;
    const y0 = H * 2 + bleed + 40;

    // Base Panel -> Back Panel -> Lid Panel -> Front Flap
    const dCut = [
      `M ${x0} ${y0}`,
      `h ${L} v ${W} h -${L} Z`,
      `M ${x0 - H} ${y0 - H} h ${L + H * 2} v ${W + H * 3} h -${L + H * 2} Z`
    ].join(' ');

    cutPaths.push(dCut);
    creasePaths.push({ x1: x0, y1: y0, x2: x0 + L, y2: y0 });
    creasePaths.push({ x1: x0, y1: y0 + W, x2: x0 + L, y2: y0 + W });

    dimLines.push({ type: 'H', x1: x0, x2: x0 + L, y: y0 + W + 20, label: `L = ${L}mm` });
    dimLines.push({ type: 'V', y1: y0, y2: y0 + W, x: x0 + L + 20, label: `W = ${W}mm` });

    return {
      cutPaths,
      creasePaths,
      bleedPaths,
      dimLines,
      bbox: { minX: 0, minY: 0, maxX: L + H * 4 + 100, maxY: W + H * 4 + 100 },
      panels3D: []
    };
  }

  // Pillow Box Engine
  generatePillow(L, W, H, bleed) {
    const cutPaths = [];
    const creasePaths = [];
    const bleedPaths = [];
    const dimLines = [];

    const x0 = 50;
    const y0 = 50;

    const r = W * 0.6;
    const dCut = [
      `M ${x0} ${y0}`,
      `Q ${x0 + L * 0.5} ${y0 - 15} ${x0 + L} ${y0}`,
      `v ${W}`,
      `Q ${x0 + L * 0.5} ${y0 + W + 15} ${x0} ${y0 + W}`,
      `Z`,
      `M ${x0 + L} ${y0}`,
      `Q ${x0 + L * 1.5} ${y0 - 15} ${x0 + L * 2} ${y0}`,
      `v ${W}`,
      `Q ${x0 + L * 1.5} ${y0 + W + 15} ${x0 + L} ${y0 + W}`,
      `Z`
    ].join(' ');

    cutPaths.push(dCut);
    creasePaths.push({ x1: x0 + L, y1: y0, x2: x0 + L, y2: y0 + W });

    return {
      cutPaths,
      creasePaths,
      bleedPaths,
      dimLines,
      bbox: { minX: 0, minY: 0, maxX: L * 2 + 100, maxY: W + 100 },
      panels3D: []
    };
  }

  // Gable Box Engine
  generateGable(L, W, H, bleed, glue) {
    return this.generateRTE(L, W, H, 0.5, bleed, 20, glue, false);
  }

  // Render SVG string for 2D Viewport Canvas
  renderSVG(boxData, options = {}) {
    const { showCut = true, showCrease = true, showBleed = true, showDim = true } = options;
    const { cutPaths, creasePaths, bleedPaths, dimLines, bbox } = boxData;
    const width = bbox.maxX - bbox.minX;
    const height = bbox.maxY - bbox.minY;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bbox.minX} ${bbox.minY} ${width} ${height}" width="100%" height="100%">`;
    
    // Background Grid Pattern
    svg += `
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" stroke-width="0.5"/>
        </pattern>
      </defs>
    `;

    // Bleed Layer (#00FF00)
    if (showBleed) {
      svg += `<g id="BLEED_LAYER" stroke="#00FF00" stroke-width="0.75" stroke-dasharray="3,3" fill="none">`;
      bleedPaths.forEach(d => { svg += `<path d="${d}" />`; });
      svg += `</g>`;
    }

    // Crease Layer (#0000FF)
    if (showCrease) {
      svg += `<g id="CREASE_LAYER" stroke="#0000FF" stroke-width="1" stroke-dasharray="4,4" fill="none">`;
      creasePaths.forEach(line => {
        svg += `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" />`;
      });
      svg += `</g>`;
    }

    // Cut Layer (#FF0000)
    if (showCut) {
      svg += `<g id="CUT_LAYER" stroke="#FF0000" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">`;
      cutPaths.forEach(d => { svg += `<path d="${d}" />`; });
      svg += `</g>`;
    }

    // Dimensions Layer (#334155)
    if (showDim) {
      svg += `<g id="DIMENSIONS_LAYER" stroke="#334155" stroke-width="0.75" fill="#334155" font-family="JetBrains Mono, monospace" font-size="11">`;
      dimLines.forEach(dim => {
        if (dim.type === 'H') {
          svg += `<line x1="${dim.x1}" y1="${dim.y}" x2="${dim.x2}" y2="${dim.y}" />`;
          svg += `<line x1="${dim.x1}" y1="${dim.y - 4}" x2="${dim.x1}" y2="${dim.y + 4}" />`;
          svg += `<line x1="${dim.x2}" y1="${dim.y - 4}" x2="${dim.x2}" y2="${dim.y + 4}" />`;
          svg += `<text x="${(dim.x1 + dim.x2) / 2}" y="${dim.y - 6}" text-anchor="middle">${dim.label}</text>`;
        } else {
          svg += `<line x1="${dim.x}" y1="${dim.y1}" x2="${dim.x}" y2="${dim.y2}" />`;
          svg += `<line x1="${dim.x - 4}" y1="${dim.y1}" x2="${dim.x + 4}" y2="${dim.y1}" />`;
          svg += `<line x1="${dim.x - 4}" y1="${dim.y2}" x2="${dim.x + 4}" y2="${dim.y2}" />`;
          svg += `<text x="${dim.x + 8}" y="${(dim.y1 + dim.y2) / 2}" dominant-baseline="middle">${dim.label}</text>`;
        }
      });
      svg += `</g>`;
    }

    svg += `</svg>`;
    return svg;
  }
}

window.dielineEngine = new DielineEngine();
