import React, { useState, ChangeEvent } from 'react';
import { api } from '@/services/api.ts';
import { StudentStatus, SponsorshipStatus, TransactionType } from '@/types.ts';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import PageHeader from '@/components/layout/PageHeader.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import Button from '@/components/ui/Button.tsx';
import { DownloadIcon } from '@/components/Icons.tsx';
import { exportToCsv, exportToPdf, exportFinancialCsvWithSummary } from '@/utils/exportUtils.ts';
import { useData } from '@/contexts/DataContext.tsx';
import { FormSelect, FormInput } from '@/components/forms/FormControls.tsx';

interface StudentReportFilters {
    student_status: string;
    sponsorship_status: string;
    sponsor: string;
}

interface FinancialReportFilters {
    start: string;
    end: string;
}

const ReportsPage: React.FC = () => {
    const [isStudentLoading, setIsStudentLoading] = useState(false);
    const [isFinancialLoading, setIsFinancialLoading] = useState(false);
    const { showToast } = useNotification();
    const { sponsorLookup } = useData();

    const [studentFilters, setStudentFilters] = useState<StudentReportFilters>({
        student_status: '',
        sponsorship_status: '',
        sponsor: '',
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [financialFilters, setFinancialFilters] = useState<FinancialReportFilters>({
        start: thirtyDaysAgo.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });

    const handleStudentFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setStudentFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleFinancialFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFinancialFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleStudentDownload = async (format: 'csv' | 'pdf') => {
        setIsStudentLoading(true);
        try {
            const activeFilters = Object.fromEntries(
                Object.entries(studentFilters).filter(([, value]) => value !== '')
            );

            const allStudents = await api.getAllStudentsForReport(activeFilters);

            if (allStudents.length === 0) {
                showToast('No students found matching the selected filters.', 'info');
                return;
            }
            
            const reportData = allStudents.map(s => ({
                studentId: s.studentId,
                firstName: s.firstName,
                lastName: s.lastName,
                dateOfBirth: s.dateOfBirth,
                gender: s.gender,
                studentStatus: s.studentStatus,
                sponsorshipStatus: s.sponsorshipStatus,
                sponsorName: s.sponsorName || 'N/A',
                school: s.school,
                currentGrade: s.currentGrade,
            }));

            const headers = {
                studentId: 'Student ID',
                firstName: 'First Name',
                lastName: 'Last Name',
                dateOfBirth: 'Date of Birth',
                gender: 'Gender',
                studentStatus: 'Status',
                sponsorshipStatus: 'Sponsorship',
                sponsorName: 'Sponsor',
                school: 'School',
                currentGrade: 'Grade',
            };
            
            const fileName = `Student_Roster_${new Date().toISOString().split('T')[0]}`;
            
            if (format === 'csv') {
                exportToCsv(reportData, headers, `${fileName}.csv`);
            } else {
                exportToPdf(reportData, headers, 'Student Roster', `${fileName}.pdf`);
            }
            
            showToast('Student Roster report generated successfully!', 'success');

        } catch (error: any) {
            showToast(error.message || 'Failed to generate student report.', 'error');
        } finally {
            setIsStudentLoading(false);
        }
    };

    const handleFinancialDownload = async (format: 'csv' | 'pdf') => {
        setIsFinancialLoading(true);
        try {
            if (!financialFilters.start || !financialFilters.end) {
                showToast('Please select a valid start and end date.', 'error');
                return;
            }

            const transactions = await api.getTransactionsForReport(financialFilters);

            if (transactions.length === 0) {
                showToast('No transactions found in the selected date range.', 'info');
                return;
            }

            const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + Number(t.amount), 0);
            const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + Number(t.amount), 0);
            const netBalance = totalIncome - totalExpense;

            const summary = `Financial Summary from ${financialFilters.start} to ${financialFilters.end}\nTotal Income: $${totalIncome.toFixed(2)}\nTotal Expenses: $${totalExpense.toFixed(2)}\nNet Balance: $${netBalance.toFixed(2)}`;
            
            const reportData = transactions.map(t => ({
                date: t.date,
                description: t.description,
                category: t.category,
                type: t.type,
                amount: `$${Number(t.amount).toFixed(2)}`,
            }));

            const headers = {
                date: 'Date',
                description: 'Description',
                category: 'Category',
                type: 'Type',
                amount: 'Amount',
            };

            const fileName = `Financial_Report_${financialFilters.start}_to_${financialFilters.end}`;

            if (format === 'csv') {
                 const summaryData = {
                    title: 'Financial Summary',
                    range: `Date Range: ${financialFilters.start} to ${financialFilters.end}`,
                    income: `Total Income: $${totalIncome.toFixed(2)}`,
                    expense: `Total Expenses: $${totalExpense.toFixed(2)}`,
                    net: `Net Balance: $${netBalance.toFixed(2)}`,
                };
                exportFinancialCsvWithSummary(reportData, headers, summaryData, `${fileName}.csv`);
            } else {
                exportToPdf(reportData, headers, 'Financial Report', `${fileName}.pdf`, summary);
            }

            showToast('Financial report generated successfully!', 'success');

        } catch (error: any) {
            showToast(error.message || 'Failed to generate financial report.', 'error');
        } finally {
            setIsFinancialLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Reports" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardContent>
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Student Roster</h3>
                        <p className="text-sm text-body-color dark:text-gray-300 mb-4">
                            Download a list of students. Use the filters to create a specific report.
                        </p>
                        <div className="space-y-4 mb-4">
                            <FormSelect id="student_status_filter" label="Status" name="student_status" value={studentFilters.student_status} onChange={handleStudentFilterChange}>
                                <option value="">All Statuses</option>
                                {Object.values(StudentStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                            </FormSelect>
                            <FormSelect id="sponsorship_status_filter" label="Sponsorship" name="sponsorship_status" value={studentFilters.sponsorship_status} onChange={handleStudentFilterChange}>
                                <option value="">All Sponsorships</option>
                                {Object.values(SponsorshipStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                            </FormSelect>
                            <FormSelect id="sponsor_filter" label="Sponsor" name="sponsor" value={studentFilters.sponsor} onChange={handleStudentFilterChange}>
                                <option value="">All Sponsors</option>
                                {sponsorLookup.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                            </FormSelect>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => handleStudentDownload('csv')}
                                isLoading={isStudentLoading}
                                icon={<DownloadIcon />}
                                size="sm"
                                variant="secondary"
                            >
                                CSV
                            </Button>
                             <Button
                                onClick={() => handleStudentDownload('pdf')}
                                isLoading={isStudentLoading}
                                icon={<DownloadIcon />}
                                size="sm"
                                variant="secondary"
                            >
                                PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardContent>
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Financial Report</h3>
                        <p className="text-sm text-body-color dark:text-gray-300 mb-4">
                            Download a list of all transactions within a specific date range.
                        </p>
                        <div className="space-y-4 mb-4">
                            <FormInput id="start_date_filter" label="Start Date" name="start" type="date" value={financialFilters.start} onChange={handleFinancialFilterChange} />
                            <FormInput id="end_date_filter" label="End Date" name="end" type="date" value={financialFilters.end} onChange={handleFinancialFilterChange} />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => handleFinancialDownload('csv')}
                                isLoading={isFinancialLoading}
                                icon={<DownloadIcon />}
                                size="sm"
                                variant="secondary"
                            >
                                CSV
                            </Button>
                             <Button
                                onClick={() => handleFinancialDownload('pdf')}
                                isLoading={isFinancialLoading}
                                icon={<DownloadIcon />}
                                size="sm"
                                variant="secondary"
                            >
                                PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};

export default ReportsPage;