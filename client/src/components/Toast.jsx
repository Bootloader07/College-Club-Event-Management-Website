import { useEffect } from 'react';

/**
 * Toast notification — bottom-right, auto-dismisses in 3s.
 * Props: message (string), type ('success'|'error'), onClose (fn)
 */
export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const id = setTimeout(onClose, 3000);
    return () => clearTimeout(id);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="polite">
      <span className="toast-message">{message}</span>
      <button
        className="toast-close"
        onClick={onClose}
        aria-label="Dismiss notification"
        type="button"
      >
        ✕
      </button>
    </div>
  );
}
