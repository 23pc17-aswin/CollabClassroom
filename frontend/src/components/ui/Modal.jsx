import { useEffect, useRef } from 'react';

/**
 * Controlled modal with ESC key and backdrop-click closing.
 * Props: isOpen, onClose, title, children, footer
 */
export default function Modal({ isOpen, onClose, title, children, footer }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-[#162133] border border-[#1e3a5f] rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1e3a5f]">
          <h2 className="text-white font-bold text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>

        {/* Optional footer */}
        {footer && (
          <div className="flex justify-end gap-3 p-6 pt-0 border-t border-[#1e3a5f]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
