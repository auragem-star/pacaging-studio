/* Packaging Dieline Engine - 19 Parametric Box Templates */

const BOX_TEMPLATES = [
  { id: 'pbg', code: 'PBG', cat: 'bags', name: 'Grocery Paper Bag (SOS)', desc: 'Bags, gable and pillow. Self-opening sack paper bag with flat bottom fold.' },
  { id: 't26', code: 'T26', cat: 'mailers', name: 'Hinged Lid Tray', desc: 'Corrugated mailers and trays. Rigid shoe box and bakery style tray with connected lid.' },
  { id: 'pcn', code: 'PCN', cat: 'display', name: 'Popcorn Box', desc: 'Food service and retail display. Tapered open container for popcorn and food service.' },
  { id: 'cr6', code: 'CR6', cat: 'carriers', name: '6-Pack Bottle Carrier', desc: 'Bottle carriers. Heavy-duty carton carrier box with individual dividers and central handle.' },
  { id: 'cr4', code: 'CR4', cat: 'carriers', name: '4-Pack Bottle Carrier', desc: 'Bottle carriers. 4-bottle carton carrier with central handle divider.' },
  { id: 'slf', code: 'SLF', cat: 'cartons', name: 'Self-Locking Flip Top', desc: 'Folding cartons. Retail and gift box with hinged flip lid and side locking tabs.' },
  { id: 'ps1', code: 'PS1', cat: 'display', name: 'POS Display Box', desc: 'Food service and retail display. Counter display container with tear-away header.' },
  { id: 'ps2', code: 'PS2', cat: 'display', name: 'POS Display Box (Type 2)', desc: 'Food service and retail display. Two-tier counter display box for retail shelves.' },
  { id: 'plw', code: 'PLW', cat: 'bags', name: 'Pillow Box', desc: 'Bags, gable and pillow. Curved pillow-shaped pouch for jewelry, cosmetics and apparel.' },
  { id: 'rte', code: 'RTE', cat: 'cartons', name: 'Reverse Tuck End', desc: 'Folding cartons. Standard packaging carton with top and bottom tuck flaps facing opposite sides.' },
  { id: 'gbh', code: 'GBH', cat: 'bags', name: 'Gable Box with Handle', desc: 'Bags, gable and pillow. Takeaway food and party favor box with top integrated handle.' },
  { id: 'alb', code: 'ALB', cat: 'cartons', name: 'Auto-Lock Bottom', desc: 'Folding cartons. Heavy-duty carton featuring a pre-glued auto-locking bottom.' },
  { id: 'tcb', code: 'TCB', cat: 'cartons', name: '123-Bottom Tuck Top', desc: 'Folding cartons. Snap-locking bottom flaps assembled manually without glue.' },
  { id: 'slt', code: 'SLT', cat: 'mailers', name: 'Self-Locking Tray', desc: 'Corrugated mailers and trays. Open-top corrugated display and shipping tray.' },
  { id: 'rhm', code: 'RHM', cat: 'mailers', name: 'Rollover Hinged-Lid Mailer', desc: 'Corrugated mailers and trays. E-commerce mailer box with double-wall roll side flaps.' },
  { id: 'mbh', code: 'MBH', cat: 'mailers', name: 'Mailer Box with Handle', desc: 'Corrugated mailers and trays. Portable corrugated box featuring a die-cut carry handle.' },
  { id: 'mbz', code: 'MBZ', cat: 'mailers', name: 'Mailer Box with Zipper', desc: 'Corrugated mailers and trays. E-commerce box with tear-strip zipper opening.' },
  { id: 'ste', code: 'STE', cat: 'cartons', name: 'Straight Tuck End', desc: 'Folding cartons. Premium cosmetics and pharma box with smooth front fold.' },
  { id: 'snl', code: 'SNL', cat: 'cartons', name: 'Snap-Lock Tuck End', desc: 'Folding cartons. Secure locking ears on top tuck flap.' }
];

