import React from 'react';

interface StatsCardProps {
  total: number;
  ratNho: number;
  nho: number;
  hoiNho: number;
  deQuen: number;
  onStartReview?: () => void;
  onStatClick?: (level: string) => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  total,
  ratNho,
  nho,
  hoiNho,
  deQuen,
  onStartReview,
  onStatClick
}) => {
  // Format today's date as DD/MM/YYYY
  const getTodayDateString = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-5 mb-6">
      <div className="flex-shrink-0">
        <h2 className="text-xl font-bold text-text-charcoal mb-0.5">Tiến độ học tập</h2>
        <p className="text-text-muted text-xs font-medium">Hôm nay là {getTodayDateString()}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 flex-1 max-w-3xl">
        {/* Total */}
        <div 
          onClick={() => onStatClick?.('all')} 
          className={`bg-slate-50 hover:bg-slate-100/80 border border-slate-100 p-3 rounded-xl text-center transition-all col-span-2 sm:col-span-1 flex flex-col justify-center ${onStatClick ? 'cursor-pointer hover:shadow-xs' : ''}`}
        >
          <span className="text-xl font-extrabold text-text-charcoal tracking-tight">{total}</span>
          <span className="text-[11px] text-text-muted font-bold mt-1">Tổng số từ</span>
        </div>

        {/* Rất nhớ */}
        <div 
          onClick={() => onStatClick?.('Rất nhớ')}
          className={`bg-emerald-50/40 hover:bg-emerald-50 border border-emerald-100/50 p-3 rounded-xl text-center transition-all flex flex-col justify-center ${onStatClick ? 'cursor-pointer hover:shadow-xs' : ''}`}
        >
          <span className="text-xl font-extrabold text-emerald-600 tracking-tight">{ratNho}</span>
          <span className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center gap-1.5 justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            Rất nhớ
          </span>
        </div>

        {/* Nhớ */}
        <div 
          onClick={() => onStatClick?.('Nhớ')}
          className={`bg-sky-50/40 hover:bg-sky-50 border border-sky-100/50 p-3 rounded-xl text-center transition-all flex flex-col justify-center ${onStatClick ? 'cursor-pointer hover:shadow-xs' : ''}`}
        >
          <span className="text-xl font-extrabold text-sky-600 tracking-tight">{nho}</span>
          <span className="text-[11px] text-sky-700 font-bold mt-1 flex items-center gap-1.5 justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block"></span>
            Nhớ
          </span>
        </div>

        {/* Hơi nhớ */}
        <div 
          onClick={() => onStatClick?.('Hơi nhớ')}
          className={`bg-amber-50/40 hover:bg-amber-50 border border-amber-100/50 p-3 rounded-xl text-center transition-all flex flex-col justify-center ${onStatClick ? 'cursor-pointer hover:shadow-xs' : ''}`}
        >
          <span className="text-xl font-extrabold text-amber-600 tracking-tight">{hoiNho}</span>
          <span className="text-[11px] text-amber-700 font-bold mt-1 flex items-center gap-1.5 justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
            Hơi nhớ
          </span>
        </div>

        {/* Dễ quên */}
        <div 
          onClick={() => onStatClick?.('Dễ quên')}
          className={`bg-rose-50/40 hover:bg-rose-50 border border-rose-100/50 p-3 rounded-xl text-center transition-all flex flex-col justify-center ${onStatClick ? 'cursor-pointer hover:shadow-xs' : ''}`}
        >
          <span className="text-xl font-extrabold text-rose-600 tracking-tight">{deQuen}</span>
          <span className="text-[11px] text-rose-700 font-bold mt-1 flex items-center gap-1.5 justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
            Dễ quên
          </span>
        </div>
      </div>

      {onStartReview && total > 0 && (
        <button
          onClick={onStartReview}
          className="px-5 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl shadow-xs hover:shadow transition duration-200 text-xs uppercase tracking-wider whitespace-nowrap flex justify-center items-center cursor-pointer hover:scale-[1.01] active:scale-95"
        >
          Bắt đầu ôn tập
        </button>
      )}
    </div>
  );
};

export default StatsCard;
