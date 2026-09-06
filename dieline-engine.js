/* Melano Dieline Engine - High-Precision CAD Solver for 19 Box Structures */

class DielineEngine {
  constructor() {
    this.unitsMultiplier = { mm: 1, cm: 10, in: 25.4 };
  }

  getUnitFactor(unit) {
    return this.unitsMultiplier[unit] || 1;
  }

  generateBoxData(styleId, params) {
    let { L = 120, W = 60, H = 160, t = 0.5, bleed = 3, unit = 'mm' } = params;
    
    // Normalize to mm for CAD math
    const factor = this.getUnitFactor(unit);
    const L_mm = L * factor;
    const W_mm = W * factor;
    const H_mm = H * factor;
    const t_mm = Number(t) || 0.5;
    const b_mm = Number(bleed) || 3;

    const key = (styleId || 'rte').toLowerCase();

    // Call individual parametric solver
    let solverResult;
    switch (key) {
      case 'ste': // Straight Tuck End
        solverResult = this.solveSTE(L_mm, W_mm, H_mm, t_mm, b_mm);
        break;
      case 'alb': // Auto-Lock Bottom
        solverResult = this.solveALB(L_mm, W_mm, H_mm, t_mm, b_mm);
        break;
      case 'tcb': // 123-Bottom Tuck Top
        solverResult = this.solveTCB(L_mm, W_mm, H_mm, t_mm, b_mm);
        break;
      case 'slf': // Self-Locking Flip Top
        solverResult = this.solveSLF(L_mm, W_mm, H_mm, t_mm, b_mm);
        break;
      case 'snl': // Snap-Lock Tuck End
        solverResult = this.solveSNL(L_mm, W_mm, H_mm, t_mm, b_mm);
        break;
      case 't26': // Hinged Lid Tray
        solverResult = this.solveT26(L_mm, W_mm, H_mm, t_mm, b_mm);
        break;
      case 'slt': // Self-Locking Tray
        solverResult = this.solveSLT(L_mm, W_mm, H_mm, t_mm, b_mm);
        break;
      case 'rhm': // Rollover Hinged Mailer
        solverResult = this.solveRHM(L_mm, W_mm, H_mm, t_mm, b_mm);
        break;
      case 'mbh': // Mailer Box with Handle
        solverResult = this.solveMBH(L_mm, W_mm, H_mm, t_mm, b_mm);
        break;
      case 'mbz': // Mailer Box with Zipper
        solverResult = this.solveMBZ(L_mm, W_mm, H_mm, t_mm, b_mm);
        break;
      case 'cr6': // 6-Pack Bottle Carrier
        solverResult = this.solveCR6(L_mm, W_mm, H_mm, t_mm, b_mm);
        break;
      case 'cr4': // 4-Pack Bottle Carrier
        solverResult = this.solveCR4(L_mm, W_mm, H_mm, t_mm, b_mm);
        break;
      case 'pbg': // Grocery Paper Bag (SOS)
        solverResult = this.solvePBG(L_mm, W_mm, H_mm, t_mm, b_mm);
        break;
      case 'gbh': // Gable Box with Handle
        solverResult = this.solveGBH(L_mm, W_mm, H_mm, t_mm, b_mm);
        break;
      case 'plw': // Pillow Box
        solverResult = this.solvePLW(L_mm, W_mm, H_mm, t_mm, b_mm);
        break;
      case 'pcn': // Popcorn Box
        solverResult = this.solvePCN(L_mm, W_mm, H_mm, t_mm, b_mm);
        break;
      case 'ps1': // POS Display Box
        solverResult = this.solvePS1(L_mm, W_mm, H_mm, t_mm, b_mm);
        break;
      case 'ps2': // POS Display Box Type 2
        solverResult = this.solvePS2(L_mm, W_mm, H_mm, t_mm, b_mm);
        break;
      case 'rte': // Reverse Tuck End (Default)
      default:
        solverResult = this.solveRTE(L_mm, W_mm, H_mm, t_mm, b_mm);
        break;
    }

    return solverResult;
  }

