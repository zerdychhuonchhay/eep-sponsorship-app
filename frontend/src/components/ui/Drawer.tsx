import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { CSSTransition } from 'react-transition-group';
import { CloseIcon } from '../Icons.tsx';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children }) => {
    const drawerRef = useRef(null);
    const overlayRef = useRef(null);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    return ReactDOM.createPortal(
        <>
            <CSSTransition
                nodeRef={overlayRef}
                in={isOpen}
                timeout={300}
                classNames="overlay-fade"
                unmountOnExit
            >
                <div
                    ref={overlayRef}
                    className="fixed inset-0 z-50 bg-black bg-opacity-50"
                    onClick={onClose}
                    aria-hidden="true"
                />
            </CSSTransition>
            <CSSTransition
                nodeRef={drawerRef}
                in={isOpen}
                timeout={300}
                classNames="drawer"
                unmountOnExit
            >
                <div
                    ref={drawerRef}
                    className="fixed top-0 right-0 z-[60] h-[100dvh] w-full max-w-md bg-white dark:bg-box-dark shadow-xl flex flex-col"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="drawer-title"
                >
                    <div className="flex items-start justify-between p-5 border-b border-stroke dark:border-strokedark">
                        {title && <h3 id="drawer-title" className="text-xl font-semibold text-black dark:text-white">{title}</h3>}
                        <button onClick={onClose} className="p-1 ml-auto text-black dark:text-white hover:opacity-75">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="relative p-6 flex-auto overflow-y-auto">
                        {children}
                    </div>
                </div>
            </CSSTransition>
        </>,
        document.body
    );
};

export default Drawer;
