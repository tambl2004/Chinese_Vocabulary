import React, { useState, useEffect } from 'react';
import { Volume2, X, Eye, ArrowRight, RotateCcw } from 'lucide-react';
import type { EnglishVocabulary } from '../utils/api';
import { speakEnglish } from '../utils/speech';

interface EnglishStudySessionProps {
  vocabularies: EnglishVocabulary[];
  onUpdateLevel: (id: number, level: EnglishVocabulary['memory_level']) => Promise<void>;
  onClose: () => void;
}

export const EnglishStudySession: React.FC<EnglishStudySessionProps> = ({
  vocabularies,
  onUpdateLevel,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  const currentWord = vocabularies[currentIndex];
  const progressPercent = vocabularies.length > 0
    ? Math.round((currentIndex / vocabularies.length) * 100)
    : 0;

  // Speak word when it loads
  useEffect(() => {
    if (currentWord && !hasCompleted) {
      speakEnglish(currentWord.word);
      setShowAnswer(false);
    }
  }, [currentIndex, hasCompleted]);

  if (vocabularies.length === 0) {
    return (
      <div className="fixed inset-0 bg-[#f7f9fb] z-50 flex flex-col justify-center items-center p-6">
        <div className="bg-white rounded-card shadow-soft p-8 max-w-md w-full text-center border border-slate-100 animate-in zoom-in-95 duration-200">
          <p className="text-text-muted mb-4">Không có từ vựng nào khả dụng để ôn tập.</p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded font-medium transition cursor-pointer"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const handleUpdate = async (level: EnglishVocabulary['memory_level']) => {
    if (isUpdating || !currentWord) return;
    try {
      setIsUpdating(true);
      await onUpdateLevel(currentWord.id, level);

      if (currentIndex + 1 < vocabularies.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setHasCompleted(true);
      }
    } catch (error) {
      console.error('Failed to update memory level:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setHasCompleted(false);
    setShowAnswer(false);
  };

  return (
    <div className="fixed inset-0 bg-[#f7f9fb] z-50 flex flex-col justify-between">
      {/* Top Progress bar and Header */}
      <div className="w-full">
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${hasCompleted ? 100 : progressPercent}%` }}
          />
        </div>

        {/* Header toolbar */}
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex justify-between items-center">
          {hasCompleted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-status-green-text bg-status-green-bg rounded-full border border-teal-200">
              Hoàn thành
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-primary bg-primary/10 rounded-full border border-primary/20">
              Đang học: từ <span className="text-primary-dark font-extrabold">{currentIndex + 1}</span> / <span className="text-primary-dark font-extrabold">{vocabularies.length}</span>
            </span>
          )}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-status-red-text bg-status-red-bg hover:bg-status-red-bg/85 border border-red-200/40 rounded transition duration-200 shadow-xs cursor-pointer"
          >
            <X size={14} className="stroke-[2.5px]" />
            Đóng phiên
          </button>
        </div>
      </div>

      {/* Main Review Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        {hasCompleted ? (
          // Completion screen
          <div className="bg-white rounded-card shadow-soft border border-slate-100 max-w-md w-full p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4 text-primary">
              <ArrowRight size={28} className="rotate-[-45deg]" />
            </div>
            <h3 className="text-xl font-bold text-text-charcoal mb-2">Hoàn thành phiên ôn tập!</h3>
            <p className="text-sm text-text-muted mb-6">
              Bạn đã ôn tập xong tất cả {vocabularies.length} từ tiếng Anh trong danh sách này.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRestart}
                className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded font-semibold shadow-sm transition duration-200 text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw size={16} />
                Luyện tập lại
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 text-text-charcoal hover:bg-slate-50 border border-slate-200 rounded font-semibold transition duration-200 text-sm cursor-pointer"
              >
                Quay lại trang chính
              </button>
            </div>
          </div>
        ) : (
          // Active review card
          <div className="flex flex-col items-center max-w-lg w-full">
            {/* Study Card */}
            <div className="bg-white rounded-card shadow-soft border border-slate-100 w-full p-8 md:p-10 mb-6 flex flex-col items-center relative transition-all duration-300 min-h-[380px] justify-between">

              {/* Pronunciation Button */}
              <button
                onClick={() => speakEnglish(currentWord.word)}
                title="Nghe phát âm"
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-primary hover:bg-teal-50 rounded-full transition duration-150 cursor-pointer"
              >
                <Volume2 size={20} />
              </button>

              {/* English Word */}
              <div className="flex-1 flex items-center justify-center py-6">
                <span className="text-5xl md:text-6xl font-bold text-primary tracking-wide leading-none select-all text-center">
                  {currentWord.word}
                </span>
              </div>

              {/* Toggleable Details Panel */}
              <div className="w-full">
                {showAnswer ? (
                  <div className="w-full border-t border-slate-100 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-200 text-center">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">Phiên âm</span>
                        <span className="text-sm md:text-base font-bold text-slate-600 font-mono">{currentWord.transliteration}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">Nghĩa</span>
                        <span className="text-sm md:text-base font-bold text-text-charcoal">{currentWord.meaning}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-1">Từ loại</span>
                        <span className="text-sm md:text-base font-bold text-text-charcoal lowercase">{currentWord.word_type || '---'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold uppercase tracking-wider transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow hover:scale-[1.01] transform"
                  >
                    <Eye size={14} />
                    Xem đáp án
                  </button>
                )}
              </div>
            </div>

            {/* Answer Control Action Buttons */}
            {showAnswer && (
              <div className="w-full grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
                <button
                  onClick={() => handleUpdate('Chưa nhớ')}
                  disabled={isUpdating}
                  className="py-3 px-1.5 bg-status-red-bg border border-red-200 text-status-red-text font-bold text-[11px] rounded-lg hover:shadow-sm transition-all duration-150 hover:scale-[1.01] cursor-pointer"
                >
                  Chưa nhớ
                </button>
                <button
                  onClick={() => handleUpdate('Đang nhớ')}
                  disabled={isUpdating}
                  className="py-3 px-1.5 bg-status-yellow-bg border border-amber-200 text-status-yellow-text font-bold text-[11px] rounded-lg hover:shadow-sm transition-all duration-150 hover:scale-[1.01] cursor-pointer"
                >
                  Đang nhớ
                </button>
                <button
                  onClick={() => handleUpdate('Đã nhớ')}
                  disabled={isUpdating}
                  className="py-3 px-1.5 bg-status-green-bg border border-teal-200 text-status-green-text font-bold text-[11px] rounded-lg hover:shadow-sm transition-all duration-150 hover:scale-[1.01] cursor-pointer"
                >
                  Đã nhớ
                </button>
                <button
                  onClick={() => handleUpdate('Rất nhớ')}
                  disabled={isUpdating}
                  className="py-3 px-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px] rounded-lg hover:shadow-sm transition-all duration-150 hover:scale-[1.01] cursor-pointer"
                >
                  Rất nhớ
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer spacer */}
      <div className="py-6 text-center text-xs text-text-muted select-none">
        Mẹo: Sử dụng nút nghe phát âm góc trên bên phải của thẻ từ vựng
      </div>
    </div>
  );
};
export default EnglishStudySession;