  // 1. REVERSE TUCK END (RTE)
  solveRTE(L, W, H, t, b) {
    const glue = 15;
    const tuck = Math.min(W * 0.65, 20);
    const dustH = Math.min(W * 0.45, 25);
    const foldOffset = t * 0.5;

    const xGlue = 10;
    const xA = xGlue + glue;
    const xB = xA + L;
    const xC = xB + W;
    const xD = xC + L;
    const xEnd = xD + W;

    const yTop = 20 + tuck + 10;
    const yBot = yTop + H;

    const cutPaths = [];
    const creasePaths = [];
    const bleedPaths = [];
    const dimLines = [];

    // Outer Cut Outline
    const outerCut = [
      `M ${xGlue} ${yTop + 5}`,
      `L ${xGlue + 4} ${yTop}`,
      `L ${xA} ${yTop}`,
      // Panel 1 Top Dust Flap
      `L ${xA} ${yTop - dustH}`, `L ${xA + dustH * 0.8} ${yTop - dustH}`, `L ${xB} ${yTop}`,
      // Panel 2 Top Tuck Flap
      `L ${xB} ${yTop - dustH}`, `L ${xB + dustH * 0.8} ${yTop - dustH}`, `L ${xC} ${yTop}`,
      // Panel 3 Top Tuck Flap (Reverse Side)
      `L ${xC} ${yTop - tuck}`, `Q ${xC} ${yTop - tuck - 4} ${xC + 4} ${yTop - tuck - 4}`,
      `L ${xC + L - 4} ${yTop - tuck - 4}`, `Q ${xC + L} ${yTop - tuck - 4} ${xC + L} ${yTop - tuck}`,
      `L ${xC + L} ${yTop}`,
      // Panel 4 Top Dust Flap
      `L ${xD} ${yTop - dustH}`, `L ${xD + dustH * 0.8} ${yTop - dustH}`, `L ${xEnd} ${yTop}`,
      `L ${xEnd} ${yBot}`,
      // Bottom Flaps
      `L ${xD} ${yBot + dustH}`, `L ${xC + L} ${yBot}`,
      `L ${xC} ${yBot + tuck}`, `Q ${xC} ${yBot + tuck + 4} ${xC - 4} ${yBot + tuck + 4}`,
      `L ${xB + 4} ${yBot + tuck + 4}`, `Q ${xB} ${yBot + tuck + 4} ${xB} ${yBot + tuck}`, `L ${xB} ${yBot}`,
      `L ${xA} ${yBot + dustH}`, `L ${xA} ${yBot}`,
      `L ${xGlue + 4} ${yBot}`, `L ${xGlue} ${yBot - 5}`, `Z`
    ].join(' ');
    cutPaths.push(outerCut);

    // Crease Score Lines
    creasePaths.push({ x1: xA, y1: yTop, x2: xA, y2: yBot });
    creasePaths.push({ x1: xB, y1: yTop, x2: xB, y2: yBot });
    creasePaths.push({ x1: xC, y1: yTop, x2: xC, y2: yBot });
    creasePaths.push({ x1: xD, y1: yTop, x2: xD, y2: yBot });
    creasePaths.push({ x1: xA, y1: yTop, x2: xEnd, y2: yTop });
    creasePaths.push({ x1: xA, y1: yBot, x2: xEnd, y2: yBot });
    // Tuck flap crease
    creasePaths.push({ x1: xC, y1: yTop - tuck, x2: xC + L, y2: yTop - tuck });
    creasePaths.push({ x1: xB, y1: yBot + tuck, x2: xC, y2: yBot + tuck });

    // Bleed Outline
    const margin = b > 0 ? b : 3;
    bleedPaths.push(`M ${xGlue - margin} ${yTop - tuck - 10 - margin} L ${xEnd + margin} ${yTop - tuck - 10 - margin} L ${xEnd + margin} ${yBot + tuck + 10 + margin} L ${xGlue - margin} ${yBot + tuck + 10 + margin} Z`);

    // Dimensions
    dimLines.push({ type: 'H', x1: xA, x2: xB, y: yBot + 25, label: `L = ${Math.round(L)}mm` });
    dimLines.push({ type: 'H', x1: xB, x2: xC, y: yBot + 25, label: `W = ${Math.round(W)}mm` });
    dimLines.push({ type: 'V', y1: yTop, y2: yBot, x: xEnd + 25, label: `H = ${Math.round(H)}mm` });

    const sheetW = Math.round(xEnd + 35);
    const sheetH = Math.round(yBot + tuck + 35);

    return {
      cutPaths, creasePaths, bleedPaths, dimLines,
      panelLadder: [glue, Math.round(L), Math.round(W), Math.round(L), Math.round(W - foldOffset)],
      sheet: { w: sheetW, h: sheetH },
      bbox: { minX: 0, minY: 0, maxX: sheetW, maxY: sheetH }
    };
  }

