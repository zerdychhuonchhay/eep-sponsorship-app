// Type definitions for global libraries loaded via script tags in index.html
declare global {
    interface Window {
        XLSX: any;
        jspdf: any;
    }
}

/**
 * Exports an array of objects to a CSV file.
 * @param data The array of data objects to export.
 * @param headers A mapping of object keys to display names for the CSV header.
 * @param fileName The name of the file to download.
 */
export const exportToCsv = <T extends Record<string, any>>(
    data: T[], 
    headers: Record<keyof T, string>, 
    fileName: string
): void => {
    if (typeof window.XLSX === 'undefined') {
        throw new Error('SheetJS library (XLSX) is not available.');
    }
    
    const dataWithHeaderNames = data.map(row => {
        const newRow: { [key: string]: any } = {};
        for (const key in headers) {
            if (Object.prototype.hasOwnProperty.call(row, key)) {
                newRow[headers[key]] = row[key];
            }
        }
        return newRow;
    });

    const worksheet = window.XLSX.utils.json_to_sheet(dataWithHeaderNames);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    
    window.XLSX.writeFile(workbook, fileName);
};

/**
 * Exports financial data to CSV with a prepended summary.
 * @param data The array of transaction data objects.
 * @param headers A mapping of object keys to display names for the CSV header.
 * @param summary An object containing summary information.
 * @param fileName The name of the file to download.
 */
export const exportFinancialCsvWithSummary = (
    data: any[],
    headers: Record<string, string>,
    summary: { title: string, range: string, income: string, expense: string, net: string },
    fileName: string
) => {
    if (typeof window.XLSX === 'undefined') {
        throw new Error('SheetJS library (XLSX) is not available.');
    }

    const summaryData = [
        { Column1: summary.title },
        { Column1: summary.range },
        { Column1: summary.income },
        { Column1: summary.expense },
        { Column1: summary.net },
        {}, // Spacer
    ];

    const worksheet = window.XLSX.utils.json_to_sheet(summaryData, { header: [" "], skipHeader: true });
    
    const dataWithHeaderNames = data.map(row => {
        const newRow: { [key: string]: any } = {};
        for (const key in headers) {
            if (Object.prototype.hasOwnProperty.call(row, key)) {
                newRow[headers[key]] = row[key];
            }
        }
        return newRow;
    });

    window.XLSX.utils.sheet_add_json(worksheet, dataWithHeaderNames, { origin: -1 }); // -1 appends to the end

    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Report');
    window.XLSX.writeFile(workbook, fileName);
};


/**
 * Exports an array of objects to a PDF file using a tabular format.
 * Requires `jspdf` and `jspdf-autotable` to be loaded globally.
 * @param data The array of data objects to export.
 * @param headers A mapping of object keys to display names for the PDF table header.
 * @param title The title of the report.
 * @param fileName The name of the file to download.
 * @param summary An optional string to display above the table.
 */
export const exportToPdf = <T extends Record<string, any>>(
    data: T[], 
    headers: Record<keyof T, string>, 
    title: string, 
    fileName: string,
    summary?: string
): void => {
    if (typeof window.jspdf === 'undefined' || typeof (window.jspdf as any).jsPDF.autoTable === 'undefined') {
        // Fallback for when jspdf-autotable is not loaded
        alert("PDF generation is temporarily unavailable. Please download as CSV.");
        console.error('jsPDF or jsPDF-AutoTable plugin is not available. Please ensure it is loaded.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const headerKeys = Object.keys(headers) as (keyof T)[];
    const head = [headerKeys.map(key => headers[key])];
    
    const body = data.map(row => 
        headerKeys.map(key => String(row[key] ?? ''))
    );
    
    let startY = 30;
    if (summary) {
        doc.setFontSize(10);
        doc.text(summary, 14, startY);
        startY += (summary.split('\n').length * 5) + 10;
    }

    doc.autoTable({
        head,
        body,
        startY,
        didDrawPage: (data: any) => {
            // Header
            doc.setFontSize(20);
            doc.setTextColor(40);
            doc.text(title, data.settings.margin.left, 22);
            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(10);
            doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        },
        margin: { top: 30 }
    });

    doc.save(fileName);
};