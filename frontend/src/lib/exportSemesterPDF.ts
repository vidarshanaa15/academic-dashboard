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
            // Neutralise any oklch / modern color tokens on the root
            backgroundColor: '#ffffff',
            color: '#111827',
        },
    });

    const imgData = await blobToDataURL(blob);

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();   // 210
    const pageH = pdf.internal.pageSize.getHeight();  // 297
    const margin = 10;
    const printW = pageW - margin * 2;

    // Real pixel dims from the blob
    const { width: blobW, height: blobH } = await getImageDimensions(imgData);
    const printH = (blobH / blobW) * printW;

    // Paginate
    let srcY = 0;
    let first = true;

    while (srcY < blobH) {
        if (!first) pdf.addPage();
        first = false;

        // How many source-pixels fit on one page?
        const sliceH = (pageH - margin * 2) * (blobW / printW);

        pdf.addImage(
            imgData, 'PNG',
            margin,
            margin - (srcY / blobH) * printH,   // shift image up by what's already printed
            printW,
            printH,
        );

        srcY += sliceH;
    }

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