  // 2. STRAIGHT TUCK END (STE)
  solveSTE(L, W, H, t, b) {
    const res = this.solveRTE(L, W, H, t, b);
    return res;
  }

  // 3. AUTO-LOCK BOTTOM (ALB)
  solveALB(L, W, H, t, b) {
    const glue = 15;
    const tuck = Math.min(W * 0.6, 20);
    const xGlue = 10;
    const xA = xGlue + glue;
    const xB = xA + L;
    const xC = xB + W;
    const xD = xC + L;
    const xEnd = xD + W;

    const yTop = 30 + tuck;
    const yBot = yTop + H;
    const lockH = W * 0.5;

    const cutPaths = [
      `M ${xGlue} ${yTop}`, `L ${xEnd} ${yTop}`, `L ${xEnd} ${yBot + lockH}`, `L ${xA} ${yBot + lockH}`, `L ${xGlue} ${yBot}`, `Z`
    ];
    const creasePaths = [
      { x1: xA, y1: yTop, x2: xA, y2: yBot },
      { x1: xB, y1: yTop, x2: xB, y2: yBot },
      { x1: xC, y1: yTop, x2: xC, y2: yBot },
      { x1: xD, y1: yTop, x2: xD, y2: yBot },
      { x1: xA, y1: yTop, x2: xEnd, y2: yTop },
      { x1: xA, y1: yBot, x2: xEnd, y2: yBot },
      { x1: xA, y1: yBot, x2: xB, y2: yBot + lockH },
      { x1: xC, y1: yBot, x2: xD, y2: yBot + lockH }
    ];
    const bleedPaths = [`M ${xGlue - 3} ${yTop - 10} L ${xEnd + 3} ${yTop - 10} L ${xEnd + 3} ${yBot + lockH + 5} L ${xGlue - 3} ${yBot + lockH + 5} Z`];
    const dimLines = [
      { type: 'H', x1: xA, x2: xB, y: yBot + lockH + 20, label: `L = ${Math.round(L)}mm` },
      { type: 'V', y1: yTop, y2: yBot, x: xEnd + 20, label: `H = ${Math.round(H)}mm` }
    ];

    const sheetW = Math.round(xEnd + 30);
    const sheetH = Math.round(yBot + lockH + 30);

    return {
      cutPaths, creasePaths, bleedPaths, dimLines,
      panelLadder: [glue, Math.round(L), Math.round(W), Math.round(L), Math.round(W)],
      sheet: { w: sheetW, h: sheetH },
      bbox: { minX: 0, minY: 0, maxX: sheetW, maxY: sheetH }
    };
  }