class DielineEngine {
  generateBoxData(styleId, params) {
    let { L = 120, W = 60, H = 140, t = 0.5, bleed = 3, tuck = 15, glue = 15, unit = 'mm' } = params;

    if (unit === 'cm') { L *= 10; W *= 10; H *= 10; t *= 10; bleed *= 10; tuck *= 10; glue *= 10; }
    if (unit === 'in') { L *= 25.4; W *= 25.4; H *= 25.4; t *= 25.4; bleed *= 25.4; tuck *= 25.4; glue *= 25.4; }

    const cutPaths = [];
    const creasePaths = [];
    const bleedPaths = [];
    const dimLines = [];

    // Origin
    const x0 = glue + bleed + 20;
    const y0 = tuck + Math.min(W * 0.5, 30) + bleed + 20;

    const xGlue = x0 - glue;
    const xA = x0;
    const xB = xA + L;
    const xC = xB + W;
    const xD = xC + L;
    const xEnd = xD + W;

    const yTop = y0;
    const yBot = y0 + H;
    const dustH = Math.min(W * 0.45, 25);

    // Default Main Crease Score Lines (#0000FF)
    creasePaths.push({ x1: xA, y1: yTop, x2: xA, y2: yBot });
    creasePaths.push({ x1: xB, y1: yTop, x2: xB, y2: yBot });
    creasePaths.push({ x1: xC, y1: yTop, x2: xC, y2: yBot });
    creasePaths.push({ x1: xD, y1: yTop, x2: xD, y2: yBot });
    creasePaths.push({ x1: xA, y1: yTop, x2: xEnd, y2: yTop });
    creasePaths.push({ x1: xA, y1: yBot, x2: xEnd, y2: yBot });

    let dCut = '';

    switch (styleId) {
      case 'pbg': // Grocery Paper Bag
        dCut = [
          `M ${xA} ${yTop - dustH}`, `L ${xEnd} ${yTop - dustH}`,
          `L ${xEnd} ${yBot + W}`, `L ${xA} ${yBot + W}`, `Z`
        ].join(' ');
        break;

      case 'cr6': // 6-Pack Bottle Carrier
      case 'cr4': // 4-Pack Bottle Carrier
        dCut = [
          `M ${xGlue} ${yTop}`, `L ${xA} ${yTop - 30}`, `L ${xB} ${yTop - 50}`,
          `L ${xC} ${yTop - 50}`, `L ${xD} ${yTop - 30}`, `L ${xEnd} ${yTop}`,
          `L ${xEnd} ${yBot}`, `L ${xD} ${yBot + 30}`, `L ${xA} ${yBot + 30}`,
          `L ${xGlue} ${yBot}`, `Z`
        ].join(' ');
        break;

      case 'plw': // Pillow Box
        dCut = [
          `M ${xA} ${yTop}`,
          `Q ${xA + L * 0.5} ${yTop - 20} ${xB} ${yTop}`,
          `L ${xB} ${yBot}`,
          `Q ${xA + L * 0.5} ${yBot + 20} ${xA} ${yBot}`,
          `Z`,
          `M ${xB} ${yTop}`,
          `Q ${xB + L * 0.5} ${yTop - 20} ${xC} ${yTop}`,
          `L ${xC} ${yBot}`,
          `Q ${xB + L * 0.5} ${yBot + 20} ${xB} ${yBot}`,
          `Z`
        ].join(' ');
        break;

      case 'pcn': // Popcorn Box
        dCut = [
          `M ${xA - 15} ${yTop}`, `L ${xB + 15} ${yTop}`, `L ${xB} ${yBot}`, `L ${xA} ${yBot}`, `Z`,
          `M ${xB + 15} ${yTop}`, `L ${xC + 30} ${yTop}`, `L ${xC} ${yBot}`, `L ${xB} ${yBot}`, `Z`
        ].join(' ');
        break;

      case 'rhm': // Rollover Hinged Mailer
      case 'slt': // Self-Locking Tray
        dCut = [
          `M ${xGlue} ${yTop - W}`, `L ${xEnd + W} ${yTop - W}`,
          `L ${xEnd + W} ${yBot + W}`, `L ${xGlue} ${yBot + W}`, `Z`
        ].join(' ');
        break;

      case 'ste': // Straight Tuck End
      case 'rte': // Reverse Tuck End
      default:
        dCut = [
          `M ${xGlue} ${yTop + 5}`, `L ${xGlue + 3} ${yTop}`, `L ${xA} ${yTop}`,
          `L ${xA} ${yTop - dustH}`, `L ${xA + dustH * 0.8} ${yTop - dustH}`, `L ${xB} ${yTop}`,
          `L ${xB} ${yTop - dustH}`, `L ${xB + dustH * 0.8} ${yTop - dustH}`, `L ${xC} ${yTop}`,
          `L ${xC} ${yTop - tuck}`, `Q ${xC} ${yTop - tuck - 4} ${xC + 4} ${yTop - tuck - 4}`,
          `L ${xC + L - 4} ${yTop - tuck - 4}`, `Q ${xC + L} ${yTop - tuck - 4} ${xC + L} ${yTop - tuck}`,
          `L ${xC + L} ${yTop}`, `L ${xD} ${yTop - dustH}`, `L ${xD + dustH * 0.8} ${yTop - dustH}`,
          `L ${xEnd} ${yTop}`, `L ${xEnd} ${yBot}`,
          `L ${xD} ${yBot + dustH}`, `L ${xC + L} ${yBot}`, `L ${xC} ${yBot + tuck}`, `L ${xB} ${yBot}`,
          `L ${xA} ${yBot + dustH}`, `L ${xA} ${yBot}`, `L ${xGlue + 3} ${yBot}`, `L ${xGlue} ${yBot - 5}`, `Z`
        ].join(' ');
        break;
    }

    cutPaths.push(dCut);

    // Bleed Outline (#00FF00)
    const b = bleed;
    bleedPaths.push(`M ${xGlue - b} ${yTop - tuck - 10 - b} L ${xEnd + b} ${yTop - tuck - 10 - b} L ${xEnd + b} ${yBot + tuck + 10 + b} L ${xGlue - b} ${yBot + tuck + 10 + b} Z`);

    // Dimensions
    dimLines.push({ type: 'H', x1: xA, x2: xB, y: yBot + 25, label: `L = ${L}mm` });
    dimLines.push({ type: 'H', x1: xB, x2: xC, y: yBot + 25, label: `W = ${W}mm` });
    dimLines.push({ type: 'V', y1: yTop, y2: yBot, x: xEnd + 25, label: `H = ${H}mm` });

    return {
      cutPaths,
      creasePaths,
      bleedPaths,
      dimLines,
      bbox: { minX: xGlue - 20, minY: yTop - tuck - 30, maxX: xEnd + 40, maxY: yBot + tuck + 40 }
    };
  }

