export interface Vocabulary {
  id: number;
  chinese: string;
  pinyin: string;
  han_viet: string;
  meaning: string;
  memory_level: 'Chưa nhớ' | 'Đang nhớ' | 'Đã nhớ';
  study_date: string | null; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export type VocabularyInput = Omit<Vocabulary, 'id' | 'created_at' | 'updated_at'>;

const API_BASE_URL = 'http://localhost:5000/api';

export async function fetchStats() {
  const res = await fetch(`${API_BASE_URL}/vocabularies/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json() as Promise<{ total: number; da_nho: number; dang_nho: number; chua_nho: number }>;
}

export async function fetchDates() {
  const res = await fetch(`${API_BASE_URL}/vocabularies/dates`);
  if (!res.ok) throw new Error('Failed to fetch dates');
  return res.json() as Promise<string[]>;
}

export async function fetchVocabularies(params?: { search?: string; memory_level?: string; study_date?: string }) {
  const url = new URL(`${API_BASE_URL}/vocabularies`);
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
