import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '../services/api.ts';
import { Student, FollowUpRecord, Gender, StudentStatus, SponsorshipStatus, AcademicReport, WellbeingStatus, YesNo, RISK_FACTORS, HealthStatus, InteractionStatus, TransportationType } from '../types.ts';
import Modal from '../components/Modal.tsx';
import { PlusIcon, DocumentAddIcon, ArrowUpIcon, ArrowDownIcon, EditIcon, TrashIcon, UploadIcon, DownloadIcon } from '../components/Icons.tsx';
import { useNotification } from '../contexts/NotificationContext.tsx';
import { SkeletonTable } from '../components/SkeletonLoader.tsx';
import { FormInput, FormSelect, FormTextArea, FormCheckbox, FormSection, FormSubSection, YesNoNASelect, WellbeingSelect } from '../components/forms/FormControls.tsx';
import AcademicReportForm from '../components/AcademicReportForm.tsx';

// --- Helper Functions ---
const calculateAge = (dob: string): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const formatDateForInput = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
};

// --- Reusable Components ---
const DetailCard: React.FC<{ title: string; data: Record<string, any>; className?: string }> = ({ title, data, className }) => (
    <div className={`bg-white dark:bg-box-dark rounded-lg border border-stroke dark:border-strokedark shadow-sm p-6 ${className}`}>
        <h3 className="text-xl font-semibold text-black dark:text-white mb-4 border-b border-stroke dark:border-strokedark pb-2">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data).map(([key, value]) => (
                <div key={key}>
                    <p className="text-sm text-body-color dark:text-gray-300 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="font-medium text-black dark:text-white">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || 'N/A'}</p>
                </div>
            ))}
        </div>
    </div>
);

const NarrativeDetailCard: React.FC<{ title: string; data: Record<string, any> }> = ({ title, data }) => (
    <div className="bg-white dark:bg-box-dark rounded-lg border border-stroke dark:border-strokedark shadow-sm p-6">
        <h3 className="text-xl font-semibold text-black dark:text-white mb-4 border-b border-stroke dark:border-strokedark pb-2">{title}</h3>
        <div className="space-y-4">
            {Object.entries(data).map(([key, value]) => (
                <div key={key}>
                    <p className="text-sm text-body-color dark:text-gray-300 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="font-medium text-black dark:text-white whitespace-pre-wrap">{value || 'N/A'}</p>
                </div>
            ))}
        </div>
    </div>
);


// --- Modals and Forms ---

