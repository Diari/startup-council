import { buildReportHtml, PDF_PROSE_CSS } from './pdfHtmlBuilder';
import type { PdfReportData } from './pdfHtmlBuilder';

export type { PdfReportData };

/**
 * Check if a pixel row in canvas image data is uniform (all same color).
 * Used to find safe cut points that won't slice through text.
 */
function isUniformRow(data: Uint8ClampedArray, width: number): boolean {
  const r0 = data[0], g0 = data[1], b0 = data[2];
  const tolerance = 5;
  // Sample every 4th pixel for speed — still reliable for text detection
  for (let i = 0; i < width * 4; i += 16) {
    if (
      Math.abs(data[i] - r0) > tolerance ||
      Math.abs(data[i + 1] - g0) > tolerance ||
      Math.abs(data[i + 2] - b0) > tolerance
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Split an oversized canvas (taller than one page) into page-fitting strips.
 * Scans near each cut point for a uniform-color row to avoid cutting text.
 */
function sliceCanvasIntoStrips(
  sourceCanvas: HTMLCanvasElement,
  pageHeightMm: number,
  scale: number,
  pxPerMm: number,
): Array<{ canvas: HTMLCanvasElement; heightMm: number }> {
  const strips: Array<{ canvas: HTMLCanvasElement; heightMm: number }> = [];
  const pageHeightScaledPx = Math.floor(pageHeightMm * pxPerMm * scale);
  const canvasHeight = sourceCanvas.height;
  const canvasWidth = sourceCanvas.width;
  const ctx = sourceCanvas.getContext('2d')!;

  let yStart = 0;

  while (yStart < canvasHeight) {
    let yEnd = Math.min(yStart + pageHeightScaledPx, canvasHeight);

    if (yEnd < canvasHeight) {
      // Search upward from the target cut line for a uniform row
      // Scan up to ~15mm worth of pixels to find a clean break
      const searchRange = Math.min(Math.floor(15 * pxPerMm * scale), yEnd - yStart);
      let bestCut = yEnd;

      for (let row = yEnd; row > yEnd - searchRange; row--) {
        const rowData = ctx.getImageData(0, row, canvasWidth, 1).data;
        if (isUniformRow(rowData, canvasWidth)) {
          bestCut = row;
          break;
        }
      }
      yEnd = bestCut;
    }

    const stripHeight = yEnd - yStart;
    if (stripHeight <= 0) break; // safety guard

    const stripCanvas = document.createElement('canvas');
    stripCanvas.width = canvasWidth;
    stripCanvas.height = stripHeight;
    const stripCtx = stripCanvas.getContext('2d')!;
    stripCtx.drawImage(
      sourceCanvas,
      0, yStart, canvasWidth, stripHeight,
      0, 0, canvasWidth, stripHeight,
    );

    const heightMm = stripHeight / (scale * pxPerMm);
    strips.push({ canvas: stripCanvas, heightMm });
    yStart = yEnd;
  }

  return strips;
}

export async function exportCouncilPdf(data: PdfReportData): Promise<void> {
  // Dynamic imports — Vite code-splits these into a separate chunk
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  // Build the report as a pure HTML string (no React rendering)
  const htmlString = buildReportHtml(data);

  // Inject scoped CSS into document head for prose styling
  const styleEl = document.createElement('style');
  styleEl.textContent = PDF_PROSE_CSS;
  document.head.appendChild(styleEl);

  // Create off-screen container
  const container = document.createElement('div');
  container.id = 'pdf-export-container';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.background = 'white';
  container.style.zIndex = '-1';

  // Inject the HTML
  container.innerHTML = htmlString;
  document.body.appendChild(container);

  // Give browser a moment to apply styles
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => setTimeout(resolve, 300)),
  );

  try {
    // A4 dimensions
    const PAGE_WIDTH_MM = 210;
    const PAGE_HEIGHT_MM = 297;
    const SCALE = 2;
    const CONTAINER_WIDTH_PX = 794;
    const PX_PER_MM = CONTAINER_WIDTH_PX / PAGE_WIDTH_MM;

    // Capture entire report as single canvas (preserves full layout context)
    const canvas = await html2canvas(container, {
      scale: SCALE,
      useCORS: true,
      logging: false,
      width: CONTAINER_WIDTH_PX,
      windowWidth: CONTAINER_WIDTH_PX,
      backgroundColor: '#ffffff',
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('html2canvas produced an empty canvas');
    }

    // Read section break points from the DOM using getBoundingClientRect
    // (works regardless of DOM nesting depth)
    const containerRect = container.getBoundingClientRect();
    const sectionEls = container.querySelectorAll<HTMLElement>('[data-pdf-section]');

    interface SectionInfo {
      yStartPx: number; // DOM px from top of container
      yEndPx: number;
      heightMm: number;
    }

    const sections: SectionInfo[] = [];

    for (const el of sectionEls) {
      const elRect = el.getBoundingClientRect();
      const yStart = elRect.top - containerRect.top;
      const yEnd = yStart + elRect.height;
      const heightMm = elRect.height / PX_PER_MM;
      sections.push({ yStartPx: yStart, yEndPx: yEnd, heightMm });
    }

    // Assemble the PDF page by page
    const pdf = new jsPDF('p', 'mm', 'a4');
    let cursorY = 0; // current Y position on the current page, in mm

    for (const section of sections) {
      const sectionHeightMm = section.heightMm;

      // Skip zero-height sections (e.g. empty rankings)
      if (sectionHeightMm < 0.5) continue;

      // Check if section fits on current page; if not, start a new page
      if (cursorY > 0 && cursorY + sectionHeightMm > PAGE_HEIGHT_MM) {
        pdf.addPage();
        cursorY = 0;
      }

      if (sectionHeightMm > PAGE_HEIGHT_MM) {
        // Oversized section: crop it from the big canvas and use smart slicing
        const srcY = Math.round(section.yStartPx * SCALE);
        const srcH = Math.round((section.yEndPx - section.yStartPx) * SCALE);

        const secCanvas = document.createElement('canvas');
        secCanvas.width = canvas.width;
        secCanvas.height = srcH;
        secCanvas.getContext('2d')!.drawImage(
          canvas,
          0, srcY, canvas.width, srcH,
          0, 0, canvas.width, srcH,
        );

        // Determine remaining space on current page
        const remainingMm = PAGE_HEIGHT_MM - cursorY;
        const strips = sliceCanvasIntoStrips(secCanvas, PAGE_HEIGHT_MM, SCALE, PX_PER_MM);

        for (let i = 0; i < strips.length; i++) {
          if (i > 0 || (cursorY > 0 && strips[i].heightMm > remainingMm)) {
            if (i > 0 || cursorY > 0) {
              pdf.addPage();
              cursorY = 0;
            }
          }

          const stripImg = strips[i].canvas.toDataURL('image/jpeg', 0.92);
          pdf.addImage(stripImg, 'JPEG', 0, cursorY, PAGE_WIDTH_MM, strips[i].heightMm);
          cursorY += strips[i].heightMm;
        }
      } else {
        // Normal section: crop from big canvas and place on page
        const srcY = Math.round(section.yStartPx * SCALE);
        const srcH = Math.round((section.yEndPx - section.yStartPx) * SCALE);

        const sectionCanvas = document.createElement('canvas');
        sectionCanvas.width = canvas.width;
        sectionCanvas.height = srcH;
        sectionCanvas.getContext('2d')!.drawImage(
          canvas,
          0, srcY, canvas.width, srcH,
          0, 0, canvas.width, srcH,
        );

        const sectionImg = sectionCanvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage(sectionImg, 'JPEG', 0, cursorY, PAGE_WIDTH_MM, sectionHeightMm);
        cursorY += sectionHeightMm;
      }
    }

    // Generate filename
    const ideaSlug = data.startupIdea
      .slice(0, 40)
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    const dateStr = new Date().toISOString().slice(0, 10);
    pdf.save(`startup-council-${ideaSlug}-${dateStr}.pdf`);
  } finally {
    // Clean up
    if (container.parentNode) {
      document.body.removeChild(container);
    }
    if (styleEl.parentNode) {
      document.head.removeChild(styleEl);
    }
  }
}
