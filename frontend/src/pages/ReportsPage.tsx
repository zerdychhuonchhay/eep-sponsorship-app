import React, { useState } from 'react';
import { api } from '@/services/api.ts';
import { Student } from '@/types.ts';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import PageHeader from '@/components/layout/PageHeader.tsx';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import Button from '@/components/ui/Button.tsx';
import { DownloadIcon } from '@/components/Icons.tsx';
import { exportToCsv, exportToPdf } from '@/utils/exportUtils.ts';

const ReportsPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useNotification();

    const handleDownload = async (format: 'csv' | 'pdf') => {
        setIsLoading(true);
        try {
            const allStudents = await api.getAllStudentsForReport();
            
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
                exportToPdf(reportData, headers, 'Full Student Roster', `${fileName}.pdf`);
            }
            
            showToast('Report generated successfully!', 'success');

        } catch (error: any) {
            showToast(error.message || 'Failed to generate report.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Reports" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardContent>
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Full Student Roster</h3>
                        <p className="text-sm text-body-color dark:text-gray-300 mb-4">
                            Download a complete list of all students in the system, including their status, sponsorship details, and school information.
                        </p>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => handleDownload('csv')}
                                isLoading={isLoading}
                                icon={<DownloadIcon />}
                                size="sm"
                                variant="secondary"
                            >
                                CSV
                            </Button>
                             <Button
                                onClick={() => handleDownload('pdf')}
                                isLoading={isLoading}
                                icon={<DownloadIcon />}
                                size="sm"
                                variant="secondary"
                            >
                                PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                {/* Future report cards can be added here */}
            </div>
        </div>
    );
};

export default ReportsPage;
