import React from 'react';

interface StatsCardProps {
  total: number;
  daNho: number;
  dangNho: number;
  chuaNho: number;
  onStartReview?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  total,
  daNho,
  dangNho,
  chuaNho,
  onStartReview
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
    <div className="bg-white rounded-card shadow-soft border border-slate-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
      <div>
        <h2 className="text-2xl font-bold text-text-charcoal mb-1">Tiến độ học tập</h2>
        <p className="text-text-muted text-sm font-medium">Hôm nay là {getTodayDateString()}</p>
      </div>

      <div className="flex flex-wrap md:flex-nowrap items-center gap-6 md:gap-8 w-full md:w-auto divide-x divide-slate-100">
        <div className="flex flex-col items-center justify-center min-w-[100px] text-center">
          <span className="text-3xl font-bold text-text-charcoal tracking-tight">{total}</span>
          <span className="text-xs text-text-muted font-medium mt-1">Tổng số từ</span>
        </div>

        <div className="flex flex-col items-center justify-center min-w-[100px] text-center pl-6 md:pl-8">
          <span className="text-3xl font-bold text-status-green-text tracking-tight">{daNho}</span>
          <span className="text-xs text-text-muted font-medium mt-1 flex items-center gap-1.5 justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
            Đã nhớ
          </span>
        </div>

        <div className="flex flex-col items-center justify-center min-w-[100px] text-center pl-6 md:pl-8">
          <span className="text-3xl font-bold text-status-yellow-text tracking-tight">{dangNho}</span>
          <span className="text-xs text-text-muted font-medium mt-1 flex items-center gap-1.5 justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-status-yellow-text inline-block"></span>
            Đang nhớ
          </span>
        </div>

        <div className="flex flex-col items-center justify-center min-w-[100px] text-center pl-6 md:pl-8">
          <span className="text-3xl font-bold text-status-red-text tracking-tight">{chuaNho}</span>
          <span className="text-xs text-text-muted font-medium mt-1 flex items-center gap-1.5 justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-status-red-text inline-block"></span>
            Chưa nhớ
          </span>
        </div>
      </div>

      {onStartReview && total > 0 && (
        <button
          onClick={onStartReview}
          className="w-full md:w-auto px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded shadow-sm transition duration-200 text-sm whitespace-nowrap self-stretch md:self-auto flex justify-center items-center"
        >
          Bắt đầu ôn tập
        </button>
      )}
    </div>
  );
};
export default StatsCard;
