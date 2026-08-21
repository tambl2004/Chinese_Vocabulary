import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xóa',
  cancelText = 'Hủy'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-card shadow-lg max-w-sm w-full border border-slate-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header content */}
        <div className="p-6 pb-4 flex items-start gap-4">
          <div className="p-2.5 bg-status-red-bg text-status-red-text rounded-full flex-shrink-0">
            <AlertTriangle size={20} className="stroke-[2.5px]" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-text-charcoal">{title}</h3>
            <p className="text-xs text-text-muted mt-1.5 leading-relaxed">{message}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition flex-shrink-0 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-text-muted hover:text-text-charcoal hover:bg-slate-100 rounded border border-slate-200 transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-bold text-white bg-[#dc2626] hover:bg-[#b91c1c] rounded shadow-xs transition hover:shadow-sm cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
