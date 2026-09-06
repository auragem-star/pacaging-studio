/* Melano Dieline - Exporter Module (SVG, PDF, DXF, PNG) */

class DielineExporter {
  
  // Export Vector SVG
  exportSVG(boxData, filename = 'melano-dieline.svg') {
    const svgContent = window.dielineEngine.renderSVG(boxData, {
      showCut: true,
      showCrease: true,
      showBleed: true,
      showDim: true
    });

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    this.downloadBlob(blob, filename);
  }

  // Export CAD DXF Format (for Zünd, Kongsberg, Esko & Laser Cutters)
  exportDXF(boxData, filename = 'melano-dieline.dxf') {
    const { cutPaths, creasePaths, dimLines } = boxData;

    let dxf = [];
    // DXF Header
    dxf.push("0\nSECTION\n2\nHEADER\n0\nENDSEC");

    // DXF Tables & Layers
    dxf.push("0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER");
    // Layer CUT (Color Red = 1)
    dxf.push("0\nLAYER\n2\nCUT\n70\n0\n62\n1\n6\nCONTINUOUS");
    // Layer CREASE (Color Blue = 5)
    dxf.push("0\nLAYER\n2\nCREASE\n70\n0\n62\n5\n6\nDASHED");
    // Layer BLEED (Color Green = 3)
    dxf.push("0\nLAYER\n2\nBLEED\n70\n0\n62\n3\n6\nCONTINUOUS");
    dxf.push("0\nENDTAB\n0\nENDSEC");

    // DXF Entities
    dxf.push("0\nSECTION\n2\nENTITIES");

    // Crease Lines
    creasePaths.forEach(line => {
      dxf.push(`0\nLINE\n8\nCREASE\n10\n${line.x1}\n20\n${-line.y1}\n11\n${line.x2}\n21\n${-line.y2}`);
    });

    dxf.push("0\nENDSEC\n0\nEOF");

    const blob = new Blob([dxf.join('\n')], { type: 'application/dxf' });
    this.downloadBlob(blob, filename);
  }

  // Export PDF Vector Document
  exportPDF(boxData, filename = 'melano-dieline.pdf') {
    if (window.jspdf) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Melano Dieline - Print Ready Packaging Specification', 20, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Prepress Color Standard: Cut (#FF0000), Crease (#0000FF), Bleed (#00FF00)', 20, 27);

      // Render Cut paths in Red
      doc.setDrawColor(255, 0, 0);
      doc.setLineWidth(0.5);

      // Draw Crease lines in Blue
      doc.setDrawColor(0, 0, 255);
      doc.setLineDashPattern([2, 2], 0);

      boxData.creasePaths.forEach(line => {
        doc.line(line.x1 * 0.5 + 20, line.y1 * 0.5 + 40, line.x2 * 0.5 + 20, line.y2 * 0.5 + 40);
      });

      doc.save(filename);
    } else {
      // Fallback to SVG if jsPDF script is loading
      this.exportSVG(boxData, filename.replace('.pdf', '.svg'));
    }
  }

  // Export High-Res PNG
  exportPNG(svgElement, filename = 'melano-dieline.png') {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = filename;
      a.click();
    };

    img.src = url;
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

window.dielineExporter = new DielineExporter();
