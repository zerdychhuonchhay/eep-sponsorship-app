import React, { useState, useEffect, TouchEvent, useCallback } from 'react';
import { AppUser, UserStatus, User } from '@/types.ts';
import { formatDateForDisplay } from '@/utils/dateUtils.ts';
import { ChevronLeftIcon, ChevronRightIcon, UserIcon, TrashIcon, KeyIcon } from '@/components/Icons.tsx';
import EmptyState from '@/components/EmptyState.tsx';
import Badge from '@/components/ui/Badge.tsx';
import ActionDropdown, { ActionItem } from '@/components/ActionDropdown.tsx';

interface UserSwipeViewProps {
    users: AppUser[];
    isLoading: boolean;
    loadMore: () => void;
    hasMore: boolean;
    onEditUser: (user: AppUser) => void;
    onDeleteUser: (user: AppUser) => void;
    onSendPasswordReset: (user: AppUser) => void;
    currentUser: User | null;
    canUpdate: boolean;
    canDelete: boolean;
}

const SWIPE_THRESHOLD = 50;

const UserSwipeView: React.FC<UserSwipeViewProps> = ({ users, isLoading, loadMore, hasMore, onEditUser, onDeleteUser, onSendPasswordReset, currentUser, canUpdate, canDelete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const goToNext = useCallback(() => {
        if (currentIndex < users.length - 1) setCurrentIndex(prev => prev + 1);
    }, [currentIndex, users.length]);

    const goToPrev = useCallback(() => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    }, [currentIndex]);

    useEffect(() => {
        if (users.length > 0 && currentIndex >= users.length - 3 && hasMore && !isLoading) {
            loadMore();
        }
    }, [currentIndex, users.length, hasMore, isLoading, loadMore]);

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

    const handleTouchMove = (e: TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);

    const handleTouchEnd = () => {
        if (touchStart === 0 || touchEnd === 0) return;
        const distance = touchStart - touchEnd;
        if (distance > SWIPE_THRESHOLD) goToNext();
        else if (distance < -SWIPE_THRESHOLD) goToPrev();
        setTouchStart(0);
        setTouchEnd(0);
    };

    if (isLoading && users.length === 0) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!isLoading && users.length === 0) {
        return <EmptyState title="No Users Found" />;
    }

    const swipeDistance = touchEnd !== 0 ? touchEnd - touchStart : 0;

    return (
        <div className="relative h-[calc(100dvh-8rem)] w-full overflow-hidden">
            {users.map((user, index) => {
                if (index < currentIndex) return null;
                const isCurrent = index === currentIndex;
                const isNext = index === currentIndex + 1;
                const transform = isCurrent ? `translateX(${swipeDistance}px)` : isNext ? 'scale(0.95) translateY(20px)' : 'scale(0.9) translateY(40px)';
                const zIndex = users.length - index;

                const isCurrentUser = currentUser?.id === user.id;
                const actionItems: ActionItem[] = [];
                if (canUpdate) actionItems.push({ label: 'Edit', icon: <UserIcon className="w-4 h-4" />, onClick: () => onEditUser(user) });
                if (canUpdate && user.status === UserStatus.ACTIVE && !isCurrentUser) actionItems.push({ label: 'Send Password Set', icon: <KeyIcon className="w-4 h-4" />, onClick: () => onSendPasswordReset(user) });
                if (!isCurrentUser && canDelete) actionItems.push({ label: 'Delete', icon: <TrashIcon className="w-4 h-4" />, onClick: () => onDeleteUser(user), className: 'text-danger' });

                return (
                    <div
                        key={user.id}
                        className="absolute inset-0 flex flex-col items-center justify-center p-2 transition-all duration-300 ease-in-out"
                        style={{ transform, zIndex, opacity: isCurrent || isNext ? 1 : 0, transition: touchEnd !== 0 ? 'none' : 'all 0.3s ease-out' }}
                        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
                    >
                        <div className="w-full h-full max-w-sm mx-auto bg-white dark:bg-box-dark rounded-xl shadow-lg border border-stroke dark:border-strokedark flex flex-col p-6 relative">
                            {actionItems.length > 0 && <div className="absolute top-4 right-4 z-10"><ActionDropdown items={actionItems} /></div>}
                            <div className="relative -mt-16">
                                <div className="w-24 h-24 rounded-full bg-gray-2 dark:bg-box-dark-2 flex items-center justify-center mx-auto shadow-md border-4 border-white dark:border-box-dark">
                                    <UserIcon className="w-12 h-12 text-gray-500" />
                                </div>
                            </div>
                            <div className="text-center mt-4 flex-grow">
                                <h2 className="text-2xl font-bold text-black dark:text-white truncate">{user.username}</h2>
                                <p className="text-body-color dark:text-gray-300 truncate">{user.email}</p>
                                <div className="mt-4 flex justify-center gap-2">
                                    <Badge type={user.role} />
                                    <Badge type={user.status} />
                                </div>
                                <div className="mt-6 text-left text-sm">
                                    <p className="text-body-color dark:text-gray-400">Last Login</p>
                                    <p className="font-medium text-black dark:text-white">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
            {currentIndex > 0 && <button onClick={goToPrev} className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full bg-black/20 text-white hover:bg-black/40" aria-label="Previous user"><ChevronLeftIcon className="w-8 h-8" /></button>}
            {currentIndex < users.length - 1 && <button onClick={goToNext} className="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full bg-black/20 text-white hover:bg-black/40" aria-label="Next user"><ChevronRightIcon className="w-8 h-8" /></button>}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-body-color">
                <ChevronLeftIcon className="w-4 h-4" /><span>Swipe or use Keys</span><ChevronRightIcon className="w-4 h-4" />
            </div>
            {isLoading && currentIndex > 0 && <div className="absolute bottom-4 right-4 text-xs text-body-color">Loading...</div>}
        </div>
    );
};

export default UserSwipeView;