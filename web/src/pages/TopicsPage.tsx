import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, BookOpen, LogOut, Layers, AlertCircle, X, Sparkles } from 'lucide-react';
import { fetchTopics, addTopic, updateTopic, deleteTopic, type Topic } from '../utils/api';

export const TopicsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active language type: 'chinese' | 'english'
  const activeType = (searchParams.get('type') as 'chinese' | 'english') || 'chinese';

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');

  // Edit modal state
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editTopicName, setEditTopicName] = useState('');

  // Delete modal state
  const [deletingTopic, setDeletingTopic] = useState<Topic | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Check auth guard
  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'user') {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
  }, [navigate]);

  // Load topics for active type
  const loadTopicsList = async (userId: string, type: 'chinese' | 'english') => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const list = await fetchTopics(userId, type);
      setTopics(list);
    } catch (err: any) {
      console.error('Error fetching topics:', err);
      setErrorMsg('Không thể tải danh sách chủ đề. Vui lòng kiểm tra kết nối.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadTopicsList(currentUser.id, activeType);
    }
  }, [currentUser, activeType]);

  const handleLanguageChange = (type: 'chinese' | 'english') => {
    setSearchParams({ type });
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const handleSelectTopic = (topic: Topic) => {
    if (topic.type === 'chinese') {
      navigate(`/china?topicId=${topic.id}`);
    } else {
      navigate(`/english?topicId=${topic.id}`);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    try {
      setIsSubmitting(true);
      await addTopic(newTopicName.trim(), activeType);
      setNewTopicName('');
      setIsAddModalOpen(false);
      if (currentUser) {
        await loadTopicsList(currentUser.id, activeType);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Tạo chủ đề thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic || !editTopicName.trim()) return;

    try {
      setIsSubmitting(true);
      await updateTopic(editingTopic.id, editTopicName.trim());
      setEditingTopic(null);
      if (currentUser) {
        await loadTopicsList(currentUser.id, activeType);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Đổi tên chủ đề thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTopic = async () => {
    if (!deletingTopic) return;

    try {
      setIsSubmitting(true);
      await deleteTopic(deletingTopic.id);
      setDeletingTopic(null);
      if (currentUser) {
        await loadTopicsList(currentUser.id, activeType);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Xóa chủ đề thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTopics = useMemo(() => {
    if (!searchTerm.trim()) return topics;
    const q = searchTerm.toLowerCase().trim();
    return topics.filter((t) => t.name.toLowerCase().includes(q));
  }, [topics, searchTerm]);

  const isChinese = activeType === 'chinese';
  const themeColorClass = isChinese ? 'bg-[#1e5347]' : 'bg-[#0284c7]';
  const themeTextClass = isChinese ? 'text-[#1e5347]' : 'text-[#0284c7]';
  const themeHoverClass = isChinese ? 'hover:bg-[#163e35]' : 'hover:bg-[#0369a1]';

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col justify-between p-3 sm:p-6 md:p-8 relative overflow-x-hidden font-sans"
      style={{ backgroundImage: "url('/images/Chinese_BG_26.jpg')" }}
    >
      {/* Background Overlay for contrast and readability */}
      <div className="absolute inset-0  pointer-events-none" />

      {/* Background Decorative Blur Blobs (similar to Login screen vibe) */}
      <div className="absolute top-5 left-5 w-80 h-80 sm:w-96 sm:h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-5 right-5 w-80 h-80 sm:w-96 sm:h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navbar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 mb-3 sm:mb-8">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <img src="/images/logo-china.png" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-xs" />
          <span className="text-xl font-extrabold text-slate-800 tracking-tight hidden xs:inline">Học Từ Vựng</span>
        </div>

        {/* Center Tabs: Tiếng Trung & Tiếng Anh */}
        <div className="flex items-center bg-white p-0.5 sm:p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => handleLanguageChange('chinese')}
            className={`px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-xl transition duration-200 cursor-pointer ${isChinese
              ? 'bg-[#1e5347] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            Tiếng Trung
          </button>
          <button
            onClick={() => handleLanguageChange('english')}
            className={`px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition duration-200 cursor-pointer ${!isChinese
              ? 'bg-[#0284c7] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            Tiếng Anh
          </button>
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-bold text-slate-800">{currentUser?.username || 'Học viên'}</div>
            <div className="text-[10px] text-slate-400 font-medium">Đã đăng nhập</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 sm:p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer bg-white border border-slate-200 shadow-2xs"
            title="Đăng xuất"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main Full-Screen Hero & Topics Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-start sm:justify-center z-10 py-1 sm:py-2">
        {/* Header Title Section */}
        <div className="text-center mb-3 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs text-[11px] sm:text-xs font-bold mb-1.5 sm:mb-3">
            <Sparkles size={13} className={themeTextClass} />
            <span className="text-slate-700">Chọn chủ đề bạn muốn học hôm nay</span>
          </div>
          <h1 className="text-xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Chủ đề <span className={themeTextClass}>{isChinese ? 'Tiếng Trung' : 'Tiếng Anh'}</span>
          </h1>
        </div>

        {/* Action Bar: Search & Add Topic button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 mb-4 sm:mb-6 bg-white p-2 sm:p-3 rounded-2xl border border-slate-200/80 shadow-soft-sm">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm chủ đề..."
              className="w-full pl-10 pr-8 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-300 outline-none transition"
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

          <button
            onClick={() => {
              setNewTopicName('');
              setIsAddModalOpen(true);
            }}
            className={`w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white rounded-xl shadow-md transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${themeColorClass} ${themeHoverClass}`}
          >
            <Plus size={20} className="stroke-[2.5]" />
            <span>Thêm chủ đề mới</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2 shadow-xs">
            <AlertCircle className="text-rose-500 shrink-0" size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Topics Grid Display */}
        {isLoading ? (
          <div className="py-16 text-center">
            <div className={`w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3`} />
            <p className="text-xs text-slate-400 font-semibold">Đang tải danh sách chủ đề...</p>
          </div>
        ) : filteredTopics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => handleSelectTopic(topic)}
                className="group relative bg-white border-2 border-slate-200 hover:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[160px] overflow-hidden"
              >
                {/* Decorative circle accent on bottom right (Card 1 design) */}
                <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-slate-100/80 group-hover:bg-slate-200/80 transition duration-300 pointer-events-none" />

                {/* Top Section: Topic Name & Word Count Badge */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-lg sm:text-xl font-extrabold text-slate-800 group-hover:text-slate-900 tracking-tight line-clamp-2">
                      {topic.name}
                    </span>
                    <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-slate-100 border border-slate-200 text-slate-700 shrink-0 shadow-2xs">
                      {topic.word_count || 0} từ
                    </span>
                  </div>
                </div>

                {/* Bottom Section: Action Text & Edit/Delete buttons over circle */}
                <div className="flex items-center justify-between mt-6 pt-3.5 border-t border-slate-100/80 relative z-10">
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-800 transition flex items-center gap-1.5">
                    <BookOpen size={14} />
                    <span>Học từ vựng</span>
                  </span>

                  {/* Actions: Edit & Delete buttons */}
                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTopic(topic);
                        setEditTopicName(topic.name);
                      }}
                      className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50/80 rounded-xl transition cursor-pointer"
                      title="Sửa tên chủ đề"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingTopic(topic);
                      }}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50/80 rounded-xl transition cursor-pointer"
                      title="Xóa chủ đề"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto my-6 shadow-xs">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Layers size={32} />
            </div>
            <h3 className="text-base font-extrabold text-slate-800 mb-1">Chưa có chủ đề nào</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {searchTerm
                ? `Không tìm thấy chủ đề phù hợp với từ khóa "${searchTerm}"`
                : 'Nhấp vào nút bên dưới để tạo chủ đề học tập đầu tiên của bạn.'}
            </p>
            <button
              onClick={() => {
                setNewTopicName('');
                setIsAddModalOpen(true);
              }}
              className={`px-6 py-3 text-xs sm:text-sm font-extrabold text-white rounded-xl shadow-md transition cursor-pointer inline-flex items-center gap-2 ${themeColorClass} ${themeHoverClass}`}
            >
              <Plus size={18} />
              <span>Thêm chủ đề mới</span>
            </button>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="w-full max-w-5xl mx-auto text-center z-10 pt-4 pb-2">
        <p className="text-[11px] text-slate-400 font-medium">
          Hệ thống Học Từ Vựng Thông Minh
        </p>
      </footer>

      {/* Modal 1: Add Topic */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-slate-800">Thêm chủ đề mới ({isChinese ? 'Tiếng Trung' : 'Tiếng Anh'})</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tên chủ đề mới</label>
                <input
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="Nhập tên chủ đề (ví dụ: HSK5, HSK6, Boya, Lấy gốc)..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-300 outline-none"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl cursor-pointer ${themeColorClass} ${themeHoverClass}`}
                >
                  {isSubmitting ? 'Đang lưu...' : 'Tạo chủ đề'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Topic */}
      {editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setEditingTopic(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-slate-800">Sửa tên chủ đề</h3>
              <button onClick={() => setEditingTopic(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tên chủ đề mới</label>
                <input
                  type="text"
                  value={editTopicName}
                  onChange={(e) => setEditTopicName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-300 outline-none"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTopic(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl cursor-pointer"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Delete Topic Confirmation */}
      {deletingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setDeletingTopic(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-extrabold text-slate-800 mb-2">Xóa chủ đề "{deletingTopic.name}"?</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa chủ đề này không? Các từ vựng thuộc chủ đề này sẽ được giữ lại trong hệ thống.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingTopic(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteTopic}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer"
              >
                {isSubmitting ? 'Đang xóa...' : 'Xóa chủ đề'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicsPage;
