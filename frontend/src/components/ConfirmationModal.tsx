import React from 'react';
import Modal from './Modal.tsx';
import Button from './ui/Button.tsx';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    isConfirming?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    isConfirming = false,
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="text-black dark:text-white">
                <p>{message}</p>
                <div className="flex justify-end space-x-2 pt-6">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isConfirming}>
                        Cancel
                    </Button>
                    <Button type="button" variant="danger" onClick={onConfirm} isLoading={isConfirming}>
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;