export interface Vocabulary {
  id: number;
  user_id: number;
  chinese: string;
  pinyin: string;
  han_viet: string;
  meaning: string;
  word_type: string | null;
  memory_level: 'Chưa nhớ' | 'Đang nhớ' | 'Đã nhớ' | 'Rất nhớ';
  study_date: string | null; // YYYY-MM-DD
  last_reviewed_at: string | null; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export type VocabularyInput = Omit<Vocabulary, 'id' | 'created_at' | 'updated_at'>;

export interface EnglishVocabulary {
  id: number;
  user_id: number;
  word: string;
  transliteration: string;
  meaning: string;
  word_type: string | null;
  memory_level: 'Chưa nhớ' | 'Đang nhớ' | 'Đã nhớ' | 'Rất nhớ';
  study_date: string | null; // YYYY-MM-DD
  last_reviewed_at: string | null; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export type EnglishVocabularyInput = Omit<EnglishVocabulary, 'id' | 'created_at' | 'updated_at'>;

export interface UserAccount {
  id: number;
  username: string;
  plain_password?: string;
  role: 'admin' | 'user';
  created_at?: string;
}

export interface UserVocabStats {
  userId: number;
  username: string;
  total: number;
  rat_nho: number;
  da_nho: number;
  dang_nho: number;
  chua_nho: number;
}

export interface AdminSummary {
  totalUsers: number;
  totalChineseWords: number;
  totalEnglishWords: number;
}

const API_BASE_URL = 'http://localhost:5000/api';

// Authentication
export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Tên đăng nhập hoặc mật khẩu không chính xác');
  }
  return res.json() as Promise<{ success: boolean; user: UserAccount }>;
}

// Admin: User CRUD
export async function fetchUsers() {
  const res = await fetch(`${API_BASE_URL}/admin/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json() as Promise<UserAccount[]>;
}

export async function addUser(user: Partial<UserAccount> & { password?: string }) {
  const res = await fetch(`${API_BASE_URL}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to add user');
  }
  return res.json() as Promise<UserAccount>;
}

export async function updateUser(id: number, user: Partial<UserAccount> & { password?: string }) {
  const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update user');
  }
  return res.json() as Promise<UserAccount>;
}

export async function deleteUser(id: number) {
  const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete user');
  return res.json() as Promise<{ success: boolean; message: string }>;
}

// Admin: Vocabulary Statistics
export async function fetchAdminSummary() {
  const res = await fetch(`${API_BASE_URL}/admin/stats/summary`);
  if (!res.ok) throw new Error('Failed to fetch admin stats summary');
  return res.json() as Promise<AdminSummary>;
}

export async function fetchAdminChineseStats() {
  const res = await fetch(`${API_BASE_URL}/admin/stats/chinese`);
  if (!res.ok) throw new Error('Failed to fetch admin Chinese stats');
  return res.json() as Promise<UserVocabStats[]>;
}

export async function fetchAdminEnglishStats() {
  const res = await fetch(`${API_BASE_URL}/admin/stats/english`);
  if (!res.ok) throw new Error('Failed to fetch admin English stats');
  return res.json() as Promise<UserVocabStats[]>;
}

// Chinese Vocabulary
export async function fetchStats(userId: number) {
  const res = await fetch(`${API_BASE_URL}/vocabularies/stats?userId=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json() as Promise<{ total: number; rat_nho: number; da_nho: number; dang_nho: number; chua_nho: number }>;
}

export async function fetchDates(userId: number) {
  const res = await fetch(`${API_BASE_URL}/vocabularies/dates?userId=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch dates');
  return res.json() as Promise<string[]>;
}

export async function fetchVocabularies(userId: number, params?: { search?: string; memory_level?: string; study_date?: string }) {
  const url = new URL(`${API_BASE_URL}/vocabularies`);
  url.searchParams.append('userId', userId.toString());
  if (params) {
    if (params.search) url.searchParams.append('search', params.search);
    if (params.memory_level) url.searchParams.append('memory_level', params.memory_level);
    if (params.study_date) url.searchParams.append('study_date', params.study_date);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch vocabularies');
  return res.json() as Promise<Vocabulary[]>;
}

export async function addVocabulary(word: Partial<VocabularyInput>) {
  const res = await fetch(`${API_BASE_URL}/vocabularies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(word),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to add vocabulary');
  }
  return res.json() as Promise<Vocabulary>;
}

export async function updateVocabulary(id: number, word: Partial<VocabularyInput>) {
  const res = await fetch(`${API_BASE_URL}/vocabularies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(word),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update vocabulary');
  }
  return res.json() as Promise<Vocabulary>;
}

export async function deleteVocabulary(id: number) {
  const res = await fetch(`${API_BASE_URL}/vocabularies/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete vocabulary');
  return res.json() as Promise<{ message: string; id: number }>;
}

// English Vocabulary
export async function fetchEnglishStats(userId: number) {
  const res = await fetch(`${API_BASE_URL}/english-vocabularies/stats?userId=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch English stats');
  return res.json() as Promise<{ total: number; rat_nho: number; da_nho: number; dang_nho: number; chua_nho: number }>;
}

export async function fetchEnglishDates(userId: number) {
  const res = await fetch(`${API_BASE_URL}/english-vocabularies/dates?userId=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch English dates');
  return res.json() as Promise<string[]>;
}

export async function fetchEnglishVocabularies(userId: number, params?: { search?: string; memory_level?: string; study_date?: string }) {
  const url = new URL(`${API_BASE_URL}/english-vocabularies`);
  url.searchParams.append('userId', userId.toString());
  if (params) {
    if (params.search) url.searchParams.append('search', params.search);
    if (params.memory_level) url.searchParams.append('memory_level', params.memory_level);
    if (params.study_date) url.searchParams.append('study_date', params.study_date);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch English vocabularies');
  return res.json() as Promise<EnglishVocabulary[]>;
}

export async function addEnglishVocabulary(word: Partial<EnglishVocabularyInput>) {
  const res = await fetch(`${API_BASE_URL}/english-vocabularies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(word),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to add English vocabulary');
  }
  return res.json() as Promise<EnglishVocabulary>;
}

export async function updateEnglishVocabulary(id: number, word: Partial<EnglishVocabularyInput>) {
  const res = await fetch(`${API_BASE_URL}/english-vocabularies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(word),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update English vocabulary');
  }
  return res.json() as Promise<EnglishVocabulary>;
}

export async function deleteEnglishVocabulary(id: number) {
  const res = await fetch(`${API_BASE_URL}/english-vocabularies/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete English vocabulary');
  return res.json() as Promise<{ message: string; id: number }>;
}
