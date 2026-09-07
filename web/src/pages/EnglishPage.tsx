import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Upload, CheckCircle2, AlertCircle, AlertTriangle, Info, X, LogOut, BookOpen, ChevronDown } from 'lucide-react';
import {
  fetchEnglishVocabularies,
  fetchEnglishStats,
  addEnglishVocabulary,
  addEnglishVocabulariesBulk,
  updateEnglishVocabulary,
  deleteEnglishVocabulary,
  fetchSessions,
  addSession,
  updateSession,
  deleteSession,
  type EnglishVocabulary,
  type Session
} from '../utils/api';
import StatsCard from '../components/StatsCard';
import EnglishVocabularyTable from '../components/EnglishVocabularyTable';
import EnglishWordModal from '../components/EnglishWordModal';
import EnglishStudySession from '../components/EnglishStudySession';
import ConfirmModal from '../components/ConfirmModal';
import StudyOptionsModal from '../components/StudyOptionsModal';
import SessionPickerModal from '../components/SessionPickerModal';
import { lookupEnglishWord } from '../utils/dictionary';
import * as XLSX from 'xlsx';

export const EnglishPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [vocabularies, setVocabularies] = useState<EnglishVocabulary[]>([]);
  const [stats, setStats] = useState({ total: 0, rat_nho: 0, nho: 0, hoi_nho: 0, de_quen: 0 });

  const [globalSearch, setGlobalSearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | 'all'>('all');
  const [selectedMemoryLevel, setSelectedMemoryLevel] = useState<string>('all');

  // Session Picker Modal state
  const [isSessionPickerOpen, setIsSessionPickerOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<EnglishVocabulary | null>(null);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [isStudyOptionsModalOpen, setIsStudyOptionsModalOpen] = useState(false);
  const [studyVocabularies, setStudyVocabularies] = useState<EnglishVocabulary[]>([]);

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

  const [currentUser, setCurrentUser] = useState<any>(null);

  // Authentication Guard
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

  const loadSessions = async (userId: string) => {
    try {
      const list = await fetchSessions(userId, 'english');
      setSessions(list);
      return list;
    } catch (err) {
      console.error('Error fetching english sessions:', err);
      return [];
    }
  };

  // Load all data from API
  const loadData = async () => {
    if (!currentUser) return;
    try {
      // Fetch stats
      const statsData = await fetchEnglishStats(currentUser.id);
      setStats(statsData);

      // Fetch sessions list
      await loadSessions(currentUser.id);

      // Fetch vocabularies with active params
      const params: any = {};
      if (globalSearch.trim()) params.search = globalSearch;
      if (selectedSessionId !== 'all') params.session_id = selectedSessionId;
      if (selectedMemoryLevel !== 'all') params.memory_level = selectedMemoryLevel;

      const vocabData = await fetchEnglishVocabularies(currentUser.id, params);
      setVocabularies(vocabData);
    } catch (error) {
      console.error('Error loading English page data:', error);
    }
  };

  // Reload data whenever filters or user change
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [globalSearch, selectedSessionId, selectedMemoryLevel, currentUser]);

  // Client-side local filtering based on "Filter table..." input
  const filteredVocabularies = useMemo(() => {
    if (!tableSearch.trim()) return vocabularies;
    const query = tableSearch.toLowerCase().trim();
    return vocabularies.filter(
      (word) =>
        word.word.toLowerCase().includes(query) ||
        word.transliteration.toLowerCase().includes(query) ||
        word.meaning.toLowerCase().includes(query)
    );
  }, [vocabularies, tableSearch]);
  const handleOpenAddModal = () => {
    setEditingWord(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (word: EnglishVocabulary) => {
    setEditingWord(word);
    setIsModalOpen(true);
  };

  const handleSaveWord = async (wordData: any) => {
    if (!currentUser) return;
    try {
      if (editingWord) {
        await updateEnglishVocabulary(editingWord.id, wordData);
        showToast('Cập nhật từ vựng thành công!', 'success');
      } else {
        await addEnglishVocabulary({
          ...wordData,
          user_id: currentUser.id,
          session_id: wordData.session_id !== undefined ? wordData.session_id : (typeof selectedSessionId === 'number' ? selectedSessionId : null)
        });
        showToast('Thêm từ vựng mới thành công!', 'success');
      }
      await loadData();
      setIsModalOpen(false);
    } catch (error) {
      showToast('Thao tác lưu thất bại!', 'error');
      console.error('Error saving English vocabulary:', error);
    }
  };

  const handleDeleteWord = (id: number) => {
    setDeleteWordId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteWordId === null) return;
    try {
      await deleteEnglishVocabulary(deleteWordId);
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

  const handleUpdateLevel = async (id: number, level: EnglishVocabulary['memory_level']) => {
    try {
      await updateEnglishVocabulary(id, {
        memory_level: level
      });
      await loadData();
    } catch (error) {
      showToast('Cập nhật mức độ nhớ thất bại!', 'error');
      console.error('Error updating word level:', error);
      throw error;
    }
  };

  const handleUpdateExample = async (id: number, example: any) => {
    try {
      await updateEnglishVocabulary(id, { example });
      await loadData();
    } catch (error) {
      showToast('Lưu câu ví dụ thất bại!', 'error');
      console.error('Error updating word example:', error);
      throw error;
    }
  };

  const handleOpenStudyOptions = () => {
    setIsStudyOptionsModalOpen(true);
  };

  const handleStartStudy = async (option: 'sequential' | 'memory' | 'random') => {
    if (!currentUser) return;
    
    let baseVocabs = [...vocabularies];
    if (baseVocabs.length === 0) {
      try {
        baseVocabs = await fetchEnglishVocabularies(currentUser.id);
      } catch (error) {
        console.error('Error loading all words for study:', error);
      }
    }

    if (baseVocabs.length === 0) {
      showToast('Không có từ vựng nào để ôn tập.', 'warning');
      setIsStudyOptionsModalOpen(false);
      return;
    }

    let listToStudy = [...baseVocabs];

    if (option === 'memory') {
      const levelRank: Record<string, number> = {
        'Dễ quên': 1,
        'Hơi nhớ': 2,
        'Nhớ': 3,
        'Rất nhớ': 4
      };
      listToStudy.sort((a, b) => {
        const rankA = levelRank[a.memory_level] || 5;
        const rankB = levelRank[b.memory_level] || 5;
        return rankA - rankB;
      });
    } else if (option === 'random') {
      for (let i = listToStudy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [listToStudy[i], listToStudy[j]] = [listToStudy[j], listToStudy[i]];
      }
    }

    setStudyVocabularies(listToStudy);
    setIsStudyMode(true);
    setIsStudyOptionsModalOpen(false);
  };

  const handleTriggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json<any>(ws);

        if (rows.length === 0) {
          showToast('File Excel không có dữ liệu!', 'error');
          return;
        }

        showToast(`Đang xử lý ${rows.length} hàng...`, 'info');

        const lookupPromises = rows.map(async (row) => {
          let wordVal = '';
          let transliterationVal = '';
          let meaningVal = '';
          let wordTypeVal = '';

          for (const key of Object.keys(row)) {
            const lowerKey = key.toLowerCase();
            const val = String(row[key] || '').trim();

            if (lowerKey.includes('english') || lowerKey.includes('tiếng anh') || lowerKey.includes('từ') || lowerKey.includes('word') || lowerKey.includes('vocab')) {
              wordVal = val;
            } else if (lowerKey.includes('transliteration') || lowerKey.includes('phiên âm') || lowerKey.includes('phát âm') || lowerKey.includes('ipa')) {
              transliterationVal = val;
            } else if (lowerKey.includes('nghĩa') || lowerKey.includes('meaning') || lowerKey.includes('dịch') || lowerKey.includes('tiếng việt')) {
              meaningVal = val;
            } else if (lowerKey.includes('loại') || lowerKey.includes('type') || lowerKey.includes('word_type')) {
              wordTypeVal = val;
            }
          }

          if (!wordVal) return null;

          if (!transliterationVal || !meaningVal || !wordTypeVal) {
            try {
              const lookup = await lookupEnglishWord(wordVal);
              if (!transliterationVal) transliterationVal = lookup.transliteration;
              if (!meaningVal) meaningVal = lookup.meaning;
              if (!wordTypeVal && lookup.word_type) wordTypeVal = lookup.word_type;
            } catch (err) {
              console.error('Lookup failed for imported word:', wordVal, err);
            }
          }

          if (!wordTypeVal) wordTypeVal = 'Danh từ';

          return {
            word: wordVal,
            transliteration: transliterationVal || '---',
            meaning: meaningVal || '---',
            word_type: wordTypeVal,
            memory_level: 'Dễ quên' as const,
            study_date: new Date().toISOString().split('T')[0],
            session_id: typeof selectedSessionId === 'number' ? selectedSessionId : null
          };
        });

        const resolvedPayloads = await Promise.all(lookupPromises);
        const validPayloads = resolvedPayloads.filter((x): x is NonNullable<typeof x> => x !== null);

        if (validPayloads.length > 0) {
          await addEnglishVocabulariesBulk(validPayloads);
          showToast(`Nhập thành công ${validPayloads.length} từ vựng mới!`, 'success');
          await loadData();
        } else {
          showToast('Không có từ vựng hợp lệ nào để nhập.', 'warning');
        }
      } catch (err) {
        console.error('Error importing Excel:', err);
        showToast('Có lỗi xảy ra khi nhập file Excel.', 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col font-sans">
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-safe py-3 md:py-0 md:h-16 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/english')}>
              <img src="/images/logo-china.png" alt="Logo" className="w-8 h-8 object-contain" />
              <h1 className="text-[#0284c7] font-bold text-base md:text-lg tracking-tight whitespace-nowrap">
                Học Tiếng Anh
              </h1>
            </div>
            
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
              <button 
                onClick={() => navigate('/china')}
                className="px-3 py-1 rounded text-slate-500 hover:text-slate-700 font-bold transition duration-150 cursor-pointer"
              >
                Tiếng Trung
              </button>
              <button 
                onClick={() => navigate('/english')}
                className="px-3 py-1 rounded bg-white shadow-xs text-[#0284c7] font-bold transition duration-150"
              >
                Tiếng Anh
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial max-w-[200px] md:max-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Tìm từ hệ thống..."
                className="w-full pl-9 pr-4 py-1.5 text-xs text-text-charcoal bg-slate-50 border border-slate-200 rounded-full transition duration-150 focus:bg-white focus:ring-1 focus:ring-[#0284c7]"
              />
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold rounded-md shadow-sm transition duration-150 flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Plus size={14} />
              Thêm từ mới
            </button>

            <button
              onClick={handleTriggerImport}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-sm transition duration-150 flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Upload size={14} />
              Nhập Excel
            </button>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleImportExcel}
              accept=".xlsx, .xls"
              className="hidden"
            />

            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 hover:bg-rose-100 hover:text-rose-700 cursor-pointer transition flex-shrink-0 active:scale-95"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-safe py-8 animate-in fade-in duration-300">
        <StatsCard
          total={stats.total}
          ratNho={stats.rat_nho || 0}
          nho={stats.nho}
          hoiNho={stats.hoi_nho}
          deQuen={stats.de_quen}
          onStartReview={
            stats.total > 0 ? handleOpenStudyOptions : undefined
          }
          onStatClick={(level) => {
            setSelectedMemoryLevel(level);
            setSelectedSessionId('all');
          }}
        />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Lọc bảng..."
              className="w-full pl-10 pr-4 py-2 text-sm text-text-charcoal bg-white border border-slate-200 rounded shadow-xs focus:ring-2 focus:ring-[#0284c7]/20 transition duration-150"
            />
          </div>

          <div className="flex flex-row flex-wrap items-center gap-3 self-stretch sm:self-auto justify-start sm:justify-end">
            {/* Session Selection Trigger Button */}
            <button
              onClick={() => setIsSessionPickerOpen(true)}
              className="px-3.5 py-2 text-sm bg-white border border-slate-200 hover:border-[#0284c7]/50 rounded-lg shadow-xs flex items-center gap-2 transition cursor-pointer group"
            >
              <BookOpen size={16} className="text-[#0284c7] group-hover:scale-110 transition" />
              <span className="font-bold text-text-charcoal">
                {selectedSessionId === 'all'
                  ? `Tất cả các buổi (${stats.total} từ)`
                  : `${sessions.find(s => s.id === selectedSessionId)?.name || 'Buổi học'} (${sessions.find(s => s.id === selectedSessionId)?.word_count || 0} từ)`}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {/* Memory Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Mức nhớ:</span>
              <select
                value={selectedMemoryLevel}
                onChange={(e) => setSelectedMemoryLevel(e.target.value)}
                className="px-3 py-2 text-sm text-text-charcoal bg-white border border-slate-200 rounded shadow-xs focus:ring-2 focus:ring-[#0284c7]/20 cursor-pointer min-w-[130px]"
              >
                <option value="all">Tất cả</option>
                <option value="Dễ quên">Dễ quên</option>
                <option value="Hơi nhớ">Hơi nhớ</option>
                <option value="Nhớ">Nhớ</option>
                <option value="Rất nhớ">Rất nhớ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vocabulary List Table */}
        <EnglishVocabularyTable
          vocabularies={filteredVocabularies}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteWord}
        />
      </main>

      {/* Add / Edit Word Modal */}
      <EnglishWordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveWord}
        editingWord={editingWord}
        sessions={sessions}
        currentSessionId={selectedSessionId}
      />

      {/* Session Picker & Manager Modal */}
      <SessionPickerModal
        isOpen={isSessionPickerOpen}
        onClose={() => setIsSessionPickerOpen(false)}
        sessions={sessions}
        selectedSessionId={selectedSessionId}
        onSelectSession={(id) => setSelectedSessionId(id)}
        onAddSession={async (name) => {
          const created = await addSession(name, 'english');
          showToast('Thêm buổi học mới thành công!', 'success');
          setSelectedSessionId(created.id);
          await loadData();
        }}
        onEditSession={async (id, newName) => {
          await updateSession(id, newName);
          showToast('Cập nhật tên buổi học thành công!', 'success');
          await loadData();
        }}
        onDeleteSession={async (id) => {
          await deleteSession(id);
          showToast('Đã xóa buổi học!', 'success');
          if (selectedSessionId === id) setSelectedSessionId('all');
          await loadData();
        }}
        totalWordsCount={stats.total}
      />

      {isStudyMode && (
        <EnglishStudySession
          vocabularies={studyVocabularies}
          onUpdateLevel={handleUpdateLevel}
          onUpdateExample={handleUpdateExample}
          onClose={() => setIsStudyMode(false)}
        />
      )}

      {/* Custom Delete Warning Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa từ vựng"
        message="Bạn có chắc chắn muốn xóa từ vựng này không? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />

      {/* Study Options Modal */}
      <StudyOptionsModal
        isOpen={isStudyOptionsModalOpen}
        onClose={() => setIsStudyOptionsModalOpen(false)}
        onSelectOption={handleStartStudy}
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
};
export default EnglishPage;
