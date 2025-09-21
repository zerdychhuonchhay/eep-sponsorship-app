import React, { useState, useEffect, useRef, TouchEvent, useCallback } from 'react';
import { Student } from '@/types.ts';
import { calculateAge } from '@/utils/dateUtils.ts';
import Badge from '@/components/ui/Badge.tsx';
import Button from '@/components/ui/Button.tsx';
import { UserIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/Icons.tsx';
import EmptyState from '@/components/EmptyState.tsx';

interface StudentSwipeViewProps {
    students: Student[];
    isLoading: boolean;
    loadMore: () => void;
    hasMore: boolean;
    onViewProfile: (student: Student) => void;
}

const SWIPE_THRESHOLD = 50; // Min pixels for a swipe to register
const GESTURE_LOCK_THRESHOLD = 10; // Min pixels to determine swipe direction

const StudentSwipeView: React.FC<StudentSwipeViewProps> = ({ students, isLoading, loadMore, hasMore, onViewProfile }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
    const [touchMove, setTouchMove] = useState<{ x: number, y: number } | null>(null);
    const [swipeDirection, setSwipeDirection] = useState<'horizontal' | 'vertical' | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const goToNext = useCallback(() => {
        if (currentIndex < students.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    }, [currentIndex, students.length]);

    const goToPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    useEffect(() => {
        if (students.length > 0 && currentIndex >= students.length - 3 && hasMore && !isLoading) {
            loadMore();
        }
    }, [currentIndex, students.length, hasMore, isLoading, loadMore]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goToNext();
            else if (e.key === 'ArrowLeft') goToPrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToNext, goToPrev]);
    
    const handleTouchStart = (e: TouchEvent) => {
        setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
        setTouchMove(null);
        setSwipeDirection(null);
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!touchStart) return;

        const currentX = e.targetTouches[0].clientX;
        const currentY = e.targetTouches[0].clientY;
        setTouchMove({ x: currentX, y: currentY });

        if (!swipeDirection) {
            const deltaX = Math.abs(currentX - touchStart.x);
            const deltaY = Math.abs(currentY - touchStart.y);

            if (deltaX > GESTURE_LOCK_THRESHOLD || deltaY > GESTURE_LOCK_THRESHOLD) {
                if (deltaX > deltaY) {
                    setSwipeDirection('horizontal');
                } else {
                    setSwipeDirection('vertical');
                }
            }
        }

        if (swipeDirection === 'horizontal') {
            e.preventDefault(); // Prevent vertical scroll when swiping horizontally
        }
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchMove || swipeDirection !== 'horizontal') {
            setTouchStart(null);
            setTouchMove(null);
            setSwipeDirection(null);
            return;
        }

        const distance = touchMove.x - touchStart.x;
        if (distance < -SWIPE_THRESHOLD) {
            goToNext();
        } else if (distance > SWIPE_THRESHOLD) {
            goToPrev();
        }
        
        setTouchStart(null);
        setTouchMove(null);
        setSwipeDirection(null);
    };
    
    if (isLoading && students.length === 0) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!isLoading && students.length === 0) {
        return <EmptyState title="No Students Found" message="Try adjusting your filters to find students." />;
    }

    const swipeDistance = touchStart && touchMove && swipeDirection === 'horizontal' ? touchMove.x - touchStart.x : 0;

    return (
        <div className="relative h-[calc(100dvh-12rem)] w-full overflow-hidden">
             {students.map((student, index) => {
                if (index < currentIndex) return null;
                const isCurrent = index === currentIndex;
                const isNext = index === currentIndex + 1;

                const transform = isCurrent 
                    ? `translateX(${swipeDistance}px)` 
                    : isNext 
                    ? 'scale(0.95) translateY(20px)' 
                    : 'scale(0.9) translateY(40px)';
                
                const zIndex = students.length - index;

                return (
                    <div
                        key={student.studentId}
                        ref={isCurrent ? cardRef : null}
                        className={`absolute inset-0 flex flex-col items-center justify-center p-2 transition-all duration-300 ease-in-out`}
                        style={{
                            transform,
                            zIndex,
                            opacity: isCurrent || isNext ? 1 : 0,
                            transition: touchStart ? 'none' : 'all 0.3s ease-out',
                        }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="w-full h-full max-w-sm mx-auto bg-white dark:bg-box-dark rounded-xl shadow-lg border border-stroke dark:border-strokedark flex flex-col p-6">
                            <div className="relative -mt-20">
                                {student.profilePhoto ? (
                                    <img src={student.profilePhoto} alt={`${student.firstName}`} className="w-32 h-32 rounded-full object-cover mx-auto shadow-md border-4 border-white dark:border-box-dark" />
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-gray-2 dark:bg-box-dark-2 flex items-center justify-center mx-auto shadow-md border-4 border-white dark:border-box-dark">
                                        <UserIcon className="w-16 h-16 text-gray-500 dark:text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <div className="text-center mt-4 flex-grow">
                                <h2 className="text-2xl font-bold text-black dark:text-white">{student.firstName} {student.lastName}</h2>
                                <p className="text-body-color dark:text-gray-300">{student.studentId}</p>
                                <div className="mt-4 flex justify-center gap-2">
                                    <Badge type={student.studentStatus} />
                                    <Badge type={student.sponsorshipStatus} />
                                </div>
                                <div className="mt-6 text-left grid grid-cols-2 gap-4 text-sm">
                                    <div><p className="text-body-color dark:text-gray-400">Age</p><p className="font-medium text-black dark:text-white">{calculateAge(student.dateOfBirth)}</p></div>
                                    <div><p className="text-body-color dark:text-gray-400">Gender</p><p className="font-medium text-black dark:text-white">{student.gender}</p></div>
                                    <div><p className="text-body-color dark:text-gray-400">Grade</p><p className="font-medium text-black dark:text-white">{student.currentGrade || 'N/A'}</p></div>
                                    <div><p className="text-body-color dark:text-gray-400">School</p><p className="font-medium text-black dark:text-white">{student.school || 'N/A'}</p></div>
                                </div>
                            </div>
                            <div className="mt-6">
                                <Button onClick={() => onViewProfile(student)} className="w-full">
                                    View Full Profile
                                </Button>
                            </div>
                        </div>
                    </div>
                );
             })}
            {currentIndex > 0 && (
                <button
                    onClick={goToPrev}
                    className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
                    aria-label="Previous student"
                >
                    <ChevronLeftIcon className="w-8 h-8" />
                </button>
            )}

            {currentIndex < students.length - 1 && (
                 <button
                    onClick={goToNext}
                    className="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
                    aria-label="Next student"
                >
                    <ChevronRightIcon className="w-8 h-8" />
                </button>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-body-color">
                <ChevronLeftIcon className="w-4 h-4" />
                <span>Swipe, Click, or use Arrow Keys</span>
                <ChevronRightIcon className="w-4 h-4" />
            </div>

             {isLoading && currentIndex > 0 && (
                <div className="absolute bottom-4 right-4 text-xs text-body-color">Loading...</div>
            )}
        </div>
    );
};

export default StudentSwipeView;