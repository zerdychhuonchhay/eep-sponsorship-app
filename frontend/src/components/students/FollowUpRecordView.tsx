import React from 'react';
import { FollowUpRecord, WellbeingStatus, YesNo } from '@/types.ts';
import { EditIcon, DownloadIcon } from '@/components/Icons.tsx';
import { formatDateForDisplay } from '@/utils/dateUtils.ts';

interface FollowUpRecordViewProps {
    record: FollowUpRecord;
    onEdit: (record: FollowUpRecord) => void;
    onDownload: (record: FollowUpRecord) => void;
    isGeneratingPdf: boolean;
    isCurrentPdfTarget: boolean;
}

const InfoPair: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode }> = ({ label, value, children }) => (
    <div>
        <p className="text-sm text-body-color dark:text-gray-300">{label}</p>
        <div className="font-medium text-black dark:text-white">{children || value || 'N/A'}</div>
    </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode; hasData: boolean }> = ({ title, children, hasData }) => (
    <div className="bg-white dark:bg-box-dark rounded-lg border border-stroke dark:border-strokedark shadow-sm p-4">
        <h4 className="text-md font-semibold text-black dark:text-white mb-3 border-b border-stroke dark:border-strokedark pb-2">{title}</h4>
        {hasData ? <div className="space-y-3">{children}</div> : <p className="text-body-color dark:text-gray-400 italic">No information provided.</p>}
    </div>
);


const FollowUpRecordView: React.FC<FollowUpRecordViewProps> = ({ record, onEdit, onDownload, isGeneratingPdf, isCurrentPdfTarget }) => {
    const hasWellbeingData = !!(record.physicalHealth !== WellbeingStatus.NA || record.physicalHealthNotes || record.socialInteraction !== WellbeingStatus.NA || record.socialInteractionNotes || record.homeLife !== WellbeingStatus.NA || record.homeLifeNotes || record.drugsAlcoholViolence !== YesNo.NA || record.drugsAlcoholViolenceNotes);
    const hasRiskData = !!(record.riskFactorsList.length > 0 || record.riskFactorsDetails || record.conditionOfHome !== WellbeingStatus.NA || record.conditionOfHomeNotes || record.motherWorking !== YesNo.NA || record.fatherWorking !== YesNo.NA || record.otherFamilyMemberWorking !== YesNo.NA || record.currentWorkDetails || record.attendingChurch !== YesNo.NA);
    const hasStaffNotesData = !!(record.staffNotes || record.changesRecommendations);
    
    return (
         <div className="space-y-4 p-4 bg-gray-2/50 dark:bg-box-dark-2/50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm p-4 bg-white dark:bg-box-dark rounded-lg border border-stroke dark:border-strokedark shadow-sm">
                <InfoPair label="Date of Follow Up" value={formatDateForDisplay(record.dateOfFollowUp)} />
                <InfoPair label="Location" value={record.location} />
                <InfoPair label="Parent/Guardian" value={record.parentGuardian} />
            </div>
            
            <Section title="Well-being Progress" hasData={hasWellbeingData}>
                <InfoPair label="Physical Health">
                    {record.physicalHealth}{record.physicalHealthNotes && <span className="text-body-color dark:text-gray-300 ml-2 font-normal">- {record.physicalHealthNotes}</span>}
                </InfoPair>
                 <InfoPair label="Social Interaction">
                    {record.socialInteraction}{record.socialInteractionNotes && <span className="text-body-color dark:text-gray-300 ml-2 font-normal">- {record.socialInteractionNotes}</span>}
                </InfoPair>
                 <InfoPair label="Home Life">
                    {record.homeLife}{record.homeLifeNotes && <span className="text-body-color dark:text-gray-300 ml-2 font-normal">- {record.homeLifeNotes}</span>}
                </InfoPair>
                 <InfoPair label="Drugs, Alcohol, Violence">
                    {record.drugsAlcoholViolence}{record.drugsAlcoholViolenceNotes && <span className="text-body-color dark:text-gray-300 ml-2 font-normal">- {record.drugsAlcoholViolenceNotes}</span>}
                </InfoPair>
            </Section>

            <Section title="Risk Factors" hasData={hasRiskData}>
                {record.riskFactorsList.length > 0 && 
                    <InfoPair label="Identified Risks">
                        <ul className="list-disc list-inside text-sm font-normal">
                            {record.riskFactorsList.map(r => <li key={r}>{r}</li>)}
                        </ul>
                    </InfoPair>
                }
                {record.riskFactorsDetails && <InfoPair label="Risk Details" value={record.riskFactorsDetails} />}
                <InfoPair label="Condition of Home">
                    {record.conditionOfHome}{record.conditionOfHomeNotes && <span className="text-body-color dark:text-gray-300 ml-2 font-normal">- {record.conditionOfHomeNotes}</span>}
                </InfoPair>
                {record.currentWorkDetails && <InfoPair label="Family Work Details" value={record.currentWorkDetails}/>}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                   <InfoPair label="Mother Working?" value={record.motherWorking}/>
                   <InfoPair label="Father Working?" value={record.fatherWorking}/>
                   <InfoPair label="Other Family?" value={record.otherFamilyMemberWorking}/>
                   <InfoPair label="Attending Church?" value={record.attendingChurch}/>
                </div>
            </Section>

            <Section title="Staff Notes & Conclusion" hasData={hasStaffNotesData}>
                {record.staffNotes && <InfoPair label="Staff Notes" value={record.staffNotes} />}
                {record.changesRecommendations && <InfoPair label="Changes/Recommendations" value={record.changesRecommendations} />}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stroke dark:border-strokedark">
                    <InfoPair label="Child Protection Concerns?" value={record.childProtectionConcerns} />
                    <InfoPair label="Human Trafficking Risk?" value={record.humanTraffickingRisk} />
                    <InfoPair label="Completed By" value={`${record.completedBy} on ${formatDateForDisplay(record.dateCompleted)}`} />
                    <InfoPair label="Reviewed By" value={record.reviewedBy && record.dateReviewed ? `${record.reviewedBy} on ${formatDateForDisplay(record.dateReviewed)}` : 'N/A'} />
                </div>
            </Section>
            <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => onEdit(record)} className="flex items-center bg-primary text-white px-3 py-1.5 text-sm rounded-lg hover:opacity-90"><EditIcon className="w-4 h-4" /><span className="ml-1.5">Edit</span></button>
                <button 
                    onClick={() => onDownload(record)} 
                    disabled={isGeneratingPdf}
                    className="flex items-center bg-secondary text-white px-3 py-1.5 text-sm rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-wait"
                >
                    {isGeneratingPdf && isCurrentPdfTarget ? (
                         <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                        <DownloadIcon className="w-4 h-4" />
                    )}
                    <span className="ml-1.5">{isGeneratingPdf && isCurrentPdfTarget ? 'Generating...' : 'Download PDF'}</span>
                </button>
            </div>
        </div>
    );
};

export default FollowUpRecordView;