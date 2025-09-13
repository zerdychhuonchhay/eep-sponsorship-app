import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Student, StudentLookup } from '@/types.ts';
import Modal from '@/components/Modal.tsx';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { api } from '@/services/api.ts';
import { parseAndFormatDate } from '@/utils/dateUtils.ts';
import Button from '@/components/ui/Button.tsx';

interface StudentImportModalProps {
    existingStudents: StudentLookup[];
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

type ValidationError = {
    rowNumber: number;
    studentId: string;
    studentName: string;
    error: string;
}

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
    onSelectAllChange: (studentId: string, isSelected: boolean) => void;
}> = ({ diffs, selections, onSelectionChange, onSelectAllChange }) => {
    
    if (diffs.length === 0) return null;

    const isAllSelectedForStudent = (diff: StudentDiff) => {
        if (!selections[diff.studentId]) return false;
        return diff.changes.every(change => selections[diff.studentId][change.field as string]);
    };

    return (
        <div>
            <h4 className="font-semibold mb-2">Existing Students to be Updated ({diffs.length})</h4>
            <div className="max-h-60 overflow-y-auto border border-stroke dark:border-strokedark rounded-lg">
                {diffs.map(diff => (
                    <details key={diff.studentId} open={diffs.length <= 3} className="border-b border-stroke dark:border-strokedark last:border-b-0">
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
                                        <th className="p-2 text-center font-medium">
                                            <div className="flex flex-col items-center">
                                                <span>Update?</span>
                                                <input
                                                    type="checkbox"
                                                    title="Select/Deselect All"
                                                    className="form-checkbox h-3.5 w-3.5 rounded text-primary"
                                                    checked={isAllSelectedForStudent(diff)}
                                                    onChange={(e) => onSelectAllChange(diff.studentId, e.target.checked)}
                                                />
                                            </div>
                                        </th>
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
    const [rawData, setRawData] = useState<Record<string, any>[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [importResult, setImportResult] = useState<{ createdCount: number; updatedCount: number; skippedCount: number; errors: string[] } | null>(null);
    const [updateSelections, setUpdateSelections] = useState<Record<string, Record<string, boolean>>>({});
    const { showToast } = useNotification();
    const [validationIssues, setValidationIssues] = useState<ValidationError[]>([]);
    const [validatedData, setValidatedData] = useState<Partial<Student>[]>([]);


    const stepTitles: Record<number, string> = {
        1: "Step 1/5: Upload File",
        2: "Step 2/5: Map Columns",
        3: "Step 3/5: Validate Data",
        4: "Step 4/5: Review Changes",
        5: "Step 5/5: Import Complete",
    };
    
    const handleMappingChange = (header: string, field: string) => {
        setMapping(prev => ({ ...prev, [header]: field }));
    };

    const studentFields: (keyof Student)[] = [ 'studentId', 'firstName', 'lastName', 'gender', 'school', 'currentGrade', 'studentStatus', 'sponsorshipStatus', 'hasHousingSponsorship', 'sponsorName', 'hasBirthCertificate', 'siblingsCount', 'householdMembersCount', 'city', 'villageSlum', 'guardianName', 'guardianContactInfo', 'homeLocation', 'annualIncome', 'guardianIfNotParents', 'parentSupportLevel', 'closestPrivateSchool', 'currentlyInSchool', 'previousSchooling', 'gradeLevelBeforeEep', 'childResponsibilities', 'healthStatus', 'healthIssues', 'interactionWithOthers', 'interactionIssues', 'childStory', 'otherNotes', 'riskLevel', 'transportation', 'hasSponsorshipContract', 'dateOfBirth', 'eepEnrollDate', 'applicationDate', 'outOfProgramDate' ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const allowedExtensions = ['.xlsx', '.xls', '.csv'];
            const allowedMimeTypes = [ 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', ];
            const fileExtension = `.${selectedFile.name.split('.').pop()?.toLowerCase()}`;
            
            if (allowedExtensions.includes(fileExtension) || allowedMimeTypes.includes(selectedFile.type)) {
                setFile(selectedFile);
            } else {
                showToast(`Invalid file type. Please upload one of: ${allowedExtensions.join(', ')}`, 'error');
                setFile(null);
                e.target.value = '';
            }
        }
    };
    
    const parseFile = useCallback(() => {
        if (!file || !(window as any).XLSX) { showToast('File processing library not available.', 'error'); return; };
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const fileData = new Uint8Array(e.target!.result as ArrayBuffer);
                const workbook = (window as any).XLSX.read(fileData, { type: 'array' });
                if (!workbook.SheetNames?.length) { throw new Error("No sheets found in the workbook."); }
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                if (!worksheet) { throw new Error(`Could not read the first sheet ('${sheetName}').`); }
                const jsonData = (window as any).XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });
                if (!jsonData?.[0]?.length) { throw new Error("The first sheet is empty or has no header row."); }
                const fileHeaders = (jsonData[0] as any[]).map(String);
                const fileRows = jsonData.slice(1).map((row: any[]) => {
                    const rowData: Record<string, any> = {};
                    fileHeaders.forEach((header, index) => { rowData[header] = row[index]; });
                    return rowData;
                });
                setHeaders(fileHeaders);
                setRawData(fileRows);
                const newMapping: Record<string, string> = {};
                fileHeaders.forEach(header => {
                    const cleanHeader = header.toLowerCase().replace(/[\s_]/g, '');
                    const matchedField = studentFields.find(sf => cleanHeader.includes((sf as string).toLowerCase()));
                    if (matchedField) newMapping[header] = matchedField as string;
                });
                setMapping(newMapping);
                setStep(2);
            } catch(err: any) { showToast(err.message || 'An error occurred while parsing the file.', 'error');
            } finally { setIsProcessing(false); }
        };
        reader.onerror = () => { showToast('Could not read the selected file.', 'error'); setIsProcessing(false); };
        reader.readAsArrayBuffer(file);
    }, [file, showToast]);

    const mappedData = useMemo(() => {
        const dateFields: string[] = ['dateOfBirth', 'eepEnrollDate', 'applicationDate', 'outOfProgramDate'];
        const booleanFields: string[] = ['hasHousingSponsorship', 'hasBirthCertificate', 'hasSponsorshipContract'];
        
        return rawData.map(row => {
            const newRow: Partial<Student> = {};
            Object.keys(mapping).forEach(header => {
                const field = mapping[header] as keyof Student;
                if (field && row[header] !== undefined) { 
                    let value: any = row[header];
                     if (value === null || String(value).trim() === '') { (newRow as any)[field] = null; return; }
                    if (dateFields.includes(String(field))) { value = parseAndFormatDate(value); }
                    else if (booleanFields.includes(String(field))) {
                        const lowerVal = String(value).toLowerCase();
                        value = lowerVal === 'true' || lowerVal === 'yes' || lowerVal === '1';
                    }
                    if (typeof value === 'string') value = value.trim();
                    (newRow as any)[field] = value;
                }
            });
            return newRow;
        }).filter(row => row.studentId && String(row.studentId).trim() !== '');
    }, [rawData, mapping]);

    const handleValidation = useCallback((dataToValidate: Partial<Student>[]) => {
        const issues: ValidationError[] = [];
        const validRows: Partial<Student>[] = [];
        // Only require the absolute minimum for a record to be useful
        const requiredFields: (keyof Student)[] = ['studentId', 'firstName', 'lastName'];

        dataToValidate.forEach((student, index) => {
            let hasError = false;
            for (const field of requiredFields) {
                if (student[field] === null || student[field] === undefined || String(student[field]).trim() === '') {
                    issues.push({
                        rowNumber: index + 2, // +2 for 1-based index and header row
                        studentId: student.studentId || 'N/A',
                        studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'N/A',
                        error: `Missing required field: ${String(field).replace(/([A-Z])/g, ' $1')}`
                    });
                    hasError = true;
                }
            }
            // All rows are considered "valid" to proceed, errors are just informational
            validRows.push(student);
        });

        setValidationIssues(issues);
        setValidatedData(validRows);
        setStep(3);
    }, []);

    const { newStudents, updatedStudentsDiffs } = useMemo(() => {
        const existingStudentsMap = new Map(existingStudents.map(s => [s.studentId, s]));
        const newStudents: Partial<Student>[] = [];
        const diffs: StudentDiff[] = [];

        validatedData.forEach(fileStudent => {
            if (!fileStudent.studentId) return;
            const existingStudent = existingStudentsMap.get(fileStudent.studentId);
            if (existingStudent) {
                const changes: Change[] = [];
                (Object.keys(fileStudent) as (keyof Student)[]).forEach(field => {
                    if (field === 'studentId') return;
                    const newValue = fileStudent[field]; const oldValue = (existingStudent as any)[field];
                    const normNew = (newValue === null || newValue === undefined) ? '' : String(newValue);
                    const normOld = (oldValue === null || oldValue === undefined) ? '' : String(oldValue);
                    if (normNew !== normOld) changes.push({ field, oldValue, newValue });
                });
                if (changes.length > 0) {
                    diffs.push({ studentId: fileStudent.studentId, firstName: existingStudent.firstName, lastName: existingStudent.lastName, changes });
                }
            } else {
                newStudents.push(fileStudent);
            }
        });
        return { newStudents, updatedStudentsDiffs: diffs };
    }, [validatedData, existingStudents]);

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
        setUpdateSelections(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field as string]: isSelected }}));
    };

    const handleSelectAllChange = (studentId: string, isSelected: boolean) => {
        setUpdateSelections(prev => {
            const newSelectionsForStudent = { ...prev[studentId] };
            const diff = updatedStudentsDiffs.find(d => d.studentId === studentId);
            diff?.changes.forEach(change => { newSelectionsForStudent[change.field as string] = isSelected; });
            return { ...prev, [studentId]: newSelectionsForStudent };
        });
    };
    
    const handleFinalImport = async () => {
        const today = new Date().toISOString().split('T')[0];

        const processStudent = (student: Partial<Student>): Partial<Student> => {
            const processed = { ...student };
            if (!processed.dateOfBirth) {
                processed.dateOfBirth = '1900-01-01'; // Assign placeholder
            }
            if (!processed.eepEnrollDate) {
                processed.eepEnrollDate = today; // Assign today as placeholder
            }
            return processed;
        };

        const studentsToCreate = newStudents.map(processStudent);
        const studentsToUpdate: Partial<Student>[] = [];

        updatedStudentsDiffs.forEach(diff => {
            const studentUpdatePayload: Partial<Student> = { studentId: diff.studentId };
            let hasChanges = false;
            diff.changes.forEach(change => {
                if (updateSelections[diff.studentId]?.[change.field as string]) {
                    (studentUpdatePayload as any)[change.field as string] = change.newValue;
                    hasChanges = true;
                }
            });
            if (hasChanges) studentsToUpdate.push(studentUpdatePayload);
        });
        
        // Process updates to add placeholders if necessary
        const processedUpdates = studentsToUpdate.map(processStudent);

        const payload = [...studentsToCreate, ...processedUpdates];
        
        if (payload.length === 0) {
            showToast('No new students or approved changes to import.', 'info');
            return;
        }
        
        setIsProcessing(true);
        try {
            const result = await api.addBulkStudents(payload);
            setImportResult(result);
            setStep(5);
        } catch (error: any) {
            showToast(error.message || 'An unknown error occurred during import.', 'error');
            setImportResult({ createdCount: 0, updatedCount: 0, skippedCount: payload.length, errors: [error.message] });
            setStep(5);
        } finally {
            setIsProcessing(false);
        }
    };
    
    const parseBackendError = (error: string): string => {
        const match = error.match(/(\w+): null value in column "(\w+)"/);
        if (match) {
            const studentId = match[1];
            const field = match[2].replace(/_([a-z])/g, g => g[1].toUpperCase());
            return `Student ${studentId}: Failed - '${field}' is a required field.`;
        }
        return error;
    };


    return (
        <Modal isOpen={true} onClose={onFinished} title={`Import Students - ${stepTitles[step]}`}>
            {step === 1 && (
                <div>
                    <p className="text-body-color mb-4">Select an Excel (.xlsx, .xls) or CSV (.csv) file.</p>
                    <input type="file" onChange={handleFileChange} accept=".xlsx, .xls, .csv" className="w-full rounded border-[1.5px] border-stroke bg-gray-2 p-3 font-medium outline-none transition focus:border-primary text-black dark:border-strokedark dark:bg-form-input dark:text-white" />
                    <div className="flex justify-end mt-4">
                        <Button onClick={parseFile} disabled={!file || isProcessing} isLoading={isProcessing}>Next</Button>
                    </div>
                </div>
            )}
            {step === 2 && (
                <div>
                    <p className="text-body-color mb-4">Match file columns to system fields. The system will attempt to auto-map based on column headers.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto p-2 bg-gray-2 dark:bg-box-dark-2 rounded">
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
                        <Button onClick={() => setStep(1)} variant="ghost">Back</Button>
                        <Button onClick={() => handleValidation(mappedData)}>Next</Button>
                    </div>
                </div>
            )}
            {step === 3 && (
                 <div>
                    <p className="text-body-color mb-4">
                        Validation complete. {validatedData.length} rows are ready to be reviewed.
                        {validationIssues.length > 0 && ` ${validationIssues.length} rows have missing required fields (ID, First Name, Last Name) and will be skipped.`}
                    </p>
                    {validationIssues.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-danger mb-2">Rows with Issues (will be skipped)</h4>
                             <div className="max-h-60 overflow-y-auto border border-stroke dark:border-strokedark rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-2 dark:bg-box-dark-2 sticky top-0">
                                        <tr>
                                            <th className="p-2 text-left font-medium">Row</th>
                                            <th className="p-2 text-left font-medium">Student</th>
                                            <th className="p-2 text-left font-medium">Error</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {validationIssues.map((issue, index) => (
                                            <tr key={index} className="border-b border-stroke dark:border-strokedark last:border-b-0">
                                                <td className="p-2">{issue.rowNumber}</td>
                                                <td className="p-2">{issue.studentName} ({issue.studentId})</td>
                                                <td className="p-2">{issue.error}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-between mt-4">
                        <Button onClick={() => setStep(1)} variant="ghost">Back & Re-upload</Button>
                        <Button onClick={() => setStep(4)} disabled={validatedData.length === 0}>
                            {`Continue to Review ${validatedData.length} row(s)`}
                        </Button>
                    </div>
                </div>
            )}
            {step === 4 && (
                <div>
                    <p className="text-body-color mb-4">Review all changes before importing. Uncheck any updates you do not want to apply.</p>
                     <div className="text-sm text-body-color bg-gray-2 dark:bg-box-dark-2 p-3 rounded-md mb-4 border border-stroke dark:border-strokedark">
                        <strong>Note:</strong> Rows with missing 'Date of Birth' or 'EEP Enroll Date' will be imported with placeholder dates (e.g., 1900-01-01). You can update these records later from the student's profile.
                    </div>
                    <div className="space-y-4">
                        {newStudents.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2">New Students to be Added ({newStudents.length})</h4>
                                <ul className="list-disc list-inside p-2 text-sm max-h-40 overflow-y-auto border border-stroke dark:border-strokedark rounded-lg">
                                    {newStudents.map(s => <li key={s.studentId}>{s.firstName} {s.lastName} ({s.studentId})</li>)}
                                </ul>
                            </div>
                        )}
                        <ReviewUpdateSection diffs={updatedStudentsDiffs} selections={updateSelections} onSelectionChange={handleSelectionChange} onSelectAllChange={handleSelectAllChange} />
                    </div>
                    <div className="flex justify-between mt-4">
                        <Button onClick={() => setStep(3)} variant="ghost" disabled={isProcessing}>Back</Button>
                        <Button onClick={handleFinalImport} isLoading={isProcessing} variant="secondary">Confirm & Import</Button>
                    </div>
                </div>
            )}
            {step === 5 && importResult && (
                <div>
                    <div className="space-y-2 text-black dark:text-white">
                        <p><span className="font-medium text-success">{importResult.createdCount}</span> new students created.</p>
                        <p><span className="font-medium text-primary">{importResult.updatedCount}</span> students updated.</p>
                        <p><span className="font-medium text-warning">{importResult.skippedCount}</span> students skipped.</p>
                    </div>
                    {importResult.errors.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-semibold text-danger mb-2">Errors:</h4>
                            <ul className="list-disc list-inside bg-gray-2 dark:bg-box-dark-2 p-3 rounded-lg max-h-40 overflow-y-auto text-sm text-black dark:text-white">
                                {importResult.errors.map((err, i) => <li key={i}>{parseBackendError(err)}</li>)}
                            </ul>
                        </div>
                    )}
                    <div className="flex justify-end mt-4"><Button onClick={onFinished}>Close</Button></div>
                </div>
            )}
        </Modal>
    );
};

export default StudentImportModal;