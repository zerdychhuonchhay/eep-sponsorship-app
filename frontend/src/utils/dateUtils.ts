/**
 * Parses a value that might be a a date (from Excel, string, etc.) into a YYYY-MM-DD string.
 * Excel dates can be imported as numbers (days since 1900/1904).
 * @param dateValue The value to parse.
 * @returns A string in 'YYYY-MM-DD' format, or null if invalid.
 */
export const parseAndFormatDate = (dateValue: any): string | null => {
    if (!dateValue) return null;

    let date: Date;

    // Case 1: Value is already a Date object
    if (dateValue instanceof Date) {
        date = dateValue;
    } 
    // Case 2: Value is a number (likely from Excel)
    else if (typeof dateValue === 'number') {
        // Excel's epoch starts on 1899-12-30 for compatibility with Lotus 1-2-3's leap year bug.
        // We add the number of days to this epoch.
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
    } 
    // Case 3: Value is a string
    else if (typeof dateValue === 'string') {
        const parsed = new Date(dateValue);
        if (!isNaN(parsed.getTime())) {
            date = parsed;
        } else {
            return null; // Invalid string
        }
    } 
    // Unhandled type
    else {
        return null;
    }
    
    // Check if the resulting date is valid
    if (isNaN(date.getTime())) {
        return null;
    }

    // Adjust for timezone offset that might be introduced during parsing
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

    const year = adjustedDate.getUTCFullYear();
    const month = String(adjustedDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(adjustedDate.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

/**
 * Calculates the age from a date of birth string.
 * @param dob The date of birth string.
 * @returns The calculated age as a number, or 'N/A' if the date is invalid.
 */
export const calculateAge = (dob: string): number | string => {
    if (!dob || isNaN(new Date(dob).getTime())) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

/**
 * Formats a date string for display in a user-friendly format (e.g., "Jan 1, 2024").
 * @param dateStr The date string to format.
 * @returns A formatted date string, or 'N/A' if the date is invalid.
 */
export const formatDateForDisplay = (dateStr?: string) => {
    if (!dateStr || isNaN(new Date(dateStr).getTime())) return 'N/A';
    // Use toLocaleDateString for better internationalization support.
    return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};