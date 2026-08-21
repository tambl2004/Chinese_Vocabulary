import React from 'react';
import { X, ListOrdered, BarChart2, Shuffle } from 'lucide-react';

interface StudyOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: 'sequential' | 'memory' | 'random') => void;
}

const StudyOptionsModal: React.FC<StudyOptionsModalProps> = ({ isOpen, onClose, onSelectOption }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-text-charcoal">Tùy chọn ôn tập</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-md transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-3">
          <button
            onClick={() => onSelectOption('sequential')}
            className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-primary hover:bg-primary/5 transition text-left group"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center text-slate-500 group-hover:text-primary transition">
              <ListOrdered size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-text-charcoal">Ôn lần lượt</h4>
              <p className="text-xs text-text-muted mt-1">Học theo danh sách từ trên xuống dưới.</p>
            </div>
          </button>

          <button
            onClick={() => onSelectOption('memory')}
            className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-primary hover:bg-primary/5 transition text-left group"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center text-slate-500 group-hover:text-primary transition">
              <BarChart2 size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-text-charcoal">Ôn theo mức độ</h4>
              <p className="text-xs text-text-muted mt-1">Ưu tiên từ "Dễ quên" đến "Rất nhớ".</p>
            </div>
          </button>

          <button
            onClick={() => onSelectOption('random')}
            className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-primary hover:bg-primary/5 transition text-left group"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center text-slate-500 group-hover:text-primary transition">
              <Shuffle size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-text-charcoal">Ôn ngẫu nhiên</h4>
              <p className="text-xs text-text-muted mt-1">Trộn ngẫu nhiên các từ trong danh sách.</p>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};

export default StudyOptionsModal;
