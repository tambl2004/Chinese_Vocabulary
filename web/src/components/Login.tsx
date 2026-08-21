import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle } from 'lucide-react';
import { login } from '../utils/api';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (targetPath: '/china' | '/english') => {
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const data = await login(username.trim(), password.trim());

      if (data.success) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        navigate(targetPath);
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col justify-center items-center p-4">
      {/* Background blobs for premium glassmorphism vibe */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-card shadow-soft-lg border border-slate-100 p-8 z-10 relative">
        {/* Title */}
        <div className="text-center">
          <img src="/images/logo-china.png" alt="Logo" className="w-36 h-36 object-contain mx-auto" />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-100 rounded text-xs font-semibold text-rose-800 flex items-start gap-2 animate-in fade-in duration-200">
            <AlertCircle className="text-rose-500 flex-shrink-0" size={16} />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5" htmlFor="username">
              Tên đăng nhập
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <User size={16} />
              </span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                className="w-full pl-10 pr-4 py-2.5 text-sm text-text-charcoal bg-white border border-slate-200 rounded outline-none transition focus:bg-white"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5" htmlFor="password">
              Mật khẩu
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={16} />
              </span>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full pl-10 pr-4 py-2.5 text-sm text-text-charcoal bg-white border border-slate-200 rounded outline-none transition focus:bg-white"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin('/china');
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Normal Users Buttons Grid */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleLogin('/china')}
            className="py-3 px-4 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white text-xs font-bold rounded shadow-sm hover:shadow transition duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer animate-in fade-in"
          >
            <span>Tiếng Trung</span>
            <span className="text-[10px] opacity-80 font-normal">Chuyển sang /china</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleLogin('/english')}
            className="py-3 px-4 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white text-xs font-bold rounded shadow-sm hover:shadow transition duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer animate-in fade-in"
          >
            <span>Tiếng Anh</span>
            <span className="text-[10px] opacity-80 font-normal">Chuyển sang /english</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default Login;
