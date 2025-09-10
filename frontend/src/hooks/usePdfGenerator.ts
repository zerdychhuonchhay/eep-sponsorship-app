import { useState, useCallback } from 'react';
import { useNotification } from '@/contexts/NotificationContext.tsx';

// Type definitions for global libraries loaded via script tags
declare global {
    interface Window {
        jspdf: any;
        html2canvas: any;
    }
}

/**
 * A reusable hook to handle PDF generation from a React component.
 * @param printableRef A React ref attached to the DOM element that should be converted to PDF.
 */
export const usePdfGenerator = (printableRef: React.RefObject<HTMLDivElement>) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const { showToast } = useNotification();

    const generatePdf = useCallback(async (fileName: string) => {
        if (typeof window.jspdf === 'undefined' || typeof window.html2canvas === 'undefined') {
            showToast('PDF generation libraries are not available. Please try again in a moment.', 'error');
            return;
        }
        if (!printableRef.current) {
            showToast('Could not find the content to generate PDF.', 'error');
            return;
        }

        setIsGenerating(true);

        try {
            const { jsPDF } = window.jspdf;
            const elementToCapture = printableRef.current;
            
            const canvas = await window.html2canvas(elementToCapture, {
                scale: 2,
                useCORS: true,
                windowWidth: elementToCapture.scrollWidth,
                windowHeight: elementToCapture.scrollHeight,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const pdfHeight = pdfWidth / ratio;
            
            let position = 0;
            let heightLeft = canvasHeight;
            // Use canvas dimensions for page height calculation to ensure consistency
            const pageHeightInCanvasPixels = canvasWidth * (pdf.internal.pageSize.getHeight() / pdf.internal.pageSize.getWidth());

            pdf.addImage(imgData, 'PNG', 0, position, canvasWidth, canvasHeight, undefined, 'FAST');
            heightLeft -= pageHeightInCanvasPixels;

            while (heightLeft > 0) {
                position -= pageHeightInCanvasPixels;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, canvasWidth, canvasHeight, undefined, 'FAST');
                heightLeft -= pageHeightInCanvasPixels;
            }
            
            pdf.save(`${fileName}.pdf`);

        } catch (error) {
            console.error("Error generating PDF:", error);
            showToast('An error occurred while generating the PDF.', 'error');
        } finally {
            setIsGenerating(false);
        }
    }, [printableRef, showToast]);

    return { isGenerating, generatePdf };
};