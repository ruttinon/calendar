import React, { useEffect, useRef } from 'react';

/**
 * InputModal - replaces browser prompt() with a beautiful custom dialog.
 * 
 * Props:
 *  isOpen      boolean
 *  title       string
 *  subtitle    string (optional)
 *  placeholder string
 *  defaultValue string
 *  confirmLabel string  (default 'Confirm')
 *  cancelLabel  string  (default 'Cancel')
 *  icon        ReactNode (optional lucide icon)
 *  onConfirm   (value: string) => void
 *  onCancel    () => void
 */
const InputModal = ({
    isOpen,
    title,
    subtitle,
    placeholder = '',
    defaultValue = '',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    icon,
    onConfirm,
    onCancel,
}) => {
    const [value, setValueState] = React.useState(defaultValue);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setValueState(defaultValue);
            // Focus input after animation
            setTimeout(() => inputRef.current?.focus(), 80);
        }
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (value.trim()) onConfirm(value.trim());
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleConfirm();
        if (e.key === 'Escape') onCancel();
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                {icon && <div className="modal-icon">{icon}</div>}
                <div className="modal-title">{title}</div>
                {subtitle && <div className="modal-subtitle">{subtitle}</div>}
                <input
                    ref={inputRef}
                    className="modal-input"
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={e => setValueState(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="modal-actions">
                    <button className="modal-btn-cancel" onClick={onCancel}>{cancelLabel}</button>
                    <button className="modal-btn-confirm" onClick={handleConfirm}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
};

export default InputModal;