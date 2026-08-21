import React, { useState } from 'react';
import { Volume2, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { EnglishVocabulary } from '../utils/api';
import { speakEnglish } from '../utils/speech';

interface EnglishVocabularyTableProps {
  vocabularies: EnglishVocabulary[];
  onEdit: (word: EnglishVocabulary) => void;
  onDelete: (id: number) => void;
}

export const EnglishVocabularyTable: React.FC<EnglishVocabularyTableProps> = ({
  vocabularies,
  onEdit,
  onDelete
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination logic
  const totalItems = vocabularies.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = vocabularies.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getStatusBadge = (level: EnglishVocabulary['memory_level']) => {
    switch (level) {
      case 'Rất nhớ':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 rounded-full border border-emerald-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Rất nhớ
          </span>
        );
      case 'Nhớ':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-status-green-text bg-status-green-bg rounded-full border border-teal-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00685f]"></span>
            Nhớ
          </span>
        );
      case 'Hơi nhớ':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-status-yellow-text bg-status-yellow-bg rounded-full border border-amber-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Hơi nhớ
          </span>
        );
      case 'Dễ quên':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-status-red-text bg-status-red-bg rounded-full border border-red-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            Dễ quên
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-card shadow-soft border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="py-4 px-6 text-xs font-semibold text-text-muted w-16">#</th>
              <th className="py-4 px-6 text-xs font-semibold text-text-muted">Words (Từ vựng)</th>
              <th className="py-4 px-6 text-xs font-semibold text-text-muted">Transliteration (Phiên âm)</th>
              <th className="py-4 px-6 text-xs font-semibold text-text-muted">Loại từ</th>
              <th className="py-4 px-6 text-xs font-semibold text-text-muted">Means (Nghĩa)</th>
              <th className="py-4 px-6 text-xs font-semibold text-text-muted">Mức nhớ</th>
              <th className="py-4 px-6 text-xs font-semibold text-text-muted text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedItems.length > 0 ? (
              paginatedItems.map((word, index) => (
                <tr
                  key={word.id}
                  className="hover:bg-slate-50 transition-colors duration-150 group"
                >
                  <td className="py-3 px-6 text-sm text-text-muted">
                    {startIndex + index + 1}
                  </td>
                  <td className="py-3 px-6 text-base font-bold text-text-charcoal tracking-wide">
                    {word.word}
                  </td>
                  <td className="py-3 px-6 text-sm text-slate-500 font-mono">
                    {word.transliteration}
                  </td>
                  <td className="py-3 px-6 text-xs font-semibold">
                    <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {word.word_type || 'Danh từ'}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-sm text-text-charcoal font-medium">
                    {word.meaning}
                  </td>
                  <td className="py-3 px-6">
                    {getStatusBadge(word.memory_level)}
                  </td>
                  <td className="py-3 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => speakEnglish(word.word)}
                        title="Phát âm"
                        className="p-1.5 text-primary bg-primary/10 hover:bg-primary/20 rounded transition duration-150 cursor-pointer"
                      >
                        <Volume2 size={16} />
                      </button>
                      <button
                        onClick={() => onEdit(word)}
                        title="Chỉnh sửa"
                        className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded transition duration-150 cursor-pointer"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(word.id)}
                        title="Xóa"
                        className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded transition duration-150 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-text-muted">
                  Không tìm thấy từ vựng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50/30 border-t border-slate-100 gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-xs text-text-muted">
              Hiển thị từ <span className="font-semibold text-text-charcoal">{startIndex + 1}</span> đến{' '}
              <span className="font-semibold text-text-charcoal">
                {Math.min(startIndex + itemsPerPage, totalItems)}
              </span>{' '}
              trong tổng số <span className="font-semibold text-text-charcoal">{totalItems}</span> từ
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <span className="text-xs text-text-muted">Số hàng mỗi trang:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-xs text-text-charcoal bg-white border border-slate-200 rounded shadow-xs focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-1.5 rounded transition ${currentPage === 1
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-text-muted hover:bg-slate-100 hover:text-text-charcoal'
                  }`}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition ${currentPage === page
                    ? 'bg-primary text-white'
                    : 'text-text-muted hover:bg-slate-100 hover:text-text-charcoal'
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-1.5 rounded transition ${currentPage === totalPages
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-text-muted hover:bg-slate-100 hover:text-text-charcoal'
                  }`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default EnglishVocabularyTable;
