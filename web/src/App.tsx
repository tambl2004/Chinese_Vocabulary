import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, User, CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import {
  fetchVocabularies,
  fetchStats,
  fetchDates,
  addVocabulary,
  updateVocabulary,
  deleteVocabulary,
  type Vocabulary
} from './utils/api';
import StatsCard from './components/StatsCard';
import VocabularyTable from './components/VocabularyTable';
import WordModal from './components/WordModal';
import StudySession from './components/StudySession';
import ConfirmModal from './components/ConfirmModal';

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function App() {
  const todayString = getLocalDateString();
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [stats, setStats] = useState({ total: 0, da_nho: 0, dang_nho: 0, chua_nho: 0 });
  const [studyDates, setStudyDates] = useState<string[]>([]);

  const [globalSearch, setGlobalSearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(todayString);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Vocabulary | null>(null);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [studyVocabularies, setStudyVocabularies] = useState<Vocabulary[]>([]);

  // Toast notifications state
  interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Custom Delete Confirm Modal state
  const [deleteWordId, setDeleteWordId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Load all data from API
  const loadData = async () => {
    try {
      // Fetch stats
      const statsData = await fetchStats();
      setStats(statsData);

      // Fetch unique study dates
      const datesData = await fetchDates();
      setStudyDates(datesData);

      // Fetch vocabularies with current active query parameters (globalSearch, date filter)
      const params: any = {};
      if (globalSearch.trim()) params.search = globalSearch;
      if (selectedDate !== 'all') params.study_date = selectedDate;

      const vocabData = await fetchVocabularies(params);
      setVocabularies(vocabData);
    } catch (error) {
      console.error('Error loading application data:', error);
    }
  };

  // Reload data whenever filters change
  useEffect(() => {
    loadData();
  }, [globalSearch, selectedDate]);

  // Client-side local filtering based on "Filter table..." input
  const filteredVocabularies = useMemo(() => {
    if (!tableSearch.trim()) return vocabularies;
    const query = tableSearch.toLowerCase().trim();
    return vocabularies.filter(
      (word) =>
        word.chinese.toLowerCase().includes(query) ||
        word.pinyin.toLowerCase().includes(query) ||
        word.han_viet.toLowerCase().includes(query) ||
        word.meaning.toLowerCase().includes(query)
    );
  }, [vocabularies, tableSearch]);

  const handleOpenAddModal = () => {
    setEditingWord(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (word: Vocabulary) => {
    setEditingWord(word);
    setIsModalOpen(true);
  };

  const handleSaveWord = async (wordData: any) => {
    try {
      if (editingWord) {
        await updateVocabulary(editingWord.id, wordData);
        showToast('Cập nhật từ vựng thành công!', 'success');
      } else {
        await addVocabulary(wordData);
        showToast('Thêm từ vựng mới thành công!', 'success');
      }
      await loadData();
      setIsModalOpen(false);
    } catch (error) {
      showToast('Thao tác lưu thất bại!', 'error');
      console.error('Error saving vocabulary:', error);
    }
  };

  const handleDeleteWord = (id: number) => {
    setDeleteWordId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteWordId === null) return;
    try {
      await deleteVocabulary(deleteWordId);
      showToast('Xóa từ vựng thành công!', 'success');
      await loadData();
    } catch (error) {
      showToast('Xóa từ vựng thất bại!', 'error');
      console.error('Error deleting vocabulary:', error);
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteWordId(null);
    }
  };

  const handleUpdateLevel = async (id: number, level: Vocabulary['memory_level']) => {
    try {
      // Update memory level and set study date to today
      const today = getLocalDateString();
      await updateVocabulary(id, {
        memory_level: level,
        study_date: today
      });
      // Refresh local data to keep everything sync
      await loadData();
    } catch (error) {
      showToast('Cập nhật mức độ nhớ thất bại!', 'error');
      console.error('Error updating word level:', error);
      throw error;
    }
  };

  const handleStartStudy = async () => {
    if (vocabularies.length > 0) {
      setStudyVocabularies([...vocabularies]);
      setIsStudyMode(true);
    } else {
      try {
        // If current date filter has no words (e.g. today has 0 words), study all words
        const allVocabs = await fetchVocabularies();
        setStudyVocabularies(allVocabs);
        setIsStudyMode(true);
      } catch (error) {
        console.error('Error loading all words for study:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <h1 className="text-primary font-bold text-lg md:text-xl tracking-tight">
              Chinese Vocabulary
            </h1>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-3 flex-1 max-w-lg justify-end">
            <div className="relative w-full max-w-[240px] md:max-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Tìm kiếm từ..."
                className="w-full pl-10 pr-4 py-1.5 text-xs text-text-charcoal bg-slate-50 border border-slate-200 rounded-full transition duration-150 focus:bg-white"
              />
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-md shadow-sm transition duration-150 flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus size={14} />
              Thêm từ mới
            </button>

            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-text-muted hover:text-text-charcoal cursor-pointer transition">
              <User size={16} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 py-8">
        {/* Progress Stats Card */}
        <StatsCard
          total={stats.total}
          daNho={stats.da_nho}
          dangNho={stats.dang_nho}
          chuaNho={stats.chua_nho}
          onStartReview={
            stats.total > 0 ? handleStartStudy : undefined
          }
        />

        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          {/* Table local filter */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Lọc bảng..."
              className="w-full pl-10 pr-4 py-2 text-sm text-text-charcoal bg-white border border-slate-200 rounded shadow-xs focus:ring-2 focus:ring-primary/20 transition duration-150"
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <span className="text-xs font-semibold text-text-muted">Lọc theo:</span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 text-sm text-text-charcoal bg-white border border-slate-200 rounded shadow-xs focus:ring-2 focus:ring-primary/20 cursor-pointer min-w-[140px]"
            >
              <option value="all">Tất cả các ngày</option>
              <option value={todayString}>Hôm nay ({new Date().toLocaleDateString('vi-VN')})</option>
              {studyDates
                .filter((d) => d !== todayString)
                .map((date) => {
                  const parts = date.split('-');
                  const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : date;
                  return (
                    <option key={date} value={date}>
                      {formatted}
                    </option>
                  );
                })}
            </select>
          </div>
        </div>

        {/* Vocabulary List Table */}
        <VocabularyTable
          vocabularies={filteredVocabularies}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteWord}
        />
      </main>

      {/* Add / Edit Word Modal */}
      <WordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveWord}
        editingWord={editingWord}
      />

      {/* Flashcard Study Overlay Session */}
      {isStudyMode && (
        <StudySession
          vocabularies={studyVocabularies} // Uses frozen study list to prevent layout shift bugs
          onUpdateLevel={handleUpdateLevel}
          onClose={() => setIsStudyMode(false)}
        />
      )}

      {/* Custom Delete Warning Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteWordId(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xóa từ vựng"
        message="Bạn có chắc chắn muốn xóa từ vựng này không? Hành động này sẽ xóa vĩnh viễn từ vựng và không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
      />

      {/* Floating Toast Notifications Overlay */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bgClass = 'bg-white border-slate-200 text-text-charcoal';
          let Icon = null;
          
          if (toast.type === 'success') {
            bgClass = 'bg-white border-emerald-100 text-emerald-800 shadow-md border-l-4 border-l-emerald-500';
            Icon = <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={18} />;
          } else if (toast.type === 'error') {
            bgClass = 'bg-white border-rose-100 text-rose-800 shadow-md border-l-4 border-l-rose-500';
            Icon = <AlertCircle className="text-rose-500 flex-shrink-0" size={18} />;
          } else if (toast.type === 'warning') {
            bgClass = 'bg-white border-amber-100 text-amber-800 shadow-md border-l-4 border-l-amber-500';
            Icon = <AlertTriangle className="text-amber-500 flex-shrink-0" size={18} />;
          } else {
            bgClass = 'bg-white border-sky-100 text-sky-800 shadow-md border-l-4 border-l-sky-500';
            Icon = <Info className="text-sky-500 flex-shrink-0" size={18} />;
          }

          return (
            <div
              key={toast.id}
              className={`p-4 rounded-md border flex items-center gap-3 bg-white text-xs font-semibold shadow-md pointer-events-auto animate-in slide-in-from-right-10 duration-200 ${bgClass}`}
            >
              {Icon}
              <div className="flex-1">{toast.message}</div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
