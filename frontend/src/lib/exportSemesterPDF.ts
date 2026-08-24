import domtoimage from 'dom-to-image-more';
import jsPDF from 'jspdf';
import { type Semester } from '../data/sampleData';

export async function exportSemesterPDF(
    containerId: string,
    semester: Semester
): Promise<void> {
    const element = document.getElementById(containerId);
    if (!element) throw new Error('PDF container not found');

    // A4 at 96dpi = 794px wide; we render at 2× for sharpness
    const scale = 2;

    const blob = await domtoimage.toBlob(element, {
        width: element.offsetWidth * scale,
        height: element.offsetHeight * scale,
        style: {
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            backgroundColor: '#ffffff',
            color: '#111827',
        },
    });

    const imgData = await blobToDataURL(blob);
    const { width: blobW, height: blobH } = await getImageDimensions(imgData);

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();   // 210
    const pageH = pdf.internal.pageSize.getHeight();  // 297
    const margin = 10;
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;

    // Fit the whole capture into a single page, preserving aspect ratio.
    // Try fitting to width first; if that overflows the page height, fit to height instead.
    let printW = maxW;
    let printH = (blobH / blobW) * printW;

    if (printH > maxH) {
        printH = maxH;
        printW = (blobW / blobH) * printH;
    }

    const x = margin + (maxW - printW) / 2;
    const y = margin + (maxH - printH) / 2;

    pdf.addImage(imgData, 'PNG', x, y, printW, printH);

    pdf.save(`${semester.name.replace(/\s+/g, '_')}_Report.pdf`);
}

// ── helpers ────────────────────────────────────────────────────────────────

function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = reject;
        img.src = src;
    });
}