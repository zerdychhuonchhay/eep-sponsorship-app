import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api.ts';
import { AcademicReport, Student } from '../types.ts';
import Modal from '../components/Modal.tsx';
import { PlusIcon, EditIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '../components/Icons.tsx';
import { useNotification } from '../contexts/NotificationContext.tsx';
import { SkeletonTable } from '../components/SkeletonLoader.tsx';
import AcademicReportForm from '../components/AcademicReportForm.tsx';

type ReportFormData = Omit<AcademicReport, 'id' | 'student_id' | 'student_name'>;

const AcademicsPage: React.FC = () => {
    const [allReports, setAllReports] = useState<AcademicReport[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState<'add' | 'edit' | null>(null);
    const [selectedReport, setSelectedReport] = useState<AcademicReport | null>(null);
    
    const [yearFilter, setYearFilter] = useState('all');
    const [gradeFilter, setGradeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [sortConfig, setSortConfig] = useState<{ key: keyof AcademicReport; order: 'asc' | 'desc' }>({ key: 'report_period', order: 'desc' });
    
    const { showToast } = useNotification();

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [reportsData, studentsData] = await Promise.all([
                api.getAllAcademicReports(),
                api.getStudents()
            ]);
            setAllReports(reportsData);
            setStudents(studentsData);
        } catch (error) {
            showToast('Failed to load academic data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleSaveReport = async (formData: ReportFormData, studentId: string) => {
        try {
            if (modalState === 'edit' && selectedReport) {
                await api.updateAcademicReport(selectedReport.student_id, selectedReport.id, formData);
                showToast('Report updated successfully!', 'success');
            } else {
                await api.addAcademicReport(studentId, formData);
                showToast('Report added successfully!', 'success');
            }
            setModalState(null);
            setSelectedReport(null);
            fetchAllData();
        } catch (error: any) {
            showToast(error.message || 'Failed to save report.', 'error');
        }
    };

    const handleDeleteReport = async (report: AcademicReport) => {
        if (window.confirm(`Are you sure you want to delete the report for ${report.student_name} from ${report.report_period}?`)) {
            try {
                await api.deleteAcademicReport(report.student_id, report.id);
                showToast('Report deleted.', 'success');
                fetchAllData();
            } catch (error: any) {
                showToast(error.message || 'Failed to delete report.', 'error');
            }
        }
    };
    
    const { uniqueYears, uniqueGrades } = useMemo(() => {
        const yearSet = new Set<string>();
        const gradeSet = new Set<string>();
        allReports.forEach(report => {
            gradeSet.add(report.grade_level);
            const yearMatch = report.report_period.match(/\d{4}/);
            if (yearMatch) {
                yearSet.add(yearMatch[0]);
            }
        });
        return { 
            uniqueYears: Array.from(yearSet).sort((a,b) => b.localeCompare(a)),
            uniqueGrades: Array.from(gradeSet).sort()
        };
    }, [allReports]);

    const filteredAndSortedReports = useMemo(() => {
        let filtered = allReports.filter(report => {
            const yearMatch = report.report_period.match(/\d{4}/);
            const reportYear = yearMatch ? yearMatch[0] : null;
            
            const yearCondition = yearFilter === 'all' || reportYear === yearFilter;
            const gradeCondition = gradeFilter === 'all' || report.grade_level === gradeFilter;
            const statusCondition = statusFilter === 'all' || report.pass_fail_status === statusFilter;

            return yearCondition && gradeCondition && statusCondition;
        });

        filtered.sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            
            let comparison = 0;
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                comparison = aVal - bVal;
            } else {
                comparison = String(aVal).localeCompare(String(bVal));
            }
            return comparison * (sortConfig.order === 'asc' ? 1 : -1);
        });

        return filtered;
    }, [allReports, sortConfig, yearFilter, gradeFilter, statusFilter]);
    
    const handleSort = (key: keyof AcademicReport) => {
        setSortConfig(prev => ({
            key,
            order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
        }));
    };

    if (loading) return <SkeletonTable rows={10} cols={6} />;

    return (
        <div className="rounded-lg border border-stroke bg-white dark:bg-box-dark p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-xl font-semibold text-black dark:text-white">Academic Reports</h2>
                <button onClick={() => { setSelectedReport(null); setModalState('add'); }} className="flex w-full sm:w-auto justify-center items-center bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90">
                    <PlusIcon /> <span className="ml-2">Add Report</span>
                </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 bg-gray-2 dark:bg-box-dark-2 rounded-lg">
                <select onChange={e => setYearFilter(e.target.value)} value={yearFilter} className="w-full rounded border-stroke bg-white py-2 px-3 text-black dark:border-strokedark dark:bg-form-input dark:text-white">
                    <option value="all">All Years</option>
                    {uniqueYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
                <select onChange={e => setGradeFilter(e.target.value)} value={gradeFilter} className="w-full rounded border-stroke bg-white py-2 px-3 text-black dark:border-strokedark dark:bg-form-input dark:text-white">
                    <option value="all">All Grades</option>
                    {uniqueGrades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
                </select>
                <select onChange={e => setStatusFilter(e.target.value)} value={statusFilter} className="w-full rounded border-stroke bg-white py-2 px-3 text-black dark:border-strokedark dark:bg-form-input dark:text-white">
                    <option value="all">All Statuses</option>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-2 dark:bg-box-dark-2">
                         <tr>
                            {([
                                { key: 'student_name', label: 'Student' },
                                { key: 'report_period', label: 'Period' },
                                { key: 'grade_level', label: 'Grade' },
                                { key: 'overall_average', label: 'Average' },
                                { key: 'pass_fail_status', label: 'Status' },
                            ] as {key: keyof AcademicReport, label: string}[]).map(({key, label}) => (
                                <th key={key} className="p-4 font-medium text-black dark:text-white">
                                    <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort(key)}>
                                        {label}
                                        {sortConfig?.key === key && (sortConfig.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                                    </button>
                                </th>
                            ))}
                            <th className="p-4 font-medium text-black dark:text-white">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedReports.map(report => (
                             <tr key={report.id} className="border-b border-stroke dark:border-strokedark">
                                <td className="p-4 font-medium text-black dark:text-white">{report.student_name}</td>
                                <td className="p-4 text-body-color dark:text-gray-300">{report.report_period}</td>
                                <td className="p-4 text-body-color dark:text-gray-300">{report.grade_level}</td>
                                <td className="p-4 text-body-color dark:text-gray-300">{report.overall_average.toFixed(1)}%</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${report.pass_fail_status === 'Pass' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>{report.pass_fail_status}</span>
                                </td>
                                <td className="p-4">
                                     <div className="flex items-center space-x-3.5">
                                        <button onClick={() => { setSelectedReport(report); setModalState('edit'); }} className="hover:text-primary"><EditIcon /></button>
                                        <button onClick={() => handleDeleteReport(report)} className="hover:text-danger"><TrashIcon /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredAndSortedReports.length === 0 && (
                    <div className="text-center p-10 text-body-color dark:text-gray-400">
                        No academic reports match the current filters.
                    </div>
                )}
            </div>
            
            <Modal isOpen={!!modalState} onClose={() => setModalState(null)} title={modalState === 'edit' ? 'Edit Academic Report' : 'Add New Academic Report'}>
                <AcademicReportForm 
                    key={selectedReport ? selectedReport.id : 'new-report'}
                    onSave={handleSaveReport} 
                    onCancel={() => setModalState(null)}
                    students={students}
                    initialData={selectedReport}
                />
            </Modal>
        </div>
    );
};

export default AcademicsPage;