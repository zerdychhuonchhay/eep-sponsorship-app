import React, { useState } from 'react';
import { useNotification } from '@/contexts/NotificationContext.tsx';
import { api } from '@/services/api.ts';
import { DocumentType, Sponsorship } from '@/types.ts';
import Modal from '@/components/Modal.tsx';
import Button from '@/components/ui/Button.tsx';
import { FormInput } from '@/components/forms/FormControls.tsx';

interface DocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    docType: DocumentType;
    sponsorship?: Sponsorship; // Optional, for sponsorship contracts
    onUploadSuccess: () => void;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ isOpen, onClose, studentId, docType, sponsorship, onUploadSuccess }) => {
    const { showToast } = useNotification();
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const ALLOWED_FILE_TYPES = [ 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', ];
    const ALLOWED_EXTENSIONS_STRING = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp';

    const getTitle = () => {
        if (docType === DocumentType.BIRTH_CERTIFICATE) {
            return 'Upload Birth Certificate';
        }
        if (docType === DocumentType.SPONSORSHIP_CONTRACT && sponsorship) {
            return `Upload Contract for ${sponsorship.sponsorName}`;
        }
        return 'Upload Document';
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                showToast('Invalid file type. Please upload a PDF, Word, or image file.', 'error');
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            showToast('Please select a file to upload.', 'error');
            return;
        }
        setIsUploading(true);
        try {
            // Step 1: Upload the document file
            await api.addStudentDocument(studentId, docType, selectedFile);

            // Step 2: Update the related boolean flag for checklist status
            if (docType === DocumentType.BIRTH_CERTIFICATE) {
                await api.updateStudent({ studentId, hasBirthCertificate: true });
            } else if (docType === DocumentType.SPONSORSHIP_CONTRACT && sponsorship) {
                await api.updateSponsorship(sponsorship.id, { hasSponsorshipContract: true });
            }

            showToast(`${getTitle()} uploaded successfully.`, 'success');
            onUploadSuccess(); // This will trigger a data refresh in the parent
            onClose();
        } catch (error: any) {
            showToast(error.message || `Failed to upload document.`, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} size="md">
            <div className="space-y-4">
                 <FormInput
                    label="Select File"
                    id="doc-upload-modal-input"
                    type="file"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    accept={ALLOWED_EXTENSIONS_STRING}
                />
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" onClick={onClose} disabled={isUploading}>Cancel</Button>
                    <Button onClick={handleUpload} isLoading={isUploading} disabled={!selectedFile}>
                        Upload
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default DocumentUploadModal;