import React from 'react';
import { Student } from '@/types.ts';
import { Card, CardContent } from '@/components/ui/Card.tsx';
import { UserIcon } from '@/components/Icons.tsx';
import Badge from '@/components/ui/Badge.tsx';

interface StudentCardProps {
    student: Student;
    isSelected: boolean;
    onSelect: (studentId: string, isSelected: boolean) => void;
    onViewProfile: (student: Student) => void;
    canUpdate: boolean;
    isSelectionMode: boolean;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, isSelected, onSelect, onViewProfile, canUpdate, isSelectionMode }) => {
    
    const handleCardClick = () => {
        if (isSelectionMode) {
            onSelect(student.studentId, !isSelected);
        } else {
            onViewProfile(student);
        }
    };
    
    const handleCheckboxClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation(); // Prevent card click when checkbox is clicked
        onSelect(student.studentId, !isSelected);
    };

    return (
        <Card className={`relative transition-all duration-200 ${isSelected ? 'border-primary shadow-lg' : 'hover:shadow-md'}`}>
            {canUpdate && isSelectionMode && (
                <div 
                    className="absolute top-4 left-4 z-10 p-1"
                    onClick={handleCheckboxClick}
                >
                    <input 
                        type="checkbox" 
                        className="form-checkbox h-5 w-5 text-primary rounded focus:ring-primary"
                        checked={isSelected}
                        readOnly
                    />
                </div>
            )}
            <div className="cursor-pointer" onClick={handleCardClick}>
                <CardContent className="flex flex-col items-center text-center p-4">
                    {student.profilePhoto ? (
                        <img src={student.profilePhoto} alt={`${student.firstName}`} className="w-24 h-24 rounded-full object-cover mb-4 shadow-md"/>
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-2 dark:bg-box-dark-2 flex items-center justify-center mb-4">
                            <UserIcon className="w-12 h-12 text-gray-500 dark:text-gray-400" />
                        </div>
                    )}
                    <h3 className="text-lg font-semibold text-black dark:text-white truncate w-full" title={`${student.firstName} ${student.lastName}`}>
                        {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-sm text-body-color dark:text-gray-300">{student.studentId}</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <Badge type={student.studentStatus} />
                        <Badge type={student.sponsorshipStatus} />
                    </div>
                </CardContent>
            </div>
        </Card>
    );
};

export default StudentCard;