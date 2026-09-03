import domtoimage from 'dom-to-image-more';
import jsPDF from 'jspdf';
import { type Semester } from '../data/sampleData';

export async function exportSemesterPDF(
    containerId: string,
    semester: Semester,
    isDarkMode: boolean = false
): Promise<void> {
    const element = document.getElementById(containerId);
    if (!element) throw new Error('PDF container not found');

    const scale = 2;
    const captureBg = isDarkMode ? '#0f172a' : '#ffffff';
    const captureText = isDarkMode ? '#f1f5f9' : '#111827';

    const blob = await domtoimage.toBlob(element, {
        width: element.offsetWidth * scale,
        height: element.offsetHeight * scale,
        style: {
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            backgroundColor: captureBg,
            color: captureText,
        },
    });

    const imgData = await blobToDataURL(blob);
    const { width: blobW, height: blobH } = await getImageDimensions(imgData);

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;

    let printW = maxW;
    let printH = (blobH / blobW) * printW;

    if (printH > maxH) {
        printH = maxH;
        printW = (blobW / blobH) * printH;
    }

    const x = margin + (maxW - printW) / 2;
    const y = margin + (maxH - printH) / 2;

    if (isDarkMode) {
        pdf.setFillColor(15, 23, 42);
        pdf.rect(0, 0, pageW, pageH, 'F');
    }

    pdf.addImage(imgData, 'PNG', x, y, printW, printH);

    pdf.save(`${semester.name.replace(/\s+/g, '_')}_Report.pdf`);
}

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