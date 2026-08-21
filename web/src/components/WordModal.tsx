import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Vocabulary, VocabularyInput } from '../utils/api';
import { lookupChineseWord } from '../utils/dictionary';

interface WordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (word: Partial<VocabularyInput>) => Promise<void>;
  editingWord: Vocabulary | null;
}

export const WordModal: React.FC<WordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingWord
}) => {
  const [chinese, setChinese] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [hanViet, setHanViet] = useState('');
  const [meaning, setMeaning] = useState('');
  const [memoryLevel, setMemoryLevel] = useState<'Dễ quên' | 'Hơi nhớ' | 'Nhớ' | 'Rất nhớ'>('Dễ quên');
  const [studyDate, setStudyDate] = useState('');
  const [wordType, setWordType] = useState('Danh từ');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');


  // Auto-fill details using Backend Lookup API
  const autoFillDetails = async (word: string) => {
    if (!word.trim()) return;
    
    // Check if contains Chinese characters
    const hasChinese = /[\u4e00-\u9fa5]/.test(word);
    if (!hasChinese) return;

    try {
      const data = await lookupChineseWord(word);
      if (data.pinyin) setPinyin(data.pinyin);
      if (data.han_viet) setHanViet(data.han_viet);
      if (data.meaning) setMeaning(data.meaning);
      if (data.word_type) setWordType(data.word_type);
    } catch (err) {
      console.error('Failed to look up word details:', err);
    }
  };

  const handleChineseChange = async (val: string) => {
    setChinese(val);
    if (val.trim() && /[\u4e00-\u9fa5]/.test(val)) {
      autoFillDetails(val);
    }
  };

  useEffect(() => {
    if (editingWord) {
      setChinese(editingWord.chinese);
      setPinyin(editingWord.pinyin);
      setHanViet(editingWord.han_viet);
      setMeaning(editingWord.meaning);
      setWordType(editingWord.word_type || 'Danh từ');
      setMemoryLevel(editingWord.memory_level);
      setStudyDate(editingWord.study_date || new Date().toISOString().split('T')[0]);
    } else {
      setChinese('');
      setPinyin('');
      setHanViet('');
      setMeaning('');
      setWordType('Danh từ');
      setMemoryLevel('Dễ quên');
      setStudyDate(new Date().toISOString().split('T')[0]);
    }
    setError('');
  }, [editingWord, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chinese.trim() || !pinyin.trim() || !hanViet.trim() || !meaning.trim()) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        chinese: chinese.trim(),
        pinyin: pinyin.trim(),
        han_viet: hanViet.trim(),
        meaning: meaning.trim(),
        word_type: wordType,
        memory_level: memoryLevel,
        study_date: studyDate || null
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi lưu từ vựng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Dialog */}
      <div className="relative bg-white rounded-card shadow-soft-lg w-full max-w-lg border border-slate-100 overflow-hidden z-10 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-text-charcoal">
            {editingWord ? 'Chỉnh sửa từ vựng' : 'Thêm từ vựng mới'}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-xs font-medium text-red-600 border border-red-100 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="chinese" className="block text-xs font-semibold text-text-muted mb-1.5">
                Chữ Hán (中文) <span className="text-red-500">*</span>
              </label>
              <input
                id="chinese"
                type="text"
                value={chinese}
                onChange={(e) => handleChineseChange(e.target.value)}
                onBlur={() => autoFillDetails(chinese)}
                placeholder="Ví dụ: 城里"
                className="w-full px-3.5 py-2 text-sm text-text-charcoal bg-slate-50/50 border border-slate-200 rounded font-chinese"
                required
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1.5fr] gap-3">
              <div>
                <label htmlFor="pinyin" className="block text-xs font-semibold text-text-muted mb-1.5">
                  Phiên âm (Pinyin) <span className="text-red-500">*</span>
                </label>
                <input
                  id="pinyin"
                  type="text"
                  value={pinyin}
                  onChange={(e) => setPinyin(e.target.value)}
                  placeholder="Ví dụ: chéng lǐ"
                  className="w-full px-3.5 py-2 text-sm text-text-charcoal bg-slate-50/50 border border-slate-200 rounded"
                  required
                />
              </div>

              <div>
                <label htmlFor="hanViet" className="block text-xs font-semibold text-text-muted mb-1.5">
                  Hán Việt <span className="text-red-500">*</span>
                </label>
                <input
                  id="hanViet"
                  type="text"
                  value={hanViet}
                  onChange={(e) => setHanViet(e.target.value)}
                  placeholder="Ví dụ: thành lý"
                  className="w-full px-3.5 py-2 text-sm text-text-charcoal bg-slate-50/50 border border-slate-200 rounded"
                  required
                />
              </div>

              <div>
                <label htmlFor="wordType" className="block text-xs font-semibold text-text-muted mb-1.5">
                  Loại từ
                </label>
                <input
                  id="wordType"
                  type="text"
                  value={wordType}
                  onChange={(e) => setWordType(e.target.value)}
                  placeholder="Ví dụ: Danh từ, Động từ..."
                  className="w-full px-3.5 py-2 text-sm text-text-charcoal bg-slate-50/50 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="meaning" className="block text-xs font-semibold text-text-muted mb-1.5">
                Nghĩa (Tiếng Việt) <span className="text-red-500">*</span>
              </label>
              <input
                id="meaning"
                type="text"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder="Ví dụ: trong thành phố"
                className="w-full px-3.5 py-2 text-sm text-text-charcoal bg-slate-50/50 border border-slate-200 rounded"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="memoryLevel" className="block text-xs font-semibold text-text-muted mb-1.5">
                  Mức nhớ
                </label>
                <select
                  id="memoryLevel"
                  value={memoryLevel}
                  onChange={(e) => setMemoryLevel(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-sm text-text-charcoal bg-slate-50/50 border border-slate-200 rounded"
                >
                  <option value="Dễ quên">Dễ quên</option>
                  <option value="Hơi nhớ">Hơi nhớ</option>
                  <option value="Nhớ">Nhớ</option>
                  <option value="Rất nhớ">Rất nhớ</option>
                </select>
              </div>

              <div>
                <label htmlFor="studyDate" className="block text-xs font-semibold text-text-muted mb-1.5">
                  Ngày học
                </label>
                <input
                  id="studyDate"
                  type="date"
                  value={studyDate}
                  onChange={(e) => setStudyDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm text-text-charcoal bg-slate-50/50 border border-slate-200 rounded"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-text-muted hover:text-text-charcoal hover:bg-slate-50 rounded transition duration-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded shadow-sm transition duration-200 flex items-center justify-center min-w-[80px]"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default WordModal;
