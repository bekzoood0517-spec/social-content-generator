import React, { createContext, useContext, useState, useCallback } from 'react';

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => {
      setMessage(null);
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            backgroundColor: 'var(--ink)',
            color: 'var(--paper)',
            padding: '8px 14px',
            borderRadius: '2px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8125rem',
            zIndex: 9999,
            boxShadow: '2px 2px 0 var(--rule)',
          }}
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
};
