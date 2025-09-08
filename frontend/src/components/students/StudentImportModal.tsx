import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Student } from '@/types.ts';
import Modal from '@/components/Modal.tsx';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { useDebugNotification } from '@/contexts/DebugNotificationContext.tsx';
import { api } from '@/services/api.ts';
import { ArrowDownIcon } from '../Icons.tsx';
import { parseAndFormatDate } from '@/utils/dateUtils.ts';

interface StudentImportModalProps {
    existingStudents: Student[];
    onFinished: () => void;
}

type Change = {
    field: keyof Student;
    oldValue: any;
    newValue: any;
};

type StudentDiff = {
    studentId: string;
    firstName?: string;
    lastName?: string;
    changes: Change[];
};

const valueToString = (value: any, field: keyof Student): string => {
    if (value === null || value === undefined) return 'Empty';
    if (['dateOfBirth', 'eepEnrollDate', 'applicationDate', 'outOfProgramDate'].includes(field as string)) {
        const parsedDate = parseAndFormatDate(value);
        return parsedDate ? new Date(parsedDate).toLocaleDateString() : 'Invalid Date';
    }
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    return String(value);
};

const ReviewUpdateSection: React.FC<{
    diffs: StudentDiff[];
    selections: Record<string, Record<string, boolean>>;
    onSelectionChange: (studentId: string, field: keyof Student, isSelected: boolean) => void;
}> = ({ diffs, selections, onSelectionChange }) => {
    const [openStudentId, setOpenStudentId] = useState<string | null>(null);
    if (diffs.length === 0) return null;
    return (
        <div>
            <h4 className="font-semibold mb-2">Existing Students to be Updated ({diffs.length})</h4>
            <div className="max-h-60 overflow-y-auto border border-stroke dark:border-strokedark rounded-lg">
                {diffs.map(diff => (
                    <details key={diff.studentId} className="border-b border-stroke dark:border-strokedark last:border-b-0" onToggle={(e) => e.currentTarget.open ? setOpenStudentId(diff.studentId) : setOpenStudentId(null)}>
                        <summary className="p-2 cursor-pointer hover:bg-gray dark:hover:bg-box-dark-2 flex justify-between">
                            <span>{diff.firstName} {diff.lastName} ({diff.studentId})</span>
                            <span className="text-xs text-primary">{diff.changes.length} change{diff.changes.length === 1 ? '' : 's'} found</span>
                        </summary>
                        <div className="p-2 bg-white dark:bg-box-dark">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-2 dark:bg-box-dark-2">
                                        <th className="p-2 text-left font-medium">Field</th>
                                        <th className="p-2 text-left font-medium">Old Value</th>
                                        <th className="p-2 text-left font-medium">New Value</th>
                                        <th className="p-2 text-center font-medium">Update?</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {diff.changes.map(change => (
                                        <tr key={change.field as string} className="border-b border-stroke dark:border-strokedark last:border-b-0">
                                            <td className="p-2 capitalize">{String(change.field).replace(/([A-Z])/g, ' $1')}</td>
                                            <td className="p-2 text-body-color">{valueToString(change.oldValue, change.field)}</td>
                                            <td className="p-2 font-medium">{valueToString(change.newValue, change.field)}</td>
                                            <td className="p-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="form-checkbox h-4 w-4 rounded text-primary"
                                                    checked={selections[diff.studentId]?.[change.field as string] ?? false}
                                                    onChange={(e) => onSelectionChange(diff.studentId, change.field, e.target.checked)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );
};

const StudentImportModal: React.FC<StudentImportModalProps> = ({ existingStudents, onFinished }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [importResult, setImportResult] = useState<{ createdCount: number; updatedCount: number; skippedCount: number; errors: string[] } | null>(null);
    const [updateSelections, setUpdateSelections] = useState<Record<string, Record<string, boolean>>>({});
    const { showToast } = useNotification();
    const { logEvent } = useDebugNotification();
    
    const handleMappingChange = (header: string, field: string) => {
        setMapping(prev => ({
            ...prev,
            [header]: field
        }));
    };

    const studentFields: (keyof Student)[] = [
        'studentId', 'firstName', 'lastName', 'gender', 'school',
        'currentGrade', 'studentStatus', 'sponsorshipStatus',
        'hasHousingSponsorship', 'sponsorName', 'hasBirthCertificate',
        'siblingsCount', 'householdMembersCount', 'city', 'villageSlum', 'guardianName',
        'guardianContactInfo', 'homeLocation', 'annualIncome', 'guardianIfNotParents',
        'parentSupportLevel', 'closestPrivateSchool', 'currentlyInSchool', 'previousSchooling',
        'gradeLevelBeforeEep', 'childResponsibilities', 'healthStatus', 'healthIssues',
        'interactionWithOthers', 'interactionIssues', 'childStory', 'otherNotes',
        'riskLevel', 'transportation', 'hasSponsorshipContract',
        'dateOfBirth', 'eepEnrollDate', 'applicationDate', 'outOfProgramDate' // Add date fields for mapping
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type.includes('spreadsheet') || selectedFile.type.includes('csv') || selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.csv')) {
                setFile(selectedFile);
            } else {
                showToast('Please upload a valid Excel or CSV file.', 'error');
            }
        }
    };
    
    const parseFile = useCallback(() => {
        if (!file || !(window as any).XLSX) {
            showToast('File processing library not available.', 'error');
            return;
        };
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const fileData = new Uint8Array(e.target!.result as ArrayBuffer);
                const workbook = (window as any).XLSX.read(fileData, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = (window as any).XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });
                if (!jsonData || jsonData.length === 0 || !Array.isArray(jsonData[0])) {
                    showToast('The uploaded file is empty or invalid.', 'error'); return;
                }
                const fileHeaders = (jsonData[0] as any[]).map(String);
                const fileRows = jsonData.slice(1).map(row => {
                    const rowData: Record<string, any> = {};
                    fileHeaders.forEach((header, index) => { rowData[header] = (row as any[])[index]; });
                    return rowData;
                });
                setHeaders(fileHeaders);
                setData(fileRows);
                const newMapping: Record<string, string> = {};
                fileHeaders.forEach(header => {
                    const cleanHeader = header.toLowerCase().replace(/[\s_]/g, '');
                    // Fix: Explicitly convert `sf` to a string. `keyof Student` can be inferred as
                    // `string | number | symbol`, and `.toLowerCase()` is only available on strings.
                    const matchedField = studentFields.find(sf => cleanHeader.includes(String(sf).toLowerCase()));
                    if (matchedField) newMapping[header] = matchedField as string;
                });
                setMapping(newMapping);
                setStep(2);
            } catch(err) {
                console.error("File parsing error:", err);
                showToast('Error parsing the file. Please ensure it is a valid format.', 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    }, [file, showToast]);

    const mappedData = useMemo(() => {
        const dateFields = ['dateOfBirth', 'eepEnrollDate', 'applicationDate', 'outOfProgramDate'];
        return data.map(row => {
            const newRow: Partial<Student> = {};
            Object.keys(mapping).forEach(header => {
                const field = mapping[header] as keyof Student;
                if (field && row[header] !== undefined) { 
                    let value: any = row[header];
                     if (value === null || String(value).trim() === '') {
                        (newRow as any)[field] = null;
                        return;
                    }
                    if (dateFields.includes(field)) {
                        value = parseAndFormatDate(value);
                    } else if (['hasHousingSponsorship', 'hasBirthCertificate', 'hasSponsorshipContract'].includes(field as string)) {
                        const lowerVal = String(value).toLowerCase();
                        value = lowerVal === 'true' || lowerVal === 'yes' || lowerVal === '1';
                    }
                    if (typeof value === 'string') value = value.trim();
                    (newRow as any)[field] = value;
                }
            });
            return newRow;
        }).filter(row => row.studentId && String(row.studentId).trim() !== '');
    }, [data, mapping]);

    const { newStudents, updatedStudentsDiffs } = useMemo(() => {
        const existingStudentsMap = new Map(existingStudents.map(s => [s.studentId, s]));
        const newStudents: Partial<Student>[] = [];
        const diffs: StudentDiff[] = [];

        mappedData.forEach(fileStudent => {
            if (!fileStudent.studentId) return;
            const existingStudent = existingStudentsMap.get(fileStudent.studentId);
            if (existingStudent) {
                const changes: Change[] = [];
                (Object.keys(fileStudent) as (keyof Student)[]).forEach(field => {
                    if (field === 'studentId') return;
                    
                    const newValue = fileStudent[field];
                    const oldValue = existingStudent[field];
                    
                    const normNew = (newValue === null || newValue === undefined) ? '' : String(newValue);
                    const normOld = (oldValue === null || oldValue === undefined) ? '' : String(oldValue);

                    if (normNew !== normOld) {
                        changes.push({ field, oldValue, newValue });
                    }
                });
                if (changes.length > 0) {
                    diffs.push({ studentId: fileStudent.studentId, firstName: existingStudent.firstName, lastName: existingStudent.lastName, changes });
                }
            } else {
                newStudents.push(fileStudent);
            }
        });
        return { newStudents, updatedStudentsDiffs: diffs };
    }, [mappedData, existingStudents]);

    useEffect(() => {
        const initialSelections: Record<string, Record<string, boolean>> = {};
        updatedStudentsDiffs.forEach(diff => {
            initialSelections[diff.studentId] = {};
            diff.changes.forEach(change => {
                initialSelections[diff.studentId][change.field as string] = true; 
            });
        });
        setUpdateSelections(initialSelections);
    }, [updatedStudentsDiffs]);
    
    const handleSelectionChange = (studentId: string, field: keyof Student, isSelected: boolean) => {
        setUpdateSelections(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field as string]: isSelected,
            },
        }));
    };
    
    const handleFinalImport = async () => {
        const payload: Partial<Student>[] = [...newStudents];

        updatedStudentsDiffs.forEach(diff => {
            const studentUpdatePayload: Partial<Student> = { studentId: diff.studentId };
            let hasChanges = false;
            diff.changes.forEach(change => {
                if (updateSelections[diff.studentId]?.[change.field as string]) {
                    (studentUpdatePayload as any)[change.field as string] = change.newValue;
                    hasChanges = true;
                }
            });
            if (hasChanges) {
                payload.push(studentUpdatePayload);
            }
        });
        
        if (payload.length > 0) {
            setIsProcessing(true);
            logEvent(`Bulk import started for ${payload.length} students.`, 'info');
            try {
                const result = await api.addBulkStudents(payload);
                setImportResult(result);
                setStep(4);
            } catch (error: any) {
                showToast(error.message || 'An unknown error occurred during import.', 'error');
                setImportResult({ createdCount: 0, updatedCount: 0, skippedCount: payload.length, errors: [error.message] });
                setStep(4);
            } finally {
                setIsProcessing(false);
            }
        } else {
            showToast('No new students or approved changes to import.', 'info');
        }
    };
    
    return (
        <Modal isOpen={true} onClose={onFinished} title="Import Students">
            {step === 1 && (
                <div>
                    <h3 className="font-semibold text-lg mb-2">Step 1: Upload File</h3>
                    <p className="text-body-color mb-4">Select an Excel (.xlsx, .xls) or CSV (.csv) file.</p>
                    <input type="file" onChange={handleFileChange} accept=".xlsx, .xls, .csv" className="w-full rounded border-[1.5px] border-stroke bg-gray-2 p-3 font-medium outline-none transition focus:border-primary text-black dark:border-strokedark dark:bg-form-input dark:text-white" />
                    <div className="flex justify-end mt-4"><button onClick={parseFile} disabled={!file} className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50">Next</button></div>
                </div>
            )}
            {step === 2 && (
                <div>
                    <h3 className="font-semibold text-lg mb-2">Step 2: Map Columns</h3>
                    <p className="text-body-color mb-4">Match file columns to system fields.</p>
                    <div className="grid grid-cols-2 gap-4 max-h-80 overflow-y-auto p-2 bg-gray-2 dark:bg-box-dark-2 rounded">
                        {headers.map(header => (
                            <div key={header} className="flex items-center gap-2">
                                <span className="font-medium text-black dark:text-white flex-1 truncate" title={header}>{header}</span>
                                <select value={mapping[header] || ''} onChange={e => handleMappingChange(header, e.target.value)} className="rounded border border-stroke bg-white py-2 px-3 text-black dark:border-strokedark dark:bg-form-input dark:text-white">
                                    <option value="">-- Ignore --</option>
                                    {studentFields.map(field => <option key={String(field)} value={field as string}>{String(field).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4">
                        <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray dark:bg-box-dark-2 rounded-lg hover:opacity-90">Back</button>
                        <button onClick={() => setStep(3)} className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90">Next</button>
                    </div>
                </div>
            )}
            {step === 3 && (
                <div>
                    <h3 className="font-semibold text-lg mb-2">Step 3: Compare and Review</h3>
                    <p className="text-body-color mb-4">Review all changes before importing. Uncheck any updates you do not want to apply.</p>
                    
                    <div className="space-y-4">
                        {newStudents.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2">New Students to be Added ({newStudents.length})</h4>
                                <ul className="list-disc list-inside p-2 text-sm max-h-40 overflow-y-auto border border-stroke dark:border-strokedark rounded-lg">
                                    {newStudents.map(s => <li key={s.studentId}>{s.firstName} {s.lastName} ({s.studentId})</li>)}
                                </ul>
                            </div>
                        )}
                        <ReviewUpdateSection diffs={updatedStudentsDiffs} selections={updateSelections} onSelectionChange={handleSelectionChange} />
                    </div>

                    <div className="flex justify-between mt-4">
                        <button onClick={() => setStep(2)} className="px-4 py-2 bg-gray dark:bg-box-dark-2 rounded-lg hover:opacity-90">Back</button>
                        <button onClick={handleFinalImport} disabled={isProcessing} className="px-4 py-2 bg-success text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-wait">
                            {isProcessing ? 'Importing...' : 'Confirm & Import'}
                        </button>
                    </div>
                </div>
            )}
            {step === 4 && importResult && (
                <div>
                    <h3 className="font-semibold text-lg mb-2">Import Complete</h3>
                    <div className="space-y-2 text-black dark:text-white">
                        <p><span className="font-medium text-success">{importResult.createdCount}</span> new students created.</p>
                        <p><span className="font-medium text-primary">{importResult.updatedCount}</span> students updated.</p>
                        <p><span className="font-medium text-warning">{importResult.skippedCount}</span> students skipped.</p>
                    </div>
                    {importResult.errors.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-semibold text-danger mb-2">Errors:</h4>
                            <ul className="list-disc list-inside bg-gray-2 dark:bg-box-dark-2 p-3 rounded-lg max-h-40 overflow-y-auto text-sm text-black dark:text-white">
                                {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        </div>
                    )}
                    <div className="flex justify-end mt-4"><button onClick={onFinished} className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90">Close</button></div>
                </div>
            )}
        </Modal>
    );
};

export default StudentImportModal;