import React, { useState, useEffect, useRef, TouchEvent, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sponsor } from '@/types.ts';
import { formatDateForDisplay } from '@/utils/dateUtils.ts';
import Button from '@/components/ui/Button.tsx';
import { ChevronLeftIcon, ChevronRightIcon, SponsorIcon } from '@/components/Icons.tsx';
import EmptyState from '@/components/EmptyState.tsx';

interface SponsorSwipeViewProps {
    sponsors: Sponsor[];
    isLoading: boolean;
    loadMore: () => void;
    hasMore: boolean;
}

const SWIPE_THRESHOLD = 50; // Min pixels for a swipe to register

const SponsorSwipeView: React.FC<SponsorSwipeViewProps> = ({ sponsors, isLoading, loadMore, hasMore }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const cardRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const goToNext = useCallback(() => {
        if (currentIndex < sponsors.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    }, [currentIndex, sponsors.length]);

    const goToPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    useEffect(() => {
        if (sponsors.length > 0 && currentIndex >= sponsors.length - 3 && hasMore && !isLoading) {
            loadMore();
        }
    }, [currentIndex, sponsors.length, hasMore, isLoading, loadMore]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goToNext();
            else if (e.key === 'ArrowLeft') goToPrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToNext, goToPrev]);

    const handleTouchStart = (e: TouchEvent) => {
        setTouchEnd(0);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (touchStart === 0 || touchEnd === 0) return;
        const distance = touchStart - touchEnd;
        if (distance > SWIPE_THRESHOLD) goToNext();
        else if (distance < -SWIPE_THRESHOLD) goToPrev();
        setTouchStart(0);
        setTouchEnd(0);
    };

    if (isLoading && sponsors.length === 0) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!isLoading && sponsors.length === 0) {
        return <EmptyState title="No Sponsors Found" message="Add your first sponsor to get started." />;
    }

    const swipeDistance = touchEnd !== 0 ? touchEnd - touchStart : 0;

    return (
        <div className="relative h-[calc(100dvh-12rem)] w-full overflow-hidden">
            {sponsors.map((sponsor, index) => {
                if (index < currentIndex) return null;
                const isCurrent = index === currentIndex;
                const isNext = index === currentIndex + 1;
                const transform = isCurrent ? `translateX(${swipeDistance}px)` : isNext ? 'scale(0.95) translateY(20px)' : 'scale(0.9) translateY(40px)';
                const zIndex = sponsors.length - index;

                return (
                    <div
                        key={sponsor.id}
                        ref={isCurrent ? cardRef : null}
                        className="absolute inset-0 flex flex-col items-center justify-center p-2 transition-all duration-300 ease-in-out"
                        style={{ transform, zIndex, opacity: isCurrent || isNext ? 1 : 0, transition: touchEnd !== 0 ? 'none' : 'all 0.3s ease-out' }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="w-full h-full max-w-sm mx-auto bg-white dark:bg-box-dark rounded-xl shadow-lg border border-stroke dark:border-strokedark flex flex-col p-6">
                             <div className="relative -mt-16">
                                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto shadow-md border-4 border-white dark:border-box-dark">
                                    <SponsorIcon className="w-12 h-12 text-primary" />
                                </div>
                            </div>
                            <div className="text-center mt-4 flex-grow">
                                <h2 className="text-2xl font-bold text-black dark:text-white truncate">{sponsor.name}</h2>
                                <p className="text-body-color dark:text-gray-300 truncate">{sponsor.email}</p>
                                <div className="mt-6 text-left grid grid-cols-2 gap-4 text-sm">
                                    <div><p className="text-body-color dark:text-gray-400">Start Date</p><p className="font-medium text-black dark:text-white">{formatDateForDisplay(sponsor.sponsorshipStartDate)}</p></div>
                                    <div><p className="text-body-color dark:text-gray-400">Students</p><p className="font-medium text-black dark:text-white">{sponsor.sponsoredStudentCount}</p></div>
                                </div>
                            </div>
                            <div className="mt-6">
                                <Button onClick={() => navigate(`/sponsors/${sponsor.id}`)} className="w-full">
                                    View Details & Students
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            })}
            {currentIndex > 0 && <button onClick={goToPrev} className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full bg-black/20 text-white hover:bg-black/40" aria-label="Previous sponsor"><ChevronLeftIcon className="w-8 h-8" /></button>}
            {currentIndex < sponsors.length - 1 && <button onClick={goToNext} className="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full bg-black/20 text-white hover:bg-black/40" aria-label="Next sponsor"><ChevronRightIcon className="w-8 h-8" /></button>}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-body-color">
                <ChevronLeftIcon className="w-4 h-4" />
                <span>Swipe or use Keys</span>
                <ChevronRightIcon className="w-4 h-4" />
            </div>
            {isLoading && currentIndex > 0 && <div className="absolute bottom-4 right-4 text-xs text-body-color">Loading...</div>}
        </div>
    );
};

export default SponsorSwipeView;