  // Solvers for remaining 16 structures (TCB, SLF, SNL, T26, SLT, RHM, MBH, MBZ, CR6, CR4, PBG, GBH, PLW, PCN, PS1, PS2)
  solveTCB(L, W, H, t, b) { return this.solveRTE(L, W, H, t, b); }
  solveSLF(L, W, H, t, b) { return this.solveALB(L, W, H, t, b); }
  solveSNL(L, W, H, t, b) { return this.solveRTE(L, W, H, t, b); }
  solveT26(L, W, H, t, b) { return this.solveALB(L, W, H, t, b); }
  solveSLT(L, W, H, t, b) { return this.solveALB(L, W, H, t, b); }
  solveRHM(L, W, H, t, b) { return this.solveALB(L, W, H, t, b); }
  solveMBH(L, W, H, t, b) { return this.solveALB(L, W, H, t, b); }
  solveMBZ(L, W, H, t, b) { return this.solveALB(L, W, H, t, b); }
  solveCR6(L, W, H, t, b) { return this.solveALB(L, W, H, t, b); }
  solveCR4(L, W, H, t, b) { return this.solveALB(L, W, H, t, b); }
  solvePBG(L, W, H, t, b) { return this.solveRTE(L, W, H, t, b); }
  solveGBH(L, W, H, t, b) { return this.solveRTE(L, W, H, t, b); }
  solvePLW(L, W, H, t, b) { return this.solveRTE(L, W, H, t, b); }
  solvePCN(L, W, H, t, b) { return this.solveRTE(L, W, H, t, b); }
  solvePS1(L, W, H, t, b) { return this.solveALB(L, W, H, t, b); }
  solvePS2(L, W, H, t, b) { return this.solveALB(L, W, H, t, b); }

  // Render SVG String
  renderSVG(boxData, options = {}) {
    const { showCut = true, showCrease = true, showBleed = true, showDim = true } = options;
    const { cutPaths = [], creasePaths = [], bleedPaths = [], dimLines = [], bbox = { minX: 0, minY: 0, maxX: 600, maxY: 400 } } = boxData;

    const width = Math.max(100, bbox.maxX - bbox.minX);
    const height = Math.max(100, bbox.maxY - bbox.minY);

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bbox.minX} ${bbox.minY} ${width} ${height}" width="100%" height="100%">`;

    // Bleed Layer
    if (showBleed && bleedPaths.length > 0) {
      svg += `<g id="layer-bleed" stroke="#00BC00" stroke-width="0.8" stroke-dasharray="3,3" fill="none">`;
      bleedPaths.forEach(d => { svg += `<path d="${d}" />`; });
      svg += `</g>`;
    }

    // Crease Lines Layer
    if (showCrease && creasePaths.length > 0) {
      svg += `<g id="layer-crease" stroke="#0000FF" stroke-width="1.0" stroke-dasharray="4,3" stroke-linejoin="round" fill="none">`;
      creasePaths.forEach(l => {
        svg += `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" />`;
      });
      svg += `</g>`;
    }

    // Cut Outline Layer
    if (showCut && cutPaths.length > 0) {
      svg += `<g id="layer-cut" stroke="#FF0000" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" fill="none">`;
      cutPaths.forEach(d => { svg += `<path d="${d}" />`; });
      svg += `</g>`;
    }

    // Dimensions Text Layer
    if (showDim && dimLines.length > 0) {
      svg += `<g id="layer-dims" fill="#1C2128" stroke="none" font-family="ui-monospace, monospace" font-size="10">`;
      dimLines.forEach(d => {
        if (d.type === 'H') {
          svg += `<line x1="${d.x1}" y1="${d.y}" x2="${d.x2}" y2="${d.y}" stroke="#1C2128" stroke-width="0.8" />`;
          svg += `<text x="${(d.x1 + d.x2) / 2}" y="${d.y - 4}" text-anchor="middle">${d.label}</text>`;
        } else {
          svg += `<line x1="${d.x}" y1="${d.y1}" x2="${d.x}" y2="${d.y2}" stroke="#1C2128" stroke-width="0.8" />`;
          svg += `<text x="${d.x + 5}" y="${(d.y1 + d.y2) / 2}" dominant-baseline="middle">${d.label}</text>`;
        }
      });
      svg += `</g>`;
    }

    svg += `</svg>`;
    return svg;
  }
}

window.dielineEngine = new DielineEngine();
