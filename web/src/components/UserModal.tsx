import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { UserAccount } from '../utils/api';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: { username: string; password?: string; role: 'admin' | 'user' }) => Promise<void>;
  editingUser: UserAccount | null;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingUser
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingUser) {
      setUsername(editingUser.username);
      setPassword(''); // Password blank on edit by default
      setRole(editingUser.role);
    } else {
      setUsername('');
      setPassword('');
      setRole('user');
    }
    setError('');
  }, [editingUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || (!editingUser && !password.trim())) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      const payload: any = {
        username: username.trim(),
        role
      };
      
      if (password.trim() !== '') {
        payload.password = password;
      }
      
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi lưu tài khoản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Dialog */}
      <div className="relative bg-white rounded-card shadow-soft-lg w-full max-w-md border border-slate-100 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-text-charcoal">
            {editingUser ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-xs font-medium text-red-600 border border-red-100 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-text-muted mb-1.5">
                Tên đăng nhập <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                className="w-full px-3.5 py-2 text-sm text-text-charcoal bg-slate-50/50 border border-slate-200 rounded font-medium"
                required
                autoComplete="off"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-text-muted mb-1.5">
                Mật khẩu {editingUser ? '(Bỏ trống nếu không đổi)' : <span className="text-red-500">*</span>}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editingUser ? "Không thay đổi" : "Nhập mật khẩu"}
                className="w-full px-3.5 py-2 text-sm text-text-charcoal bg-slate-50/50 border border-slate-200 rounded font-medium"
                required={!editingUser}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-xs font-semibold text-text-muted mb-1.5">
                Vai trò (Role)
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm text-text-charcoal bg-slate-50/50 border border-slate-200 rounded cursor-pointer"
                disabled={isSubmitting}
              >
                <option value="user">User (Người học)</option>
                <option value="admin">Admin (Quản trị viên)</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-text-muted hover:text-text-charcoal hover:bg-slate-50 rounded transition duration-200 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded shadow-sm transition duration-200 flex items-center justify-center min-w-[80px] cursor-pointer"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default UserModal;
