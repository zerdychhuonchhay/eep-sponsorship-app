import React from 'react';
import { Student } from '@/types.ts';
import { calculateAge } from '@/utils/dateUtils.ts';
import Badge from '@/components/ui/Badge.tsx';
import { UserIcon } from '@/components/Icons.tsx';
import ActionDropdown, { ActionItem } from '@/components/ActionDropdown.tsx';

interface MobileStudentCardProps {
    student: Student;
    onViewProfile: (student: Student) => void;
    actionItems: ActionItem[];
    sponsorName?: string;
}

const StatItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-sm text-body-color dark:text-gray-400">{label}</p>
        <p className="font-medium text-black dark:text-white truncate">{value || 'N/A'}</p>
    </div>
);


const MobileStudentCard: React.FC<MobileStudentCardProps> = ({ student, onViewProfile, actionItems, sponsorName }) => {
    return (
        <div className="bg-white dark:bg-box-dark rounded-lg border border-stroke dark:border-strokedark shadow-sm overflow-hidden">
            <div className="p-4">
                {/* Card Header */}
                <div className="flex items-center gap-4 mb-4">
                    <div
                        className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden cursor-pointer"
                        onClick={() => onViewProfile(student)}
                    >
                        {student.profilePhoto ? (
                            <img src={student.profilePhoto} alt={student.firstName} className="h-full w-full object-cover"/>
                        ) : (
                            <div className="w-full h-full bg-gray-2 dark:bg-box-dark-2 flex items-center justify-center">
                                <UserIcon className="w-6 h-6 text-gray-500" />
                            </div>
                        )}
                    </div>
                    <div className="flex-grow overflow-hidden cursor-pointer" onClick={() => onViewProfile(student)}>
                        <h3 className="font-semibold text-lg text-black dark:text-white truncate">{`${student.firstName} ${student.lastName}`}</h3>
                        <p className="text-sm text-body-color dark:text-gray-400">{student.studentId}</p>
                    </div>
                </div>

                {/* Card Body - Key Info Grid */}
                <div
                    className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4 cursor-pointer"
                    onClick={() => onViewProfile(student)}
                >
                    <StatItem label="Age" value={calculateAge(student.dateOfBirth)} />
                    <StatItem label="Grade" value={student.currentGrade} />
                    <StatItem label="School" value={student.school} />
                    <StatItem label="Sponsor" value={sponsorName} />
                </div>
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between bg-gray-2/50 dark:bg-box-dark-2/50 px-4 py-2 border-t border-stroke dark:border-strokedark">
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge type={student.sponsorshipStatus} />
                    <Badge type={student.studentStatus} />
                </div>
                {actionItems.length > 0 && (
                    <div onClick={(e) => e.stopPropagation()}>
                        <ActionDropdown items={actionItems} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileStudentCard;