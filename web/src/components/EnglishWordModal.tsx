import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { EnglishVocabulary, EnglishVocabularyInput } from '../utils/api';
import { lookupEnglishWord } from '../utils/dictionary';

interface EnglishWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (word: Partial<EnglishVocabularyInput>) => Promise<void>;
  editingWord: EnglishVocabulary | null;
}

export const EnglishWordModal: React.FC<EnglishWordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingWord
}) => {
  const [word, setWord] = useState('');
  const [transliteration, setTransliteration] = useState('');
  const [meaning, setMeaning] = useState('');
  const [memoryLevel, setMemoryLevel] = useState<'Chưa nhớ' | 'Đang nhớ' | 'Đã nhớ' | 'Rất nhớ'>('Chưa nhớ');
  const [studyDate, setStudyDate] = useState('');
  const [wordType, setWordType] = useState('Danh từ');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const autoFillDetails = async (w: string) => {
    if (!w.trim()) return;
    try {
      const data = await lookupEnglishWord(w);
      if (data.transliteration) setTransliteration(data.transliteration);
      if (data.meaning) setMeaning(data.meaning);
    } catch (err) {
      console.error('Failed to look up English word details:', err);
    }
  };

  const handleWordChange = async (val: string) => {
    setWord(val);
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const data = await lookupEnglishWord(val);
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }

      // If exact match exists, autofill immediately
      if (data.transliteration && data.word.toLowerCase() === val.trim().toLowerCase()) {
        setTransliteration(data.transliteration);
        setMeaning(data.meaning);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  const handleSelectSuggestion = (candidate: any) => {
    setWord(candidate.word);
    setTransliteration(candidate.transliteration);
    setMeaning(candidate.meaning);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    if (editingWord) {
      setWord(editingWord.word);
      setTransliteration(editingWord.transliteration);
      setMeaning(editingWord.meaning);
      setWordType(editingWord.word_type || 'Danh từ');
      setMemoryLevel(editingWord.memory_level);
      setStudyDate(editingWord.study_date || new Date().toISOString().split('T')[0]);
    } else {
      setWord('');
      setTransliteration('');
      setMeaning('');
      setWordType('Danh từ');
      setMemoryLevel('Chưa nhớ');
      setStudyDate(new Date().toISOString().split('T')[0]);
    }
    setError('');
    setSuggestions([]);
    setShowSuggestions(false);
  }, [editingWord, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !transliteration.trim() || !meaning.trim()) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        word: word.trim(),
        transliteration: transliteration.trim(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Dialog */}
      <div className="relative bg-white rounded-card shadow-soft-lg w-full max-w-lg border border-slate-100 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-text-charcoal">
            {editingWord ? 'Chỉnh sửa từ vựng tiếng Anh' : 'Thêm từ vựng tiếng Anh mới'}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition cursor-pointer"
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
              <label htmlFor="word" className="block text-xs font-semibold text-text-muted mb-1.5">
                Từ vựng (Word) <span className="text-red-500">*</span>
              </label>
              <input
                id="word"
                type="text"
                value={word}
                onChange={(e) => handleWordChange(e.target.value)}
                onBlur={() => {
                  setTimeout(() => {
                    setShowSuggestions(false);
                    autoFillDetails(word);
                  }, 250);
                }}
                placeholder="Ví dụ: Language"
                className="w-full px-3.5 py-2 text-sm text-text-charcoal bg-slate-50/50 border border-slate-200 rounded font-medium"
                required
                autoComplete="off"
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-48 overflow-y-auto z-50 divide-y divide-slate-100 animate-in fade-in duration-100">
                  {suggestions.map((cand, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(cand)}
                      className="w-full text-left px-4 py-2.5 text-xs text-text-charcoal hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer font-sans"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-primary">{cand.word}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">{cand.transliteration}</span>
                      </div>
                      <span className="text-xs text-text-muted font-medium italic">{cand.meaning}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="transliteration" className="block text-xs font-semibold text-text-muted mb-1.5">
                  Phiên âm (Transliteration) <span className="text-red-500">*</span>
                </label>
                <input
                  id="transliteration"
                  type="text"
                  value={transliteration}
                  onChange={(e) => setTransliteration(e.target.value)}
                  placeholder="Ví dụ: /ˈlæŋɡwɪdʒ/"
                  className="w-full px-3.5 py-2 text-sm text-text-charcoal bg-slate-50/50 border border-slate-200 rounded font-mono"
                  required
                />
              </div>

              <div>
                <label htmlFor="wordType" className="block text-xs font-semibold text-text-muted mb-1.5">
                  Loại từ
                </label>
                <select
                  id="wordType"
                  value={wordType}
                  onChange={(e) => setWordType(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm text-text-charcoal bg-slate-50/50 border border-slate-200 rounded cursor-pointer"
                >
                  <option value="Danh từ">Danh từ</option>
                  <option value="Động từ">Động từ</option>
                  <option value="Tính từ">Tính từ</option>
                  <option value="Khác">Khác</option>
                </select>
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
                placeholder="Ví dụ: Ngôn ngữ"
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
                  className="w-full px-3.5 py-2 text-sm text-text-charcoal bg-slate-50/50 border border-slate-200 rounded cursor-pointer"
                >
                  <option value="Chưa nhớ">Chưa nhớ</option>
                  <option value="Đang nhớ">Đang nhớ</option>
                  <option value="Đã nhớ">Đã nhớ</option>
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
                  className="w-full px-3.5 py-2 text-sm text-text-charcoal bg-slate-50/50 border border-slate-200 rounded cursor-pointer"
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
              className="px-5 py-2 text-sm font-semibold text-text-muted hover:text-text-charcoal hover:bg-slate-50 rounded transition duration-200 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded shadow-sm transition duration-200 flex items-center justify-center min-w-[80px] cursor-pointer"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default EnglishWordModal;
