import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose?: () => void;
}

// Define the ref type
export interface ToastContainerRef {
  addToast: (message: string, type?: ToastType) => string;
  removeToast: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose 
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        onClose && onClose();
      }, 300); // Wait for fade-out animation before calling onClose
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose && onClose();
    }, 300);
  };

  return (
    <div className={`toast ${type} ${visible ? 'visible' : 'hidden'}`}>
      <div className="toast-icon">
        {type === 'success' && <SuccessIcon />}
        {type === 'error' && <ErrorIcon />}
        {type === 'info' && <InfoIcon />}
        {type === 'warning' && <WarningIcon />}
      </div>
      <p className="toast-message">{message}</p>
      <button className="toast-close" onClick={handleClose} aria-label="Close">
        <CloseIcon />
      </button>
    </div>
  );
};

// Toast Container component to manage multiple toasts - using forwardRef
export const ToastContainer = forwardRef<ToastContainerRef, { position?: string }>(
  ({ position = 'bottom-right' }, ref) => {
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);

    const addToast = (message: string, type: ToastType = 'info') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts(prev => [...prev, { id, message, type }]);
      return id;
    };

    const removeToast = (id: string) => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    // Properly expose methods through the ref
    useImperativeHandle(ref, () => ({
      addToast,
      removeToast,
    }));

    return (
      <div className={`toast-container ${position}`}>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    );
  }
);

// Create a singleton instance with a real implementation
const toastRef = React.createRef<ToastContainerRef>();

// Helper to ensure we have a toast container
const getToastRef = (): ToastContainerRef => {
  if (!toastRef.current) {
    console.warn('Toast container not mounted. Make sure to add <ToastContainer ref={toastRef} /> to your app.');
    // Return dummy implementation to prevent errors
    return {
      addToast: (message) => { 
        console.log('Toast not available:', message); 
        return ''; 
      },
      removeToast: () => {}
    };
  }
  return toastRef.current;
};

// Expose a simple API
export const toast = {
  success: (message: string) => {
    return { id: getToastRef().addToast(message, 'success') };
  },
  error: (message: string) => {
    return { id: getToastRef().addToast(message, 'error') };
  },
  info: (message: string) => {
    return { id: getToastRef().addToast(message, 'info') };
  },
  warning: (message: string) => {
    return { id: getToastRef().addToast(message, 'warning') };
  }
};

// Export the ref for global access
export { toastRef };

// Icon components
const SuccessIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const ErrorIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

const WarningIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default Toast;