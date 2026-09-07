import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Plus, Edit2, Trash2, BookOpen, Check, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Session } from '../utils/api';

interface SessionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  selectedSessionId: number | 'all';
  onSelectSession: (id: number | 'all') => void;
  onAddSession: (name: string) => Promise<void>;
  onEditSession: (id: number, newName: string) => Promise<void>;
  onDeleteSession: (id: number) => Promise<void>;
  totalWordsCount: number;
}

const ITEMS_PER_PAGE = 9;

export const SessionPickerModal: React.FC<SessionPickerModalProps> = ({
  isOpen,
  onClose,
  sessions,
  selectedSessionId,
  onSelectSession,
  onAddSession,
  onEditSession,
  onDeleteSession,
  totalWordsCount
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered sessions based on search
  const filteredSessions = useMemo(() => {
    if (!searchTerm.trim()) return sessions;
    const term = searchTerm.toLowerCase().trim();
    return sessions.filter((s) => s.name.toLowerCase().includes(term));
  }, [sessions, searchTerm]);

  // Reset page when search term or sessions count changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sessions.length]);

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedSessions = useMemo(() => {
    const start = (validCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredSessions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSessions, validCurrentPage]);

  if (!isOpen) return null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    try {
      setIsSubmitting(true);
      await onAddSession(newSessionName.trim());
      setNewSessionName('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent, id: number) => {
    e.preventDefault();
    if (!editingName.trim()) return;
    try {
      setIsSubmitting(true);
      await onEditSession(id, editingName.trim());
      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (id: number) => {
    try {
      setIsSubmitting(true);
      await onDeleteSession(id);
      setDeletingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Card - Expanded size for 2-3 column grid */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-xs">
              <BookOpen size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-charcoal leading-snug">
                Danh sách Buổi học
              </h3>
              <p className="text-xs text-text-muted">
                Tổng cộng {sessions.length} buổi học • Tìm kiếm, quản lý & chọn buổi học
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên buổi học (vd: Buổi 1, Con vật, 26/08)..."
                className="w-full pl-10 pr-9 py-2.5 text-sm text-text-charcoal bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {!isAdding && (
              <button
                onClick={() => {
                  setIsAdding(true);
                  setNewSessionName('');
                }}
                className="px-4 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap active:scale-95"
              >
                <Plus size={16} />
                Thêm buổi mới
              </button>
            )}
          </div>

          {/* Inline Add Session Form */}
          {isAdding && (
            <form onSubmit={handleCreateSubmit} className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl animate-in fade-in duration-150">
              <div className="text-xs font-bold text-emerald-800 mb-2">Tạo buổi học mới</div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="Nhập tên buổi (vd: Buổi 1: Con vật)"
                  className="flex-1 px-3.5 py-2 text-sm bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  autoFocus
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer transition"
                >
                  {isSubmitting ? '...' : 'Lưu buổi'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-lg cursor-pointer transition"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sessions Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-[320px]">
          {/* Featured Option: Tất cả các buổi (Full width banner card) */}
          {!searchTerm && (
            <div
              onClick={() => {
                onSelectSession('all');
                onClose();
              }}
              className={`p-3.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition duration-150 shadow-2xs ${
                selectedSessionId === 'all'
                  ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
                  : 'bg-slate-50/70 border-slate-300 hover:border-emerald-500/60 hover:bg-white hover:shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                  selectedSessionId === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-300'
                }`}>
                  <Layers size={18} />
                </div>
                <div>
                  <span className={`text-sm font-bold block ${selectedSessionId === 'all' ? 'text-emerald-900' : 'text-text-charcoal'}`}>Tất cả các buổi</span>
                  <p className="text-xs text-text-muted">Hiển thị và làm bài tập cho toàn bộ từ vựng đã lưu</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-white text-slate-700 border border-slate-300 shadow-2xs">
                  {totalWordsCount} từ
                </span>
                {selectedSessionId === 'all' && (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grid Layout for Sessions: 1 col on mobile, 2 cols on sm, 3 cols on md/lg */}
          {paginatedSessions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {paginatedSessions.map((session) => {
                const isSelected = selectedSessionId === session.id;
                const isEditing = editingId === session.id;
                const isDeleting = deletingId === session.id;

                if (isDeleting) {
                  return (
                    <div key={session.id} className="p-3 rounded-xl border border-red-200 bg-red-50/80 flex flex-col justify-between h-full min-h-[90px] animate-in fade-in duration-150">
                      <span className="text-xs font-semibold text-red-800 line-clamp-2">
                        Xóa buổi <strong>"{session.name}"</strong>?
                      </span>
                      <div className="flex items-center justify-end gap-1.5 mt-2">
                        <button
                          onClick={() => handleDeleteConfirm(session.id)}
                          disabled={isSubmitting}
                          className="px-2.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-md cursor-pointer"
                        >
                          Xóa
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-md cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  );
                }

                if (isEditing) {
                  return (
                    <form
                      key={session.id}
                      onSubmit={(e) => handleEditSubmit(e, session.id)}
                      className="p-3 rounded-xl border border-amber-300 bg-amber-50/70 flex flex-col justify-between min-h-[90px] animate-in fade-in duration-150 gap-2"
                    >
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                        autoFocus
                        required
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-2.5 py-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-md cursor-pointer"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-md cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div
                    key={session.id}
                    onClick={() => {
                      onSelectSession(session.id);
                      onClose();
                    }}
                    className={`p-3.5 rounded-xl border-2 flex flex-col justify-between gap-3 group transition duration-150 cursor-pointer relative shadow-2xs ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
                        : 'bg-slate-50/70 border-slate-300 hover:border-emerald-500/60 hover:bg-white hover:shadow-xs'
                    }`}
                  >
                    {/* Top Row: Session Title & Selection status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSelected ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                        <span className={`text-sm font-semibold truncate ${isSelected ? 'text-emerald-900 font-bold' : 'text-slate-800'}`} title={session.name}>
                          {session.name}
                        </span>
                      </div>
                      
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check size={12} className="stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Word Count Badge & Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                      <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                        session.word_count && session.word_count > 0
                          ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300'
                          : 'bg-slate-200/70 text-slate-500 border-slate-300'
                      }`}>
                        {session.word_count || 0} từ
                      </span>

                      {/* Explicit Text Edit & Delete Buttons */}
                      <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(session.id);
                            setEditingName(session.name);
                          }}
                          className="px-2 py-0.5 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 rounded-md transition cursor-pointer flex items-center gap-1"
                          title="Đổi tên buổi"
                        >
                          <Edit2 size={11} />
                          Sửa
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(session.id);
                          }}
                          className="px-2 py-0.5 text-[11px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-300/80 rounded-md transition cursor-pointer flex items-center gap-1"
                          title="Xóa buổi"
                        >
                          <Trash2 size={11} />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              {searchTerm ? (
                <>Không tìm thấy buổi học nào phù hợp với từ khóa "<strong>{searchTerm}</strong>"</>
              ) : (
                'Chưa có buổi học nào. Nhấp vào "+ Thêm buổi mới" ở trên để tạo buổi học đầu tiên.'
              )}
            </div>
          )}
        </div>

        {/* Footer with Pagination Controls */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            {filteredSessions.length > 0 ? (
              <>Hiển thị {paginatedSessions.length} / {filteredSessions.length} buổi học</>
            ) : (
              <>0 buổi học</>
            )}
          </div>

          {/* Pagination buttons if totalPages > 1 */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={validCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-2 text-xs font-semibold text-slate-700">
                {validCurrentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={validCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition cursor-pointer"
                title="Trang sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-lg transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionPickerModal;

