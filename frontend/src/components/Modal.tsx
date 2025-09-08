import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CloseIcon } from './Icons.tsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    if (!isOpen) {
        return null;
    }

    return ReactDOM.createPortal(
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="relative w-full max-w-4xl mx-auto my-6 bg-white dark:bg-box-dark rounded-lg shadow-xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between p-5 border-b border-stroke dark:border-strokedark rounded-t">
                    <h3 className="text-xl font-semibold text-black dark:text-white">{title}</h3>
                    <button onClick={onClose} className="p-1 ml-auto text-black dark:text-white hover:opacity-75">
                        <CloseIcon />
                    </button>
                </div>
                <div className="relative p-6 flex-auto max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;