const StudentForm: React.FC<{ student?: Student | null; onSave: (data: any) => void; onCancel: () => void }> = ({ student, onSave, onCancel }) => {
    const isEdit = !!student;
    const [formData, setFormData] = useState(() => {
        const initialData = {
            student_id: '',
            first_name: '',
            last_name: '',
            date_of_birth: '',
            gender: Gender.OTHER,
            profile_photo: undefined,
            school: '',
            current_grade: '',
            eep_enroll_date: '',
            student_status: StudentStatus.PENDING_QUALIFICATION,
            sponsorship_status: SponsorshipStatus.UNSPONSORED,
            has_housing_sponsorship: false,
            sponsor_name: '',
            application_date: '',
            has_birth_certificate: false,
            siblings_count: 0,
            household_members_count: 0,
            city: '',
            village_slum: '',
            guardian_name: '',
            guardian_contact_info: '',
            home_location: '',
            father_details: { is_living: YesNo.NA, is_at_home: YesNo.NA, is_working: YesNo.NA, occupation: '', skills: '' },
            mother_details: { is_living: YesNo.NA, is_at_home: YesNo.NA, is_working: YesNo.NA, occupation: '', skills: '' },
            annual_income: 0,
            guardian_if_not_parents: '',
            parent_support_level: 3,
            closest_private_school: '',
            currently_in_school: YesNo.NA,
            previous_schooling: YesNo.NA,
            previous_schooling_details: { when: '', how_long: '', where: '' },
            grade_level_before_eep: '',
            child_responsibilities: '',
            health_status: HealthStatus.AVERAGE,
            health_issues: '',
            interaction_with_others: InteractionStatus.AVERAGE,
            interaction_issues: '',
            child_story: '',
            other_notes: '',
            risk_level: 3,
            transportation: TransportationType.WALKING,
            has_sponsorship_contract: false,
        };

        if (isEdit && student) {
            return {
                ...initialData,
                ...student,
                date_of_birth: formatDateForInput(student.date_of_birth),
                eep_enroll_date: formatDateForInput(student.eep_enroll_date),
                application_date: formatDateForInput(student.application_date),
                profile_photo: undefined, // Don't pre-fill file input
            };
        }
        return initialData;
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    // @ts-ignore
                    ...prev[parent],
                    [child]: value,
                }
            }));
            return;
        }

        // @ts-ignore
        const isCheckbox = type === 'checkbox' && e.target.checked !== undefined;
        // @ts-ignore
        const val = isCheckbox ? e.target.checked : value;
        
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, profile_photo: e.target.files![0] }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormSection title="Personal Information">
                <FormInput label="Student ID" name="student_id" value={formData.student_id} onChange={handleChange} required disabled={isEdit} />
                <FormInput label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} required />
                <FormInput label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} required />
                <FormInput label="Date of Birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} required />
                <FormSelect label="Gender" name="gender" value={formData.gender} onChange={handleChange}>
                    {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                </FormSelect>
                <FormInput label="Profile Photo" name="profile_photo" type="file" onChange={handleFileChange} accept="image/*" />
            </FormSection>

            <FormSection title="Program Details">
                 <FormInput label="School" name="school" value={formData.school} onChange={handleChange} />
                 <FormInput label="Current Grade" name="current_grade" value={formData.current_grade} onChange={handleChange} />
                 <FormInput label="EEP Enroll Date" name="eep_enroll_date" type="date" value={formData.eep_enroll_date} onChange={handleChange} />
                 <FormSelect label="Student Status" name="student_status" value={formData.student_status} onChange={handleChange}>
                    {Object.values(StudentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                 </FormSelect>
                 <FormSelect label="Sponsorship Status" name="sponsorship_status" value={formData.sponsorship_status} onChange={handleChange}>
                    {Object.values(SponsorshipStatus).map(s => <option key={s} value={s}>{s}</option>)}
                 </FormSelect>
                  <FormInput label="Sponsor Name" name="sponsor_name" value={formData.sponsor_name || ''} onChange={handleChange} />
            </FormSection>

            <FormSection title="Risk Assessment & Narrative" className="md:grid-cols-2">
                <FormInput label="Risk Level (1-5)" name="risk_level" type="number" min="1" max="5" value={formData.risk_level} onChange={handleChange} />
                <FormSelect label="Transportation" name="transportation" value={formData.transportation} onChange={handleChange}>
                    {Object.values(TransportationType).map(t => <option key={t} value={t}>{t}</option>)}
                </FormSelect>
                <FormSelect label="Health Status" name="health_status" value={formData.health_status} onChange={handleChange}>
                    {Object.values(HealthStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                <FormSelect label="Interaction with Others" name="interaction_with_others" value={formData.interaction_with_others} onChange={handleChange}>
                    {Object.values(InteractionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
                <div className="md:col-span-2">
                <FormTextArea label="Health Issues" name="health_issues" value={formData.health_issues || ''} onChange={handleChange} />
                </div>
                <div className="md:col-span-2">
                <FormTextArea label="Interaction Issues" name="interaction_issues" value={formData.interaction_issues || ''} onChange={handleChange} />
                </div>
                <div className="md:col-span-2">
                    <FormTextArea label="Child Story" name="child_story" value={formData.child_story} onChange={handleChange} />
                </div>
                <div className="md:col-span-2">
                    <FormTextArea label="Other Notes" name="other_notes" value={formData.other_notes} onChange={handleChange} />
                </div>
                <div className="md:col-span-2 flex items-center pt-2">
                    <FormCheckbox label="Sponsorship Contract on File" name="has_sponsorship_contract" checked={!!formData.has_sponsorship_contract} onChange={handleChange} />
                </div>
            </FormSection>

            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray dark:bg-box-dark-2 hover:opacity-90">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-primary text-white hover:opacity-90">{isEdit ? 'Update Student' : 'Save Student'}</button>
            </div>
        </form>
    );
};

const FollowUpForm: React.FC<{ student: Student; onSave: (record: any) => void; onCancel: () => void, initialData?: FollowUpRecord | null }> = ({ student, onSave, onCancel, initialData }) => {
    const isEdit = !!initialData;
    const [formData, setFormData] = useState<Omit<FollowUpRecord, 'id' | 'student_id'>>(() => {
        const defaults = {
            child_name: `${student.first_name} ${student.last_name}`,
            child_current_age: calculateAge(student.date_of_birth),
            date_of_follow_up: formatDateForInput(new Date().toISOString()),
            location: '',
            parent_guardian: student.guardian_name,
            physical_health: WellbeingStatus.NA,
            physical_health_notes: '',
            social_interaction: WellbeingStatus.NA,
            social_interaction_notes: '',
            home_life: WellbeingStatus.NA,
            home_life_notes: '',
            drugs_alcohol_violence: YesNo.NA,
            drugs_alcohol_violence_notes: '',
            risk_factors_list: [],
            risk_factors_details: '',
            condition_of_home: WellbeingStatus.NA,
            condition_of_home_notes: '',
            mother_working: YesNo.NA,
            father_working: YesNo.NA,
            other_family_member_working: YesNo.NA,
            current_work_details: '',
            attending_church: YesNo.NA,
            staff_notes: '',
            changes_recommendations: '',
            child_protection_concerns: YesNo.NA,
            human_trafficking_risk: YesNo.NA,
            completed_by: '',
            date_completed: formatDateForInput(new Date().toISOString()),
            reviewed_by: '',
            date_reviewed: '',
        };
        if (isEdit && initialData) {
            return {
                ...defaults,
                ...initialData,
                date_of_follow_up: formatDateForInput(initialData.date_of_follow_up),
                date_completed: formatDateForInput(initialData.date_completed),
                date_reviewed: formatDateForInput(initialData.date_reviewed),
            }
        }
        return defaults;
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRiskToggle = (risk: string) => {
        setFormData(prev => {
            const currentRisks = prev.risk_factors_list;
            if (currentRisks.includes(risk)) {
                return { ...prev, risk_factors_list: currentRisks.filter(r => r !== risk) };
            } else {
                return { ...prev, risk_factors_list: [...currentRisks, risk] };
            }
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormSection title="Section 1: Client Information">
                <FormInput label="Child's Name" name="child_name" value={formData.child_name} onChange={handleChange} disabled />
                <FormInput label="Child's Current Age" name="child_current_age" type="number" value={formData.child_current_age} onChange={handleChange} disabled />
                <FormInput label="Date of Follow Up" name="date_of_follow_up" type="date" value={formData.date_of_follow_up} onChange={handleChange} required />
                <FormInput label="Location" name="location" value={formData.location} onChange={handleChange} required />
                <FormInput label="Parent/Guardian" name="parent_guardian" value={formData.parent_guardian} onChange={handleChange} />
            </FormSection>

            <FormSection title="Section 2: Well-being Progress">
                <FormSubSection title="Well-being">
                    <WellbeingSelect label="Physical Health" name="physical_health" value={formData.physical_health} onChange={handleChange} />
                    {(formData.physical_health === WellbeingStatus.AVERAGE || formData.physical_health === WellbeingStatus.POOR) && <FormTextArea label="Notes" name="physical_health_notes" value={formData.physical_health_notes} onChange={handleChange} />}
                    <WellbeingSelect label="Social Interaction" name="social_interaction" value={formData.social_interaction} onChange={handleChange} />
                    {(formData.social_interaction === WellbeingStatus.AVERAGE || formData.social_interaction === WellbeingStatus.POOR) && <FormTextArea label="Notes" name="social_interaction_notes" value={formData.social_interaction_notes} onChange={handleChange} />}
                    <WellbeingSelect label="Home Life" name="home_life" value={formData.home_life} onChange={handleChange} />
                    {(formData.home_life === WellbeingStatus.AVERAGE || formData.home_life === WellbeingStatus.POOR) && <FormTextArea label="Notes" name="home_life_notes" value={formData.home_life_notes} onChange={handleChange} />}
                    <YesNoNASelect label="Drugs/Alcohol/Violence" name="drugs_alcohol_violence" value={formData.drugs_alcohol_violence} onChange={handleChange} />
                    {formData.drugs_alcohol_violence === YesNo.YES && <FormTextArea label="Notes" name="drugs_alcohol_violence_notes" value={formData.drugs_alcohol_violence_notes} onChange={handleChange} />}
                </FormSubSection>
            </FormSection>
            
            <FormSection title="Section 2a: Risk Factors">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">Current Risk Factors (Select all that apply)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-gray-2 dark:bg-box-dark-2 rounded-lg">
                        {RISK_FACTORS.map(risk => (
                            <label key={risk} className="flex items-center space-x-2 text-sm text-black dark:text-white">
                                <input type="checkbox" checked={formData.risk_factors_list.includes(risk)} onChange={() => handleRiskToggle(risk)} className="form-checkbox h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                                <span>{risk}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <FormTextArea label="Details for selections above" name="risk_factors_details" value={formData.risk_factors_details} onChange={handleChange} className="md:col-span-2" />
                 <WellbeingSelect label="Condition of Home" name="condition_of_home" value={formData.condition_of_home} onChange={handleChange} />
                 {(formData.condition_of_home === WellbeingStatus.AVERAGE || formData.condition_of_home === WellbeingStatus.POOR) && <FormTextArea label="Notes" name="condition_of_home_notes" value={formData.condition_of_home_notes} onChange={handleChange} />}
                 <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <YesNoNASelect label="Mother Working?" name="mother_working" value={formData.mother_working} onChange={handleChange} />
                    <YesNoNASelect label="Father Working?" name="father_working" value={formData.father_working} onChange={handleChange} />
                    <YesNoNASelect label="Other Family Member Working?" name="other_family_member_working" value={formData.other_family_member_working} onChange={handleChange} />
                 </div>
                 <FormTextArea label="Current Work Details" name="current_work_details" value={formData.current_work_details} onChange={handleChange} className="md:col-span-2" />
                 <YesNoNASelect label="Attending Church/House of Prayer?" name="attending_church" value={formData.attending_church} onChange={handleChange} />
            </FormSection>

            <FormSection title="Section 4: EEP Staff Notes">
                <FormTextArea label="Notes" name="staff_notes" value={formData.staff_notes} onChange={handleChange} className="md:col-span-2" />
                <FormTextArea label="Changes/Recommendations" name="changes_recommendations" value={formData.changes_recommendations} onChange={handleChange} className="md:col-span-2" />
            </FormSection>

            <FormSection title="Section 5: Conclusion">
                <YesNoNASelect label="Child Protection Concerns?" name="child_protection_concerns" value={formData.child_protection_concerns} onChange={handleChange} />
                <YesNoNASelect label="Increased Human Trafficking Risk?" name="human_trafficking_risk" value={formData.human_trafficking_risk} onChange={handleChange} />
            </FormSection>

            <FormSection title="Completion Details">
                <FormInput label="Completed By" name="completed_by" value={formData.completed_by} onChange={handleChange} required />
                <FormInput label="Date Completed" name="date_completed" type="date" value={formData.date_completed} onChange={handleChange} required />
            </FormSection>

            <FormSection title="Administrator Review">
                <p className="md:col-span-2 text-sm text-body-color dark:text-gray-400">This section is to be completed by an administrator upon review.</p>
                <FormInput label="Reviewed By" name="reviewed_by" value={formData.reviewed_by} onChange={handleChange} />
                <FormInput label="Date Reviewed" name="date_reviewed" type="date" value={formData.date_reviewed} onChange={handleChange} />
            </FormSection>

            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray dark:bg-box-dark-2 hover:opacity-90">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-primary text-white hover:opacity-90">{isEdit ? 'Update Record' : 'Save Record'}</button>
            </div>
        </form>
    );
};

const StudentImportModal: React.FC<{ onImport: (students: Partial<Student>[]) => void; onClose: () => void; }> = ({ onImport, onClose }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const { showToast } = useNotification();
    
     const studentFields: (keyof Student)[] = [
        'student_id', 'first_name', 'last_name', 'date_of_birth', 'gender', 'school',
        'current_grade', 'eep_enroll_date', 'student_status', 'sponsorship_status',
        'city', 'village_slum', 'guardian_name'
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
        if (!file) return;

        const loadXLSX = () => {
             if ((window as any).XLSX) {
                readFile();
            } else {
                const script = document.createElement('script');
                script.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
                script.onload = readFile;
                document.head.appendChild(script);
            }
        }

        const readFile = () => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const fileData = new Uint8Array(e.target!.result as ArrayBuffer);
                    const workbook = (window as any).XLSX.read(fileData, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = (window as any).XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    if (!jsonData || jsonData.length === 0 || !Array.isArray(jsonData[0])) {
                        showToast('The uploaded file is empty or invalid.', 'error');
                        return;
                    }

                    const fileHeaders = (jsonData[0] as any[]).map(String);
                    const fileRows = jsonData.slice(1).map(row => {
                        const rowData: Record<string, any> = {};
                        fileHeaders.forEach((header, index) => {
                            rowData[header] = (row as any[])[index];
                        });
                        return rowData;
                    });

                    setHeaders(fileHeaders);
                    setData(fileRows);

                    const newMapping: Record<string, string> = {};
                    fileHeaders.forEach(header => {
                        const cleanHeader = header.toLowerCase().replace(/[\s_]/g, '');
                        const matchedField = studentFields.find(sf => cleanHeader.includes(sf.replace(/_/g, '')));
                        if (matchedField) {
                            newMapping[header] = matchedField;
                        }
                    });
                    setMapping(newMapping);

                    setStep(2);
                } catch(err) {
                    showToast('Error parsing the file. Please ensure it is a valid format.', 'error');
                }
            };
            reader.readAsArrayBuffer(file);
        };
        
        loadXLSX();
    }, [file, showToast]);
    
    const handleMappingChange = (header: string, field: string) => {
        setMapping(prev => ({ ...prev, [header]: field }));
    };

    const mappedData = useMemo(() => {
        return data.map(row => {
            const newRow: Partial<Student> = {};
            Object.keys(mapping).forEach(header => {
                if (mapping[header] && row[header] !== undefined) {
                    // @ts-ignore
                    newRow[mapping[header]] = row[header];
                }
            });
            return newRow;
        }).filter(row => row.student_id);
    }, [data, mapping]);
    
    const handleFinalImport = () => {
        if(mappedData.length > 0) {
            onImport(mappedData);
        } else {
            showToast('No valid student data to import after mapping.', 'error');
        }
    };
    
    return (
        <Modal isOpen={true} onClose={onClose} title="Import Students">
            {step === 1 && (
                <div>
                    <h3 className="font-semibold text-lg mb-2">Step 1: Upload File</h3>
                    <p className="text-body-color mb-4">Select an Excel (.xlsx, .xls) or CSV (.csv) file to import.</p>
                    <input type="file" onChange={handleFileChange} accept=".xlsx, .xls, .csv" className="w-full rounded border-[1.5px] border-stroke bg-gray-2 p-3 font-medium outline-none transition focus:border-primary text-black dark:border-strokedark dark:bg-form-input dark:text-white" />
                    <div className="flex justify-end mt-4">
                        <button onClick={parseFile} disabled={!file} className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50">Next</button>
                    </div>
                </div>
            )}
            {step === 2 && (
                <div>
                    <h3 className="font-semibold text-lg mb-2">Step 2: Map Columns</h3>
                    <p className="text-body-color mb-4">Match the columns from your file to the student fields in the system.</p>
                    <div className="grid grid-cols-2 gap-4 max-h-80 overflow-y-auto p-2 bg-gray-2 dark:bg-box-dark-2 rounded">
                        {headers.map(header => (
                            <div key={header} className="flex items-center gap-2">
                                <span className="font-medium text-black dark:text-white flex-1 truncate" title={header}>{header}</span>
                                <select value={mapping[header] || ''} onChange={e => handleMappingChange(header, e.target.value)} className="rounded border border-stroke bg-white py-2 px-3 text-black dark:border-strokedark dark:bg-form-input dark:text-white">
                                    <option value="">-- Ignore --</option>
                                    {studentFields.map(field => <option key={field} value={field}>{field.replace(/_/g, ' ')}</option>)}
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
                    <h3 className="font-semibold text-lg mb-2">Step 3: Review and Import</h3>
                    <p className="text-body-color mb-4">Review the data to be imported. Existing student IDs will be skipped.</p>
                    <p className="font-semibold mb-2">{mappedData.length} students will be imported.</p>
                    <div className="flex justify-between mt-4">
                        <button onClick={() => setStep(2)} className="px-4 py-2 bg-gray dark:bg-box-dark-2 rounded-lg hover:opacity-90">Back</button>
                        <button onClick={handleFinalImport} className="px-4 py-2 bg-success text-white rounded-lg hover:opacity-90">Confirm & Import</button>
                    </div>
                </div>
            )}
        </Modal>
    );
};


// --- Main Page Component ---
const StudentsPage: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [modal, setModal] = useState<'add_report' | 'add_follow_up' | 'edit_follow_up' | null>(null);
    const [editingFollowUp, setEditingFollowUp] = useState<FollowUpRecord | null>(null);
    const [recordForPdf, setRecordForPdf] = useState<FollowUpRecord | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const printableRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Student | 'age'; order: 'asc' | 'desc' } | null>({ key: 'first_name', order: 'asc' });
    const { showToast } = useNotification();
    const [openFollowUpId, setOpenFollowUpId] = useState<string | null>(null);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getStudents();
            setStudents(data);
        } catch (error) {
            console.error("Failed to fetch students", error);
            showToast('Failed to load student data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);
    
    useEffect(() => {
        if (!recordForPdf || !printableRef.current) return;
    
        const generatePdf = async () => {
            const { jsPDF } = (window as any).jspdf;
            const html2canvas = (window as any).html2canvas;
            const elementToCapture = printableRef.current!;
    
            try {
                const canvas = await html2canvas(elementToCapture, { scale: 2, useCORS: true, windowWidth: elementToCapture.scrollWidth, windowHeight: elementToCapture.scrollHeight });
                const imgData = canvas.toDataURL('image/png');
                
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = imgWidth / imgHeight;
                
                const finalImgWidth = pdfWidth - 40; // with margin
                const finalImgHeight = finalImgWidth / ratio;
                
                let heightLeft = finalImgHeight;
                let position = 20;
    
                pdf.addImage(imgData, 'PNG', 20, position, finalImgWidth, finalImgHeight);
                heightLeft -= (pdfHeight - 40);
    
                while (heightLeft > 0) {
                    position = -heightLeft + 20;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 20, position, finalImgWidth, finalImgHeight);
                    heightLeft -= (pdfHeight - 40);
                }
                
                const studentName = recordForPdf.child_name.replace(/\s+/g, '-');
                const date = new Date(recordForPdf.date_of_follow_up).toISOString().split('T')[0];
                pdf.save(`Follow-Up-Report-${studentName}-${date}.pdf`);
    
            } catch (error) {
                console.error("Error generating PDF:", error);
                showToast('An error occurred while generating the PDF.', 'error');
            } finally {
                setRecordForPdf(null);
                setIsGeneratingPdf(false);
            }
        };
        const timer = setTimeout(generatePdf, 100);
        return () => clearTimeout(timer);
    }, [recordForPdf, showToast]);

    const handleSaveStudent = async (studentData: any) => {
        try {
            if (selectedStudent && isAdding) {
                await api.updateStudent({ ...studentData, student_id: selectedStudent.student_id });
                showToast('Student updated successfully!', 'success');
            } else {
                await api.addStudent(studentData);
                showToast('Student added successfully!', 'success');
            }
            setIsAdding(false);
            setSelectedStudent(null);
            fetchStudents();
        } catch (error: any) {
            showToast(error.message || 'Failed to save student.', 'error');
        }
    };
    
    const handleDeleteStudent = async (studentId: string) => {
        if(window.confirm('Are you sure you want to delete this student? This will also remove all associated records.')) {
            try {
                await api.deleteStudent(studentId);
                showToast('Student deleted.', 'success');
                setSelectedStudent(null);
                fetchStudents();
            } catch (error: any) {
                showToast(error.message || 'Failed to delete student.', 'error');
            }
        }
    };
    
    const handleSaveAcademicReport = async (reportData: Omit<AcademicReport, 'id' | 'student_id' | 'student_name'>) => {
        if (!selectedStudent) return;
        try {
            await api.addAcademicReport(selectedStudent.student_id, reportData);
            showToast('Academic report added!', 'success');
            setModal(null);
            const updatedStudent = await api.getStudentById(selectedStudent.student_id);
            if (updatedStudent) setSelectedStudent(updatedStudent);
        } catch (error: any) {
            showToast(error.message || 'Failed to add report.', 'error');
        }
    };

    const handleSaveFollowUp = async (recordData: any) => {
        if (!selectedStudent) return;
        try {
            if (editingFollowUp) {
                await api.updateFollowUpRecord(selectedStudent.student_id, { ...recordData, id: editingFollowUp.id, student_id: selectedStudent.student_id });
                showToast('Follow-up record updated!', 'success');
            } else {
                await api.addFollowUpRecord(selectedStudent.student_id, recordData);
                showToast('Follow-up record added!', 'success');
            }
            
            setModal(null);
            setEditingFollowUp(null);
            const updatedStudent = await api.getStudentById(selectedStudent.student_id);
            if (updatedStudent) setSelectedStudent(updatedStudent);
        } catch (error) {
            showToast('Failed to save record.', 'error');
        }
    };

    const handleImport = async (newStudents: Partial<Student>[]) => {
        try {
            const result = await api.addBulkStudents(newStudents);
            showToast(`${result.importedCount} students imported, ${result.skippedCount} skipped.`, 'success');
            setIsImporting(false);
            fetchStudents();
        } catch (error) {
             showToast('An error occurred during import.', 'error');
        }
    };

    const handleDownloadPdf = (record: FollowUpRecord) => {
        if (typeof (window as any).jspdf === 'undefined' || typeof (window as any).html2canvas === 'undefined') {
            showToast('PDF generation libraries are still loading. Please try again.', 'error');
            return;
        }
        setIsGeneratingPdf(true);
        setRecordForPdf(record);
    };
    
    const sortedAndFilteredStudents = useMemo(() => {
        let filtered = students.filter(s =>
            `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.student_id.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (sortConfig) {
            filtered.sort((a, b) => {
                const aVal = sortConfig.key === 'age' ? calculateAge(a.date_of_birth) : a[sortConfig.key as keyof Student];
                const bVal = sortConfig.key === 'age' ? calculateAge(b.date_of_birth) : b[sortConfig.key as keyof Student];

                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return (aVal - bVal) * (sortConfig.order === 'asc' ? 1 : -1);
                }
                
                if (String(aVal).localeCompare(String(bVal)) !== 0) {
                     return String(aVal).localeCompare(String(bVal)) * (sortConfig.order === 'asc' ? 1 : -1);
                }
                return 0;
            });
        }
        return filtered;
    }, [students, searchTerm, sortConfig]);
    
    const handleSort = (key: keyof Student | 'age') => {
        let order: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.order === 'asc') {
            order = 'desc';
        }
        setSortConfig({ key, order });
    };

    const FollowUpRecordView: React.FC<{ record: FollowUpRecord; onEdit: (record: FollowUpRecord) => void; onDownload: (record: FollowUpRecord) => void; }> = ({ record, onEdit, onDownload }) => {
        const InfoPair: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode }> = ({ label, value, children }) => (
            <div>
                <p className="text-sm text-body-color dark:text-gray-300">{label}</p>
                <div className="font-medium text-black dark:text-white">{children || value || 'N/A'}</div>
            </div>
        );

        const Section: React.FC<{ title: string; children: React.ReactNode; hasData: boolean }> = ({ title, children, hasData }) => (
            <div className="bg-white dark:bg-box-dark rounded-lg border border-stroke dark:border-strokedark shadow-sm p-4">
                <h4 className="text-md font-semibold text-black dark:text-white mb-3 border-b border-stroke dark:border-strokedark pb-2">{title}</h4>
                {hasData ? <div className="space-y-3">{children}</div> : <p className="text-body-color dark:text-gray-400 italic">Lack of information?</p>}
            </div>
        );

        const hasWellbeingData = !!(record.physical_health !== WellbeingStatus.NA || record.physical_health_notes || record.social_interaction !== WellbeingStatus.NA || record.social_interaction_notes || record.home_life !== WellbeingStatus.NA || record.home_life_notes || record.drugs_alcohol_violence !== YesNo.NA || record.drugs_alcohol_violence_notes);
        const hasRiskData = !!(record.risk_factors_list.length > 0 || record.risk_factors_details || record.condition_of_home !== WellbeingStatus.NA || record.condition_of_home_notes || record.mother_working !== YesNo.NA || record.father_working !== YesNo.NA || record.other_family_member_working !== YesNo.NA || record.current_work_details || record.attending_church !== YesNo.NA);
        const hasStaffNotesData = !!(record.staff_notes || record.changes_recommendations);
        
        return (
             <div className="space-y-4 p-4 bg-gray-2/50 dark:bg-box-dark-2/50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <InfoPair label="Date of Follow Up" value={new Date(record.date_of_follow_up).toLocaleDateString()} />
                    <InfoPair label="Location" value={record.location} />
                    <InfoPair label="Parent/Guardian" value={record.parent_guardian} />
                </div>
                
                <Section title="Well-being Progress" hasData={hasWellbeingData}>
                    <InfoPair label="Physical Health">
                        {record.physical_health}{record.physical_health_notes && <span className="text-body-color dark:text-gray-300 ml-2 font-normal">- {record.physical_health_notes}</span>}
                    </InfoPair>
                     <InfoPair label="Social Interaction">
                        {record.social_interaction}{record.social_interaction_notes && <span className="text-body-color dark:text-gray-300 ml-2 font-normal">- {record.social_interaction_notes}</span>}
                    </InfoPair>
                     <InfoPair label="Home Life">
                        {record.home_life}{record.home_life_notes && <span className="text-body-color dark:text-gray-300 ml-2 font-normal">- {record.home_life_notes}</span>}
                    </InfoPair>
                     <InfoPair label="Drugs, Alcohol, Violence">
                        {record.drugs_alcohol_violence}{record.drugs_alcohol_violence_notes && <span className="text-body-color dark:text-gray-300 ml-2 font-normal">- {record.drugs_alcohol_violence_notes}</span>}
                    </InfoPair>
                </Section>

                <Section title="Risk Factors" hasData={hasRiskData}>
                    {record.risk_factors_list.length > 0 && 
                        <InfoPair label="Identified Risks">
                            <ul className="list-disc list-inside text-sm font-normal">
                                {record.risk_factors_list.map(r => <li key={r}>{r}</li>)}
                            </ul>
                        </InfoPair>
                    }
                    {record.risk_factors_details && <InfoPair label="Risk Details" value={record.risk_factors_details} />}
                    <InfoPair label="Condition of Home">
                        {record.condition_of_home}{record.condition_of_home_notes && <span className="text-body-color dark:text-gray-300 ml-2 font-normal">- {record.condition_of_home_notes}</span>}
                    </InfoPair>
                    {record.current_work_details && <InfoPair label="Family Work Details" value={record.current_work_details}/>}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                       <InfoPair label="Mother Working?" value={record.mother_working}/>
                       <InfoPair label="Father Working?" value={record.father_working}/>
                       <InfoPair label="Other Family?" value={record.other_family_member_working}/>
                       <InfoPair label="Attending Church?" value={record.attending_church}/>
                    </div>
                </Section>

                <Section title="Staff Notes & Conclusion" hasData={hasStaffNotesData}>
                    {record.staff_notes && <InfoPair label="Staff Notes" value={record.staff_notes} />}
                    {record.changes_recommendations && <InfoPair label="Changes/Recommendations" value={record.changes_recommendations} />}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stroke dark:border-strokedark">
                        <InfoPair label="Child Protection Concerns?" value={record.child_protection_concerns} />
                        <InfoPair label="Human Trafficking Risk?" value={record.human_trafficking_risk} />
                        <InfoPair label="Completed By" value={`${record.completed_by} on ${new Date(record.date_completed).toLocaleDateString()}`} />
                        <InfoPair label="Reviewed By" value={record.reviewed_by && record.date_reviewed ? `${record.reviewed_by} on ${new Date(record.date_reviewed).toLocaleDateString()}` : 'N/A'} />
                    </div>
                </Section>
                <div className="flex gap-2 justify-end pt-2">
                    <button onClick={() => onEdit(record)} className="flex items-center bg-primary text-white px-3 py-1.5 text-sm rounded-lg hover:opacity-90"><EditIcon /><span className="ml-1.5">Edit</span></button>
                    <button 
                        onClick={() => onDownload(record)} 
                        disabled={isGeneratingPdf}
                        className="flex items-center bg-secondary text-white px-3 py-1.5 text-sm rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isGeneratingPdf && record.id === recordForPdf?.id ? (
                             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <DownloadIcon />
                        )}
                        <span className="ml-1.5">{isGeneratingPdf && record.id === recordForPdf?.id ? 'Generating...' : 'Download PDF'}</span>
                    </button>
                </div>
            </div>
        );
    };

    const StudentDetailView: React.FC<{ student: Student, onBack: () => void }> = ({ student, onBack }) => (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <button onClick={onBack} className="text-primary hover:underline">← Back to Student List</button>
                 <div className="flex gap-2">
                     <button onClick={() => { setSelectedStudent(student); setIsAdding(true); }} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90"><EditIcon /> <span className="ml-2">Edit</span></button>
                    <button onClick={() => handleDeleteStudent(student.student_id)} className="flex items-center bg-danger text-white px-4 py-2 rounded-lg hover:opacity-90"><TrashIcon /> <span className="ml-2">Delete</span></button>
                 </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-full md:w-1/4 flex flex-col items-center">
                    <img src={student.profile_photo || 'https://i.pravatar.cc/150'} alt={`${student.first_name}`} className="w-32 h-32 rounded-full object-cover mb-4" />
                    <h2 className="text-2xl font-bold text-black dark:text-white">{student.first_name} {student.last_name}</h2>
                    <p className="text-body-color dark:text-gray-300">{student.student_id}</p>
                     <p className="text-body-color dark:text-gray-300">Age: {calculateAge(student.date_of_birth)}</p>
                </div>
                <div className="w-full md:w-3/4">
                    <DetailCard title="Core Program Data" data={{
                        'Student Status': student.student_status,
                        'Sponsorship Status': student.sponsorship_status,
                        'Sponsor Name': student.sponsor_name,
                        'Sponsorship Contract on File': student.has_sponsorship_contract,
                        'School': student.school,
                        'Current Grade': student.current_grade,
                        'EEP Enroll Date': new Date(student.eep_enroll_date).toLocaleDateString(),
                    }} />
                </div>
            </div>
            
            <DetailCard title="Personal & Family Details" data={{
                 'Date of Birth': new Date(student.date_of_birth).toLocaleDateString(),
                 'Gender': student.gender,
                 'City': student.city,
                 'Village/Slum': student.village_slum,
                 'Guardian Name': student.guardian_name,
                 'Guardian Contact': student.guardian_contact_info,
                 'Siblings': student.siblings_count,
                 'Household Members': student.household_members_count,
                 'Annual Income': `$${student.annual_income}`,
                 'Transportation': student.transportation,
            }} />
            <NarrativeDetailCard title="Risk & Health Assessment" data={{
                'Risk Level': `${student.risk_level}/5`,
                'Health Status': student.health_status,
                'Health Issues': student.health_issues,
                'Interaction with Others': student.interaction_with_others,
                'Interaction Issues': student.interaction_issues,
            }} />
             <NarrativeDetailCard title="Narrative Information" data={{ 'Child Story': student.child_story, 'Other Notes': student.other_notes }} />
            
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-black dark:text-white">Academic Reports</h3>
                    <button onClick={() => setModal('add_report')} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90"><DocumentAddIcon /><span className="ml-2">Add Report</span></button>
                 </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-black dark:text-white">Follow-up History</h3>
                    <button onClick={() => { setEditingFollowUp(null); setModal('add_follow_up'); }} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90"><DocumentAddIcon /><span className="ml-2">New Follow-up</span></button>
                </div>
                <div className="space-y-2">
                    {student.follow_up_records && student.follow_up_records.length > 0 ? (
                        student.follow_up_records
                            .sort((a,b) => new Date(b.date_of_follow_up).getTime() - new Date(a.date_of_follow_up).getTime())
                            .map(record => (
                            <div key={record.id} className="border border-stroke dark:border-strokedark rounded-lg">
                                <button
                                    onClick={() => setOpenFollowUpId(openFollowUpId === record.id ? null : record.id)}
                                    className="w-full p-4 text-left flex justify-between items-center bg-gray-2 dark:bg-box-dark-2 hover:bg-gray/80"
                                >
                                    <span className="font-semibold text-black dark:text-white">Follow-up from {new Date(record.date_of_follow_up).toLocaleDateString()}</span>
                                    <span>{openFollowUpId === record.id ? <ArrowUpIcon /> : <ArrowDownIcon />}</span>
                                </button>
                                {openFollowUpId === record.id && <FollowUpRecordView record={record} onEdit={(r) => { setEditingFollowUp(r); setModal('edit_follow_up'); }} onDownload={handleDownloadPdf} />}
                            </div>
                        ))
                    ) : (
                        <p className="text-body-color dark:text-gray-300">No follow-up records found for this student.</p>
                    )}
                </div>
            </div>

            {modal === 'add_report' && (
                <Modal isOpen={true} onClose={() => setModal(null)} title="Add Academic Report">
                    <AcademicReportForm 
                        studentId={student.student_id}
                        students={[]} // Not needed as student is pre-selected
                        onSave={(data) => handleSaveAcademicReport(data)} 
                        onCancel={() => setModal(null)} 
                    />
                </Modal>
            )}
            {(modal === 'add_follow_up' || modal === 'edit_follow_up') && (
                <Modal isOpen={true} onClose={() => { setModal(null); setEditingFollowUp(null); }} title={editingFollowUp ? "Edit Follow-up Report" : "Add Monthly Follow-up Report"}>
                    <FollowUpForm student={student} onSave={handleSaveFollowUp} onCancel={() => { setModal(null); setEditingFollowUp(null); }} initialData={editingFollowUp} />
                </Modal>
            )}
        </div>
    );
    
    if (loading) return <SkeletonTable rows={10} cols={6} />;
    
    if (selectedStudent && !isAdding) {
        return <StudentDetailView student={selectedStudent} onBack={() => setSelectedStudent(null)} />;
    }

    const PrintableFollowUpRecord: React.FC<{ record: FollowUpRecord, student: Student }> = ({ record, student }) => {
        const InfoPair: React.FC<{ label: string; value?: string | number | boolean | null; className?: string; children?: React.ReactNode; }> = ({ label, value, className, children }) => (
            <div className={className}>
                <p className="text-xs text-gray-600 uppercase font-semibold">{label}</p>
                <div className="font-medium text-black break-words">{children || (typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value) || <span className="text-gray-500">N/A</span>}</div>
            </div>
        );
        const Section: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
            <div className="mb-4">
                <h2 className="text-base font-bold border-b border-gray-300 pb-1 mb-2">{title}</h2>
                <div className="space-y-2">{children}</div>
            </div>
        );
        return (
            <div className="p-6 bg-white text-black font-sans text-sm" style={{ width: '210mm' }}>
                <header className="flex justify-between items-center border-b-2 border-black pb-2 mb-4">
                    <div>
                        <h1 className="text-xl font-bold">Student Monthly Follow-Up Report</h1>
                        <p className="text-gray-700">Confidential Program Report</p>
                    </div>
                    <div className="text-right text-xs">
                        <p className="font-bold">NGO Sponsorship Program</p>
                        <p>Generated on: {new Date().toLocaleDateString()}</p>
                    </div>
                </header>
                <Section title="Section 1: Client Information">
                    <div className="grid grid-cols-4 gap-2">
                        <InfoPair label="Child's Name" value={record.child_name} />
                        <InfoPair label="Child's Age" value={record.child_current_age} />
                        <InfoPair label="Student ID" value={student.student_id} />
                        <InfoPair label="Date of Follow Up" value={new Date(record.date_of_follow_up).toLocaleDateString()} />
                        <InfoPair label="Location" value={record.location} className="col-span-2" />
                        <InfoPair label="Parent/Guardian" value={record.parent_guardian} className="col-span-2" />
                    </div>
                </Section>
                 <Section title="Section 2: Well-being Progress">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <InfoPair label="Physical Health" value={record.physical_health} />
                        <InfoPair label="Notes" value={record.physical_health_notes} />
                        <InfoPair label="Social Interaction" value={record.social_interaction} />
                        <InfoPair label="Notes" value={record.social_interaction_notes} />
                        <InfoPair label="Home Life" value={record.home_life} />
                        <InfoPair label="Notes" value={record.home_life_notes} />
                        <InfoPair label="Evidence of Drugs/Alcohol/Violence?" value={record.drugs_alcohol_violence} />
                        <InfoPair label="Notes" value={record.drugs_alcohol_violence_notes} />
                    </div>
                </Section>
                <Section title="Section 2a: Risk Factors">
                    {record.risk_factors_list.length > 0 ? (
                        <InfoPair label="Identified Risk Factors" className="mb-2">
                            <ul className="list-disc list-inside grid grid-cols-3 text-xs">
                                {record.risk_factors_list.map(r => <li key={r}>{r}</li>)}
                            </ul>
                        </InfoPair>
                    ) : <InfoPair label="Identified Risk Factors" value="None identified." />}
                    <InfoPair label="Details on Risk Factors" value={record.risk_factors_details} />
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                         <InfoPair label="Condition of Home" value={record.condition_of_home} />
                         <InfoPair label="Notes" value={record.condition_of_home_notes} />
                         <InfoPair label="Family Work Details" value={record.current_work_details} className="col-span-2" />
                         <InfoPair label="Mother Working?" value={record.mother_working} />
                         <InfoPair label="Father Working?" value={record.father_working} />
                         <InfoPair label="Other Family Member Working?" value={record.other_family_member_working} />
                         <InfoPair label="Attending Church/House of Prayer?" value={record.attending_church} />
                    </div>
                </Section>
                <Section title="Section 4: EEP Staff Notes">
                    <InfoPair label="Notes" value={record.staff_notes} />
                    <InfoPair label="Changes/Recommendations" value={record.changes_recommendations} />
                </Section>
                <Section title="Section 5: Conclusion & Review">
                     <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <InfoPair label="Child Protection Concerns?" value={record.child_protection_concerns} />
                        <InfoPair label="Increased Human Trafficking Risk?" value={record.human_trafficking_risk} />
                         <InfoPair label="Completed By" value={record.completed_by} />
                        <InfoPair label="Date Completed" value={new Date(record.date_completed).toLocaleDateString()} />
                        <InfoPair label="Reviewed By" value={record.reviewed_by} />
                        <InfoPair label="Date Reviewed" value={record.date_reviewed ? new Date(record.date_reviewed).toLocaleDateString() : 'N/A'} />
                     </div>
                </Section>
                <footer className="mt-6 pt-2 border-t text-center text-xs text-gray-500">
                    <p>End of Report</p>
                </footer>
            </div>
        );
    };

    return (
        <>
            <div className="rounded-lg border border-stroke bg-white dark:bg-box-dark p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <input type="text" placeholder="Search students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-1/2 rounded-lg border-[1.5px] border-stroke bg-gray-2 py-2 px-5 font-medium outline-none transition focus:border-primary text-black dark:border-strokedark dark:bg-form-input dark:text-white"/>
                    <div className="flex w-full sm:w-auto gap-2">
                        <button onClick={() => setIsImporting(true)} className="flex w-full sm:w-auto justify-center items-center bg-secondary text-white px-4 py-2 rounded-lg hover:opacity-90">
                            <UploadIcon /> <span className="ml-2">Import</span>
                        </button>
                        <button onClick={() => { setSelectedStudent(null); setIsAdding(true); }} className="flex w-full sm:w-auto justify-center items-center bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90">
                            <PlusIcon /> <span className="ml-2">Add Student</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-2 dark:bg-box-dark-2">
                            <tr>
                                {([
                                    { key: 'first_name', label: 'Name' },
                                    { key: 'student_id', label: 'Student ID' },
                                    { key: 'age', label: 'Age' },
                                    { key: 'date_of_birth', label: 'Date of Birth' },
                                    { key: 'student_status', label: 'Status' },
                                    { key: 'sponsorship_status', label: 'Sponsorship' },
                                ] as {key: keyof Student | 'age', label: string}[]).map(({key, label}) => (
                                    <th key={key} className="p-4 font-medium text-black dark:text-white">
                                        <button className="flex items-center gap-1 hover:text-primary dark:hover:text-primary transition-colors" onClick={() => handleSort(key)}>
                                            {label}
                                            {sortConfig?.key === key && (sortConfig.order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFilteredStudents.map((s) => (
                                <tr key={s.student_id} className="cursor-pointer hover:bg-gray dark:hover:bg-box-dark-2" onClick={() => setSelectedStudent(s)}>
                                    <td className="p-4 flex items-center gap-3">
                                        <img src={s.profile_photo || `https://i.pravatar.cc/150?u=${s.student_id}`} alt={`${s.first_name}`} className="w-10 h-10 rounded-full object-cover"/>
                                        <div>
                                            <p className="font-medium text-black dark:text-white">{s.first_name} {s.last_name}</p>
                                            <p className="text-sm text-body-color dark:text-gray-300">{s.gender}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-black dark:text-white">{s.student_id}</td>
                                    <td className="p-4 text-body-color dark:text-gray-300">{calculateAge(s.date_of_birth)}</td>
                                    <td className="p-4 text-body-color dark:text-gray-300">{new Date(s.date_of_birth).toLocaleDateString()}</td>
                                    <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${s.student_status === StudentStatus.ACTIVE ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{s.student_status}</span></td>
                                    <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${s.sponsorship_status === SponsorshipStatus.SPONSORED ? 'bg-primary/10 text-primary' : 'bg-gray-400/20 text-gray-400'}`}>{s.sponsorship_status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <Modal isOpen={isAdding} onClose={() => { setIsAdding(false); setSelectedStudent(null); }} title={selectedStudent && isAdding ? 'Edit Student' : 'Add New Student'}>
                    <StudentForm 
                        key={selectedStudent ? selectedStudent.student_id : 'new-student'}
                        student={selectedStudent} 
                        onSave={handleSaveStudent} 
                        onCancel={() => { setIsAdding(false); setSelectedStudent(null); }} 
                    />
                </Modal>
                
                {isImporting && <StudentImportModal onImport={handleImport} onClose={() => setIsImporting(false)} />}
            </div>
            {recordForPdf && selectedStudent && (
                 <div style={{ position: 'absolute', left: '-9999px', top: 0 }} ref={printableRef}>
                    <PrintableFollowUpRecord record={recordForPdf} student={selectedStudent} />
                </div>
            )}
        </>
    );
};

export default StudentsPage;