  // Render Exact Vector SVG
  renderSVG(boxData, options = {}) {
    const { showCut = true, showCrease = true, showBleed = true, showDim = true } = options;
    const { cutPaths, creasePaths, bleedPaths, dimLines, bbox } = boxData;
    const width = bbox.maxX - bbox.minX;
    const height = bbox.maxY - bbox.minY;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bbox.minX} ${bbox.minY} ${width} ${height}" width="100%" height="100%">`;

    // Bleed Layer (#00FF00)
    if (showBleed) {
      svg += `<g id="BLEED" stroke="#00FF00" stroke-width="0.75" stroke-dasharray="3,3" fill="none">`;
      bleedPaths.forEach(d => { svg += `<path d="${d}" />`; });
      svg += `</g>`;
    }

    // Crease Scores Layer (#0000FF Dashed)
    if (showCrease) {
      svg += `<g id="CREASE" stroke="#0000FF" stroke-width="0.85" stroke-dasharray="3,2" stroke-linejoin="round" fill="none">`;
      creasePaths.forEach(line => {
        svg += `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" />`;
      });
      svg += `</g>`;
    }

    // Cut Contour Layer (#FF0000 Solid)
    if (showCut) {
      svg += `<g id="CUT" stroke="#FF0000" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" fill="none">`;
      cutPaths.forEach(d => { svg += `<path d="${d}" />`; });
      svg += `</g>`;
    }

    // Dimensions Layer
    if (showDim && dimLines.length > 0) {
      svg += `<g id="DIMENSIONS" stroke="#334155" stroke-width="0.75" fill="#334155" font-family="JetBrains Mono, monospace" font-size="11">`;
      dimLines.forEach(dim => {
        if (dim.type === 'H') {
          svg += `<line x1="${dim.x1}" y1="${dim.y}" x2="${dim.x2}" y2="${dim.y}" />`;
          svg += `<text x="${(dim.x1 + dim.x2) / 2}" y="${dim.y - 5}" text-anchor="middle">${dim.label}</text>`;
        } else {
          svg += `<line x1="${dim.x}" y1="${dim.y1}" x2="${dim.x}" y2="${dim.y2}" />`;
          svg += `<text x="${dim.x + 6}" y="${(dim.y1 + dim.y2) / 2}" dominant-baseline="middle">${dim.label}</text>`;
        }
      });
      svg += `</g>`;
    }

    svg += `</svg>`;
    return svg;
  }
}

window.dielineEngine = new DielineEngine();
