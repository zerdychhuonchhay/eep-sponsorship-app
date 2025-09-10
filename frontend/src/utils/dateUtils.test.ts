import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { calculateAge, parseAndFormatDate, formatDateForDisplay } from './dateUtils';

describe('dateUtils', () => {
    
    // Mock the system date to ensure tests are deterministic
    beforeEach(() => {
        const mockDate = new Date('2024-06-15T12:00:00.000Z'); // Saturday, June 15, 2024
        vi.useFakeTimers();
        vi.setSystemTime(mockDate);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('calculateAge', () => {
        it('should return the correct age for a birthday that has passed this year', () => {
            expect(calculateAge('2000-01-01')).toBe(24);
        });

        it('should return the correct age for a birthday that is today', () => {
            expect(calculateAge('1990-06-15')).toBe(34);
        });
        
        it('should return the correct age for a birthday that is tomorrow', () => {
            expect(calculateAge('1990-06-16')).toBe(33);
        });
        
        it('should return 0 for a baby born this year', () => {
            expect(calculateAge('2024-01-01')).toBe(0);
        });

        it('should handle leap years correctly', () => {
            // Test on a non-leap year with a leap-day birthday
            vi.setSystemTime(new Date('2023-03-01T12:00:00.000Z'));
            expect(calculateAge('2000-02-29')).toBe(23);
        });
        
        it('should return "N/A" for an invalid date string', () => {
            expect(calculateAge('not a date')).toBe('N/A');
        });

        it('should return "N/A" for a null or undefined input', () => {
            expect(calculateAge(null as any)).toBe('N/A');
            expect(calculateAge(undefined as any)).toBe('N/A');
        });
    });

    describe('parseAndFormatDate', () => {
        it('should correctly parse an ISO date string', () => {
            expect(parseAndFormatDate('2023-10-26T10:00:00.000Z')).toBe('2023-10-26');
        });
        
        it('should correctly parse a YYYY-MM-DD string', () => {
            expect(parseAndFormatDate('2023-05-10')).toBe('2023-05-10');
        });

        it('should correctly parse an Excel date number', () => {
            // 45291 is the Excel number for 2024-01-01
            expect(parseAndFormatDate(45291)).toBe('2024-01-01');
        });
        
        it('should return null for invalid input', () => {
            expect(parseAndFormatDate('invalid-date')).toBe(null);
            expect(parseAndFormatDate(null)).toBe(null);
            expect(parseAndFormatDate({})).toBe(null);
        });
    });

    describe('formatDateForDisplay', () => {
        it('should format a valid date string into a readable format', () => {
            expect(formatDateForDisplay('2024-01-05')).toBe('Jan 5, 2024');
        });

        it('should return "N/A" for an invalid date string', () => {
            expect(formatDateForDisplay('not-a-real-date')).toBe('N/A');
        });

        it('should return "N/A" for null or undefined input', () => {
            expect(formatDateForDisplay(undefined)).toBe('N/A');
        });
    });
});
