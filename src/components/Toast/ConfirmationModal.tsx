import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import './ConfirmationModal.css';

export type ModalType = 'success' | 'error' | 'info' | 'warning';

interface ConfirmationModalProps {
  isOpen: boolean;
  message: string;
  type?: ModalType;
  onClose: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  title?: string;
}

// Define the ref type
export interface ModalContainerRef {
  openModal: (
    message: string,
    type?: ModalType,
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string,
    title?: string
  ) => void;
  closeModal: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  message,
  type = 'info',
  onClose,
  onConfirm,
  onCancel,
  confirmText = 'Sí',
  cancelText = 'No',
  title
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    handleClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    handleClose();
  };

  // Stop propagation for modal content clicks
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Early return if not open
  if (!isOpen) return null;

  return (
    <div 
      className={`confirmation-modal-overlay ${visible ? 'visible' : 'hidden'}`}
      onClick={handleClose} // Close when clicking overlay
    >
      <div 
        className={`confirmation-modal-content ${type}`}
        onClick={handleModalContentClick}
      >
        <div className="confirmation-modal-header">
          <div className="confirmation-modal-icon">
            {type === 'success' && <SuccessIcon />}
            {type === 'error' && <ErrorIcon />}
            {type === 'info' && <InfoIcon />}
            {type === 'warning' && <WarningIcon />}
          </div>
          <h3 className="confirmation-modal-title">{title || getDefaultTitle(type)}</h3>
          <button 
            className="confirmation-modal-close" 
            onClick={handleClose} 
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="confirmation-modal-body">
          <p className="confirmation-modal-message">{message}</p>
        </div>
        <div className="confirmation-modal-footer">
          <button 
            className="confirmation-modal-button confirmation-modal-cancel-button" 
            onClick={handleCancel}
            aria-label={cancelText}
          >
            {cancelText}
          </button>
          <button 
            className="confirmation-modal-button confirmation-modal-confirm-button" 
            onClick={handleConfirm}
            aria-label={confirmText}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to get default title based on type
function getDefaultTitle(type: ModalType): string {
  switch (type) {
    case 'success': return 'Completado';
    case 'error': return 'Error';
    case 'warning': return 'Advertencia';
    case 'info': 
    default: return 'Confirmación';
  }
}

// Modal Container component with ref
export const ModalContainer = forwardRef<ModalContainerRef, {}>(
  (_props, ref) => {
    const [modalState, setModalState] = useState({
      isOpen: false,
      message: '',
      type: 'info' as ModalType,
      onConfirm: undefined as (() => void) | undefined,
      onCancel: undefined as (() => void) | undefined,
      confirmText: 'Sí',
      cancelText: 'No',
      title: undefined as string | undefined,
    });

    const openModal = (
      message: string,
      type: ModalType = 'info',
      onConfirm?: () => void,
      onCancel?: () => void,
      confirmText: string = 'Sí',
      cancelText: string = 'No',
      title?: string
    ) => {
      setModalState({
        isOpen: true,
        message,
        type,
        onConfirm,
        onCancel,
        confirmText,
        cancelText,
        title,
      });
    };

    const closeModal = () => {
      setModalState((prev) => ({ ...prev, isOpen: false }));
    };

    // Exponer métodos a través del ref
    useImperativeHandle(ref, () => ({
      openModal,
      closeModal,
    }));

    return (
      <ConfirmationModal
        isOpen={modalState.isOpen}
        message={modalState.message}
        type={modalState.type}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        title={modalState.title}
      />
    );
  }
);

// Create singleton for easy access
const modalRef = React.createRef<ModalContainerRef>();

// Helper to ensure modal container exists
const getModalRef = (): ModalContainerRef => {
  if (!modalRef.current) {
    console.warn('Modal container not mounted. Make sure to add <ModalContainer ref={modalRef} /> to your app.');
    // Return dummy implementation
    return {
      openModal: () => {
        console.log('Modal not available');
      },
      closeModal: () => {}
    };
  }
  return modalRef.current;
};

// Simple API for using the modal
export const confirmModal = {
  success: (message: string, onConfirm?: () => void, onCancel?: () => void, confirmText?: string, cancelText?: string, title?: string) => {
    getModalRef().openModal(message, 'success', onConfirm, onCancel, confirmText, cancelText, title);
  },
  error: (message: string, onConfirm?: () => void, onCancel?: () => void, confirmText?: string, cancelText?: string, title?: string) => {
    getModalRef().openModal(message, 'error', onConfirm, onCancel, confirmText, cancelText, title);
  },
  info: (message: string, onConfirm?: () => void, onCancel?: () => void, confirmText?: string, cancelText?: string, title?: string) => {
    getModalRef().openModal(message, 'info', onConfirm, onCancel, confirmText, cancelText, title);
  },
  warning: (message: string, onConfirm?: () => void, onCancel?: () => void, confirmText?: string, cancelText?: string, title?: string) => {
    getModalRef().openModal(message, 'warning', onConfirm, onCancel, confirmText, cancelText, title);
  }
};

// Export ref for global access
export { modalRef };

// Icon components
const SuccessIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const ErrorIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

const WarningIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default ConfirmationModal;