import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, BookOpen, Languages, LogOut, CheckCircle2,
  AlertCircle, Settings, X
} from 'lucide-react';
import {
  fetchAdminSummary,
  fetchAdminChineseStats,
  fetchAdminEnglishStats,
  type UserAccount,
  type UserVocabStats,
  type AdminSummary
} from '../utils/api';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'chinese' | 'english'>('home');
  const [summary, setSummary] = useState<AdminSummary>({ totalUsers: 0, totalChineseWords: 0, totalEnglishWords: 0 });
  const [chineseStats, setChineseStats] = useState<UserVocabStats[]>([]);
  const [englishStats, setEnglishStats] = useState<UserVocabStats[]>([]);

  // Toast notifications state
  interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error';
  }
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // Auth Protection
  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(userStr) as UserAccount;
    if (user.role !== 'admin') {
      navigate('/login');
    }
  }, [navigate]);

  // Load Dashboard data
  const loadData = async () => {
    try {
      if (activeTab === 'home') {
        const sumData = await fetchAdminSummary();
        setSummary(sumData);
      } else if (activeTab === 'chinese') {
        const cnStats = await fetchAdminChineseStats();
        setChineseStats(cnStats);
      } else if (activeTab === 'english') {
        const enStats = await fetchAdminEnglishStats();
        setEnglishStats(enStats);
      }
    } catch (error) {
      console.error('Failed to load admin dashboard data:', error);
      showToast('Tải dữ liệu thất bại!', 'error');
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr) as UserAccount;
      if (user.role === 'admin') {
        loadData();
      }
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col md:flex-row font-sans">
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 text-text-charcoal flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center justify-center bg-slate-50/50 border-b border-slate-200">
            <img src="/images/logo-china.png" alt="Logo" className="h-32 w-32 object-contain" />
          </div>

          {/* Nav List */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-sm font-semibold transition cursor-pointer ${activeTab === 'home'
                ? 'bg-primary/10 text-primary'
                : 'text-text-muted hover:bg-slate-50 hover:text-text-charcoal'
                }`}
            >
              <Settings size={18} />
              <span>Tổng quan</span>
            </button>

            <button
              onClick={() => setActiveTab('chinese')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-sm font-semibold transition cursor-pointer ${activeTab === 'chinese'
                ? 'bg-primary/10 text-primary'
                : 'text-text-muted hover:bg-slate-50 hover:text-text-charcoal'
                }`}
            >
              <BookOpen size={18} />
              <span>Từ vựng tiếng Trung</span>
            </button>

            <button
              onClick={() => setActiveTab('english')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-sm font-semibold transition cursor-pointer ${activeTab === 'english'
                ? 'bg-primary/10 text-primary'
                : 'text-text-muted hover:bg-slate-50 hover:text-text-charcoal'
                }`}
            >
              <Languages size={18} />
              <span>Từ vựng tiếng Anh</span>
            </button>
          </nav>
        </div>

        {/* Footer Logout Button */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 rounded text-sm font-bold transition cursor-pointer"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main content workspace */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {/* Title dynamic banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-charcoal capitalize">
              {activeTab === 'home' && 'Bảng điều khiển tổng quan'}
              {activeTab === 'chinese' && 'Thống kê từ vựng tiếng Trung'}
              {activeTab === 'english' && 'Thống kê từ vựng tiếng Anh'}
            </h1>
            <p className="text-xs text-text-muted mt-1 font-medium">
              Chào mừng Admin quay trở lại hệ thống quản trị học tập.
            </p>
          </div>
        </div>

        {/* Screen: Summary Home */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-card border border-slate-100 shadow-soft flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <span className="text-3xl font-extrabold text-text-charcoal leading-none block">{summary.totalUsers}</span>
                <span className="text-xs text-text-muted font-bold block mt-1">Tổng người dùng</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-card border border-slate-100 shadow-soft flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#00685f] flex items-center justify-center">
                <BookOpen size={24} />
              </div>
              <div>
                <span className="text-3xl font-extrabold text-text-charcoal leading-none block">{summary.totalChineseWords}</span>
                <span className="text-xs text-text-muted font-bold block mt-1">Tổng từ vựng tiếng Trung</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-card border border-slate-100 shadow-soft flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Languages size={24} />
              </div>
              <div>
                <span className="text-3xl font-extrabold text-text-charcoal leading-none block">{summary.totalEnglishWords}</span>
                <span className="text-xs text-text-muted font-bold block mt-1">Tổng từ vựng tiếng Anh</span>
              </div>
            </div>
          </div>
        )}

        {/* Screen: Chinese Statistics */}
        {activeTab === 'chinese' && (
          <div className="bg-white rounded-card shadow-soft border border-slate-100 overflow-hidden animate-in fade-in duration-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-4 px-6 text-xs font-semibold text-text-muted w-16">#</th>
                  <th className="py-4 px-6 text-xs font-semibold text-text-muted">ID Người dùng</th>
                  <th className="py-4 px-6 text-xs font-semibold text-text-muted">Tổng số từ</th>
                  <th className="py-4 px-6 text-xs font-semibold text-text-muted">Rất nhớ</th>
                  <th className="py-4 px-6 text-xs font-semibold text-text-muted">Đã nhớ</th>
                  <th className="py-4 px-6 text-xs font-semibold text-text-muted">Đang nhớ</th>
                  <th className="py-4 px-6 text-xs font-semibold text-text-muted">Chưa nhớ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chineseStats.length > 0 ? (
                  chineseStats.map((stat, index) => (
                    <tr key={stat.userId} className="hover:bg-slate-50/70 transition duration-150">
                      <td className="py-3 px-6 text-sm text-text-muted">{index + 1}</td>
                      <td className="py-3 px-6 text-sm font-bold text-text-charcoal">{stat.username}</td>
                      <td className="py-3 px-6 text-sm text-text-charcoal font-semibold">{stat.total}</td>
                      <td className="py-3 px-6">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          {stat.rat_nho || 0}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700">
                          {stat.da_nho || 0}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                          {stat.dang_nho || 0}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                          {stat.chua_nho || 0}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-text-muted">
                      Không có dữ liệu thống kê từ vựng tiếng Trung.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Screen: English Statistics */}
        {activeTab === 'english' && (
          <div className="bg-white rounded-card shadow-soft border border-slate-100 overflow-hidden animate-in fade-in duration-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-4 px-6 text-xs font-semibold text-text-muted w-16">#</th>
                  <th className="py-4 px-6 text-xs font-semibold text-text-muted">ID Người dùng</th>
                  <th className="py-4 px-6 text-xs font-semibold text-text-muted">Tổng số từ</th>
                  <th className="py-4 px-6 text-xs font-semibold text-text-muted">Rất nhớ</th>
                  <th className="py-4 px-6 text-xs font-semibold text-text-muted">Đã nhớ</th>
                  <th className="py-4 px-6 text-xs font-semibold text-text-muted">Đang nhớ</th>
                  <th className="py-4 px-6 text-xs font-semibold text-text-muted">Chưa nhớ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {englishStats.length > 0 ? (
                  englishStats.map((stat, index) => (
                    <tr key={stat.userId} className="hover:bg-slate-50/70 transition duration-150">
                      <td className="py-3 px-6 text-sm text-text-muted">{index + 1}</td>
                      <td className="py-3 px-6 text-sm font-bold text-text-charcoal">{stat.username}</td>
                      <td className="py-3 px-6 text-sm text-text-charcoal font-semibold">{stat.total}</td>
                      <td className="py-3 px-6">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          {stat.rat_nho || 0}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700">
                          {stat.da_nho || 0}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                          {stat.dang_nho || 0}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                          {stat.chua_nho || 0}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-text-muted">
                      Không có dữ liệu thống kê từ vựng tiếng Anh.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Floating Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bgClass = 'bg-white border-slate-200 text-text-charcoal';
          let Icon = null;

          if (toast.type === 'success') {
            bgClass = 'bg-white border-emerald-100 text-emerald-800 shadow-md border-l-4 border-l-emerald-500';
            Icon = <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={18} />;
          } else {
            bgClass = 'bg-white border-rose-100 text-rose-800 shadow-md border-l-4 border-l-rose-500';
            Icon = <AlertCircle className="text-rose-500 flex-shrink-0" size={18} />;
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
export default AdminDashboard;
