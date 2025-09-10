import React from 'react';
import { Student, FollowUpRecord } from '@/types.ts';
import { formatDateForDisplay } from '@/utils/dateUtils.ts';

interface PrintableFollowUpRecordProps {
    record: FollowUpRecord;
    student: Student;
}

const PrintableFollowUpRecord: React.FC<PrintableFollowUpRecordProps> = ({ record, student }) => {
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
        <div className="p-6 bg-white text-black font-sans text-sm">
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
                    <InfoPair label="Child's Name" value={record.childName} />
                    <InfoPair label="Child's Age" value={record.childCurrentAge} />
                    <InfoPair label="Student ID" value={student.studentId} />
                    <InfoPair label="Date of Follow Up" value={formatDateForDisplay(record.dateOfFollowUp)} />
                    <InfoPair label="Location" value={record.location} className="col-span-2" />
                    <InfoPair label="Parent/Guardian" value={record.parentGuardian} className="col-span-2" />
                </div>
            </Section>
             <Section title="Section 2: Well-being Progress">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <InfoPair label="Physical Health" value={record.physicalHealth} />
                    <InfoPair label="Notes" value={record.physicalHealthNotes} />
                    <InfoPair label="Social Interaction" value={record.socialInteraction} />
                    <InfoPair label="Notes" value={record.socialInteractionNotes} />
                    <InfoPair label="Home Life" value={record.homeLife} />
                    <InfoPair label="Notes" value={record.homeLifeNotes} />
                    <InfoPair label="Evidence of Drugs/Alcohol/Violence?" value={record.drugsAlcoholViolence} />
                    <InfoPair label="Notes" value={record.drugsAlcoholViolenceNotes} />
                </div>
            </Section>
            <Section title="Section 2a: Risk Factors">
                {record.riskFactorsList.length > 0 ? (
                    <InfoPair label="Identified Risk Factors" className="mb-2">
                        <ul className="list-disc list-inside grid grid-cols-3 text-xs">
                            {record.riskFactorsList.map(r => <li key={r}>{r}</li>)}
                        </ul>
                    </InfoPair>
                ) : <InfoPair label="Identified Risk Factors" value="None identified." />}
                <InfoPair label="Details on Risk Factors" value={record.riskFactorsDetails} />
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                     <InfoPair label="Condition of Home" value={record.conditionOfHome} />
                     <InfoPair label="Notes" value={record.conditionOfHomeNotes} />
                     <InfoPair label="Family Work Details" value={record.currentWorkDetails} className="col-span-2" />
                     <InfoPair label="Mother Working?" value={record.motherWorking} />
                     <InfoPair label="Father Working?" value={record.fatherWorking} />
                     <InfoPair label="Other Family Member Working?" value={record.otherFamilyMemberWorking} />
                     <InfoPair label="Attending Church/House of Prayer?" value={record.attendingChurch} />
                </div>
            </Section>
            <Section title="Section 4: EEP Staff Notes">
                <InfoPair label="Notes" value={record.staffNotes} />
                <InfoPair label="Changes/Recommendations" value={record.changesRecommendations} />
            </Section>
            <Section title="Section 5: Conclusion & Review">
                 <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <InfoPair label="Child Protection Concerns?" value={record.childProtectionConcerns} />
                    <InfoPair label="Increased Human Trafficking Risk?" value={record.humanTraffickingRisk} />
                     <InfoPair label="Completed By" value={record.completedBy} />
                    <InfoPair label="Date Completed" value={formatDateForDisplay(record.dateCompleted)} />
                    <InfoPair label="Reviewed By" value={record.reviewedBy} />
                    <InfoPair label="Date Reviewed" value={record.dateReviewed ? formatDateForDisplay(record.dateReviewed) : 'N/A'} />
                 </div>
            </Section>
            <footer className="mt-6 pt-2 border-t text-center text-xs text-gray-500">
                <p>End of Report</p>
            </footer>
        </div>
    );
};
export default PrintableFollowUpRecord;