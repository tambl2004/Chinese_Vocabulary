import React, { useState, useEffect } from 'react';
import { Volume2, X, Eye, ArrowRight, RotateCcw } from 'lucide-react';
import type { EnglishVocabulary } from '../utils/api';
import { speakEnglish } from '../utils/speech';
import { fetchTatoebaExample, type TatoebaExample } from '../utils/dictionary';

interface EnglishStudySessionProps {
  vocabularies: EnglishVocabulary[];
  onUpdateLevel: (id: number, level: EnglishVocabulary['memory_level']) => Promise<void>;
  onUpdateExample: (id: number, example: any) => Promise<void>;
  onClose: () => void;
}

export const EnglishStudySession: React.FC<EnglishStudySessionProps> = ({
  vocabularies,
  onUpdateLevel,
  onUpdateExample,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  const [example, setExample] = useState<TatoebaExample | null>(null);
  const [isLoadingExample, setIsLoadingExample] = useState(false);
  const [exampleError, setExampleError] = useState<string | null>(null);

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

  // Flip card (front <-> back) and pronounce word
  const handleCardFlip = () => {
    setShowAnswer((prev) => !prev);
    if (currentWord) {
      speakEnglish(currentWord.word);
    }
  };

  // Load/Reset example states when current word changes
  useEffect(() => {
    if (currentWord && currentWord.example) {
      setExample(currentWord.example);
    } else {
      setExample(null);
    }
    setExampleError(null);
    setIsLoadingExample(false);
  }, [currentIndex, currentWord]);

  const handleGenerateExample = async () => {
    if (!currentWord) return;
    try {
      setIsLoadingExample(true);
      setExampleError(null);
      const data = await fetchTatoebaExample(
        currentWord.word,
        'eng',
        currentWord.meaning,
        currentWord.word_type || '',
        example?.sentence
      );
      setExample(data);
      // Persist to database
      await onUpdateExample(currentWord.id, data);
    } catch (err: any) {
      console.error('Failed to generate example:', err);
      setExampleError(err.message || 'Có lỗi xảy ra khi lấy câu ví dụ.');
    } finally {
      setIsLoadingExample(false);
    }
  };

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
    <div className="fixed inset-0 bg-[#f7f9fb] z-50 flex flex-col justify-between overflow-y-auto">
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
            <div
              onClick={handleCardFlip}
              className="bg-gradient-to-br from-white via-white to-sky-50/20 rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.05)] border border-slate-100/90 w-full p-6 md:p-8 mb-5 flex flex-col items-center relative transition-all duration-300 min-h-[400px] justify-between cursor-pointer group active:scale-[0.995] overflow-hidden"
            >
              {/* Organic Waves Decorative Accent in Top-Left Corner (Mirrored) */}
              <div className="absolute -top-4 -left-4 w-48 h-48 pointer-events-none overflow-hidden rounded-tl-3xl opacity-80 z-0 rotate-180">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path
                    fill="rgba(224, 242, 254, 0.5)"
                    d="M0 200 C70 170, 110 130, 200 70 L200 200 Z"
                  />
                  <path
                    fill="rgba(186, 230, 253, 0.4)"
                    d="M30 200 C90 180, 130 110, 200 35 L200 200 Z"
                  />
                  <path
                    fill="rgba(56, 189, 248, 0.2)"
                    d="M70 200 C120 185, 150 95, 200 0 L200 200 Z"
                  />
                </svg>
              </div>

              {/* Organic Waves Decorative Accent in Bottom-Right Corner */}
              <div className="absolute -bottom-4 -right-4 w-60 h-60 pointer-events-none overflow-hidden rounded-br-3xl opacity-90 z-0">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <path
                    fill="rgba(224, 242, 254, 0.6)"
                    d="M0 200 C70 170, 110 130, 200 70 L200 200 Z"
                  />
                  <path
                    fill="rgba(186, 230, 253, 0.5)"
                    d="M30 200 C90 180, 130 110, 200 35 L200 200 Z"
                  />
                  <path
                    fill="rgba(56, 189, 248, 0.25)"
                    d="M70 200 C120 185, 150 95, 200 0 L200 200 Z"
                  />
                </svg>
              </div>

              {/* Card Header Row */}
              <div className="w-full flex items-center justify-between z-10 pt-1">
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100/80 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  THẺ {currentIndex + 1}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakEnglish(currentWord.word);
                  }}
                  title="Nghe phát âm"
                  className="p-2 text-[#0284c7] bg-sky-50 hover:bg-[#0284c7] hover:text-white rounded-full transition duration-200 cursor-pointer shadow-2xs"
                >
                  <Volume2 size={18} />
                </button>
              </div>

              {/* English Word Display */}
              <div className="flex-1 flex flex-col items-center justify-center py-6 z-10">
                <span className="text-5xl md:text-6xl font-bold text-[#0284c7] tracking-wide leading-none select-none text-center group-hover:scale-105 transition-transform duration-300">
                  {currentWord.word}
                </span>
                {!showAnswer && (
                  <p className="text-[11px] font-medium text-slate-400 mt-4 animate-pulse">
                    Chạm vào thẻ để lật xem đáp án
                  </p>
                )}
              </div>

              {/* Toggleable Details Panel */}
              <div className="w-full z-10 relative">
                {showAnswer ? (
                  <div className="w-full border-t border-slate-100 pt-5 animate-in fade-in slide-in-from-bottom-2 duration-200 text-center">
                    
                    {/* Ví dụ Section */}
                    <div className="w-full mb-4 text-center">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Ví dụ câu</span>
                      {example ? (
                        <div className="bg-sky-50/40 rounded-2xl p-4 border border-sky-100/80 text-center animate-in fade-in duration-200">
                          <p className="font-sans text-lg text-[#0284c7] font-bold mb-1.5 select-all">
                            {example.sentence}
                          </p>
                          <p className="text-sm text-text-charcoal font-semibold select-all mb-2">
                            {example.translation}
                          </p>
                          <div className="flex justify-center mt-2 border-t border-sky-200/40 pt-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateExample();
                              }}
                              disabled={isLoadingExample}
                              className="px-3 py-1 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-600 hover:text-slate-800 rounded-lg text-[10px] font-bold transition duration-150 cursor-pointer inline-flex items-center gap-1 border border-slate-200/80 shadow-2xs"
                            >
                              {isLoadingExample ? (
                                <>
                                  <span className="animate-spin rounded-full h-2.5 w-2.5 border-2 border-slate-500 border-t-transparent" />
                                  Đang tạo lại...
                                </>
                              ) : (
                                'Tạo lại ví dụ'
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateExample();
                            }}
                            disabled={isLoadingExample}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold transition duration-150 cursor-pointer inline-flex items-center gap-1.5 shadow-2xs border border-slate-200/60"
                          >
                            {isLoadingExample ? (
                              <>
                                <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-600 border-t-transparent" />
                                Đang tạo...
                              </>
                            ) : (
                              'Tạo ví dụ tự động'
                            )}
                          </button>
                          {exampleError && (
                            <p className="text-xs text-status-red-text bg-status-red-bg border border-red-200/30 px-3 py-1.5 rounded-md mt-2">
                              {exampleError}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Details Cards Grid */}
                    <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 items-start">
                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-center min-h-[58px] flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Phiên âm</span>
                        <span className="text-xs md:text-sm font-bold text-[#0284c7] font-mono block leading-tight break-words">{currentWord.transliteration}</span>
                      </div>
                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-center min-h-[58px] flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Nghĩa</span>
                        <span className="text-xs md:text-sm font-bold text-emerald-700 block leading-tight break-words">{currentWord.meaning}</span>
                      </div>
                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-center min-h-[58px] flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Từ loại</span>
                        <span className="text-xs md:text-sm font-bold text-slate-600 block lowercase leading-tight break-words">{currentWord.word_type || '---'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardFlip();
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#0369a1] hover:to-[#0284c7] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-98"
                  >
                    <Eye size={15} />
                    Xem đáp án
                  </button>
                )}
              </div>
            </div>

            {/* Answer Control Action Buttons */}
            {showAnswer && (
              <div className="w-full grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
                <button
                  onClick={() => handleUpdate('Dễ quên')}
                  disabled={isUpdating}
                  className="py-3 px-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-700 font-bold text-xs rounded-xl shadow-2xs hover:shadow-xs transition-all duration-150 active:scale-95 cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span>Dễ quên</span>
                </button>
                <button
                  onClick={() => handleUpdate('Hơi nhớ')}
                  disabled={isUpdating}
                  className="py-3 px-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-700 font-bold text-xs rounded-xl shadow-2xs hover:shadow-xs transition-all duration-150 active:scale-95 cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                  <span>Hơi nhớ</span>
                </button>
                <button
                  onClick={() => handleUpdate('Nhớ')}
                  disabled={isUpdating}
                  className="py-3 px-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 text-sky-700 font-bold text-xs rounded-xl shadow-2xs hover:shadow-xs transition-all duration-150 active:scale-95 cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1"
                >
                  <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
                  <span>Nhớ</span>
                </button>
                <button
                  onClick={() => handleUpdate('Rất nhớ')}
                  disabled={isUpdating}
                  className="py-3 px-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-700 font-bold text-xs rounded-xl shadow-2xs hover:shadow-xs transition-all duration-150 active:scale-95 cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>Rất nhớ</span>
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
