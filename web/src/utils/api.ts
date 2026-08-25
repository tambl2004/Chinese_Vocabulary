import { supabase } from '../lib/supabase';

export interface Vocabulary {
  id: number;
  user_id: string;
  chinese: string;
  pinyin: string;
  han_viet: string;
  meaning: string;
  word_type: string | null;
  memory_level: 'Dễ quên' | 'Hơi nhớ' | 'Nhớ' | 'Rất nhớ';
  study_date: string | null; // YYYY-MM-DD
  last_reviewed_at: string | null; // YYYY-MM-DD
  example?: { sentence: string; translation: string; pinyin?: string } | null;
  created_at: string;
  updated_at: string;
}

export type VocabularyInput = Omit<Vocabulary, 'id' | 'created_at' | 'updated_at'>;

export interface EnglishVocabulary {
  id: number;
  user_id: string;
  word: string;
  transliteration: string;
  meaning: string;
  word_type: string | null;
  memory_level: 'Dễ quên' | 'Hơi nhớ' | 'Nhớ' | 'Rất nhớ';
  study_date: string | null; // YYYY-MM-DD
  last_reviewed_at: string | null; // YYYY-MM-DD
  example?: { sentence: string; translation: string } | null;
  created_at: string;
  updated_at: string;
}

export type EnglishVocabularyInput = Omit<EnglishVocabulary, 'id' | 'created_at' | 'updated_at'>;

export interface UserAccount {
  id: string;
  username: string;
  plain_password?: string;
  role: 'admin' | 'user';
  created_at?: string;
}

export interface UserVocabStats {
  userId: string;
  username: string;
  total: number;
  rat_nho: number;
  nho: number;
  hoi_nho: number;
  de_quen: number;
}

export interface AdminSummary {
  totalUsers: number;
  totalChineseWords: number;
  totalEnglishWords: number;
}

// Authentication
export async function login(username: string, password: string) {
  const email = username.includes('@') ? username : `${username}@vocab.com`;
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message || 'Tên đăng nhập hoặc mật khẩu không chính xác');
  }

  const user = data.user;
  const role = (user?.user_metadata?.role as 'admin' | 'user') || 'user';

  if (user) {
    triggerDemotionIfNeeded(user.id);
  }

  return {
    success: true,
    user: {
      id: user!.id,
      username: username,
      role: role
    } as UserAccount
  };
}

// Helper to run 5-day auto demotion on Supabase
async function triggerDemotionIfNeeded(userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastCheck = localStorage.getItem(`last_demotion_check_${userId}`);
    if (lastCheck !== today) {
      localStorage.setItem(`last_demotion_check_${userId}`, today);
      console.log('Triggering 5-day memory level demotion via Supabase RPC...');
      await supabase.rpc('demote_user_vocabularies', { user_id_param: userId });
    }
  } catch (err) {
    console.error('Failed to trigger auto demotion:', err);
  }
}

// Admin: User CRUD (Stubbed since users are managed directly in Supabase Dashboard)
export async function fetchUsers() {
  return [] as UserAccount[];
}

export async function addUser(_user: Partial<UserAccount> & { password?: string }) {
  return {} as any;
}

export async function updateUser(_id: string | number, _user: Partial<UserAccount> & { password?: string }) {
  return {} as any;
}

export async function deleteUser(_id: string | number) {
  return { success: true, message: 'Deleted successfully' };
}

// Admin: Vocabulary Statistics
export async function fetchAdminSummary() {
  const { count: cnCount, error: cnErr } = await supabase
    .from('vocabularies')
    .select('*', { count: 'exact', head: true });
  if (cnErr) throw cnErr;

  const { count: enCount, error: enErr } = await supabase
    .from('english_vocabularies')
    .select('*', { count: 'exact', head: true });
  if (enErr) throw enErr;

  const { data: cnUsers } = await supabase.from('vocabularies').select('user_id');
  const { data: enUsers } = await supabase.from('english_vocabularies').select('user_id');
  const uniqueUsers = new Set<string>();
  cnUsers?.forEach(x => uniqueUsers.add(x.user_id));
  enUsers?.forEach(x => uniqueUsers.add(x.user_id));

  return {
    totalUsers: uniqueUsers.size || 1,
    totalChineseWords: cnCount || 0,
    totalEnglishWords: enCount || 0
  } as AdminSummary;
}

export async function fetchAdminChineseStats() {
  const { data, error } = await supabase
    .from('vocabularies')
    .select('user_id, memory_level');

  if (error) throw error;

  const statsMap = new Map<string, UserVocabStats>();

  data.forEach(item => {
    const uid = item.user_id;
    if (!statsMap.has(uid)) {
      statsMap.set(uid, {
        userId: uid,
        username: `User-${uid.substring(0, 8)}`,
        total: 0,
        rat_nho: 0,
        nho: 0,
        hoi_nho: 0,
        de_quen: 0
      });
    }

    const stat = statsMap.get(uid)!;
    stat.total++;
    if (item.memory_level === 'Rất nhớ') stat.rat_nho++;
    else if (item.memory_level === 'Nhớ') stat.nho++;
    else if (item.memory_level === 'Hơi nhớ') stat.hoi_nho++;
    else if (item.memory_level === 'Dễ quên') stat.de_quen++;
  });

  return Array.from(statsMap.values());
}

export async function fetchAdminEnglishStats() {
  const { data, error } = await supabase
    .from('english_vocabularies')
    .select('user_id, memory_level');

  if (error) throw error;

  const statsMap = new Map<string, UserVocabStats>();

  data.forEach(item => {
    const uid = item.user_id;
    if (!statsMap.has(uid)) {
      statsMap.set(uid, {
        userId: uid,
        username: `User-${uid.substring(0, 8)}`,
        total: 0,
        rat_nho: 0,
        nho: 0,
        hoi_nho: 0,
        de_quen: 0
      });
    }

    const stat = statsMap.get(uid)!;
    stat.total++;
    if (item.memory_level === 'Rất nhớ') stat.rat_nho++;
    else if (item.memory_level === 'Nhớ') stat.nho++;
    else if (item.memory_level === 'Hơi nhớ') stat.hoi_nho++;
    else if (item.memory_level === 'Dễ quên') stat.de_quen++;
  });

  return Array.from(statsMap.values());
}

// Chinese Vocabulary
export async function fetchStats(userId: string | number) {
  const uid = userId.toString();
  triggerDemotionIfNeeded(uid);

  const { data, error } = await supabase
    .from('vocabularies')
    .select('memory_level')
    .eq('user_id', uid);

  if (error) throw error;

  const stats = {
    total: data.length,
    rat_nho: 0,
    nho: 0,
    hoi_nho: 0,
    de_quen: 0
  };

  data.forEach(item => {
    if (item.memory_level === 'Rất nhớ') stats.rat_nho++;
    else if (item.memory_level === 'Nhớ') stats.nho++;
    else if (item.memory_level === 'Hơi nhớ') stats.hoi_nho++;
    else if (item.memory_level === 'Dễ quên') stats.de_quen++;
  });

  return stats;
}

export async function fetchDates(userId: string | number) {
  const uid = userId.toString();
  const { data, error } = await supabase
    .from('vocabularies')
    .select('study_date')
    .eq('user_id', uid)
    .not('study_date', 'is', null);

  if (error) throw error;

  const datesSet = new Set(data.map(item => item.study_date));
  return Array.from(datesSet).sort().reverse();
}

export async function fetchVocabularies(userId: string | number, params?: { search?: string; memory_level?: string; study_date?: string }) {
  const uid = userId.toString();
  let query = supabase.from('vocabularies').select('*').eq('user_id', uid);

  if (params) {
    if (params.search) {
      const s = `%${params.search}%`;
      query = query.or(`chinese.ilike.${s},pinyin.ilike.${s},han_viet.ilike.${s},meaning.ilike.${s}`);
    }
    if (params.memory_level && params.memory_level !== 'all') {
      query = query.eq('memory_level', params.memory_level);
    }
    if (params.study_date && params.study_date !== 'all') {
      query = query.eq('study_date', params.study_date);
    }
  }

  const { data, error } = await query.order('id', { ascending: false });
  if (error) throw error;
  return data as Vocabulary[];
}

export async function addVocabulary(word: Partial<VocabularyInput>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('vocabularies')
    .insert([{
      ...word,
      user_id: user.id,
      last_reviewed_at: new Date().toISOString().split('T')[0]
    }])
    .select();

  if (error) throw error;
  return data[0] as Vocabulary;
}

export async function updateVocabulary(id: number, word: Partial<VocabularyInput>) {
  const payload: any = { ...word };
  if (word.memory_level) {
    payload.last_reviewed_at = new Date().toISOString().split('T')[0];
  }

  const { data, error } = await supabase
    .from('vocabularies')
    .update(payload)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0] as Vocabulary;
}

export async function deleteVocabulary(id: number) {
  const { error } = await supabase
    .from('vocabularies')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { message: 'Deleted successfully', id };
}

// English Vocabulary
export async function fetchEnglishStats(userId: string | number) {
  const uid = userId.toString();
  triggerDemotionIfNeeded(uid);

  const { data, error } = await supabase
    .from('english_vocabularies')
    .select('memory_level')
    .eq('user_id', uid);

  if (error) throw error;

  const stats = {
    total: data.length,
    rat_nho: 0,
    nho: 0,
    hoi_nho: 0,
    de_quen: 0
  };

  data.forEach(item => {
    if (item.memory_level === 'Rất nhớ') stats.rat_nho++;
    else if (item.memory_level === 'Nhớ') stats.nho++;
    else if (item.memory_level === 'Hơi nhớ') stats.hoi_nho++;
    else if (item.memory_level === 'Dễ quên') stats.de_quen++;
  });

  return stats;
}

export async function fetchEnglishDates(userId: string | number) {
  const uid = userId.toString();
  const { data, error } = await supabase
    .from('english_vocabularies')
    .select('study_date')
    .eq('user_id', uid)
    .not('study_date', 'is', null);

  if (error) throw error;

  const datesSet = new Set(data.map(item => item.study_date));
  return Array.from(datesSet).sort().reverse();
}

export async function fetchEnglishVocabularies(userId: string | number, params?: { search?: string; memory_level?: string; study_date?: string }) {
  const uid = userId.toString();
  let query = supabase.from('english_vocabularies').select('*').eq('user_id', uid);

  if (params) {
    if (params.search) {
      const s = `%${params.search}%`;
      query = query.or(`word.ilike.${s},transliteration.ilike.${s},meaning.ilike.${s}`);
    }
    if (params.memory_level && params.memory_level !== 'all') {
      query = query.eq('memory_level', params.memory_level);
    }
    if (params.study_date && params.study_date !== 'all') {
      query = query.eq('study_date', params.study_date);
    }
  }

  const { data, error } = await query.order('id', { ascending: false });
  if (error) throw error;
  return data as EnglishVocabulary[];
}

export async function addEnglishVocabulary(word: Partial<EnglishVocabularyInput>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('english_vocabularies')
    .insert([{
      ...word,
      user_id: user.id,
      last_reviewed_at: new Date().toISOString().split('T')[0]
    }])
    .select();

  if (error) throw error;
  return data[0] as EnglishVocabulary;
}

export async function updateEnglishVocabulary(id: number, word: Partial<EnglishVocabularyInput>) {
  const payload: any = { ...word };
  if (word.memory_level) {
    payload.last_reviewed_at = new Date().toISOString().split('T')[0];
  }

  const { data, error } = await supabase
    .from('english_vocabularies')
    .update(payload)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0] as EnglishVocabulary;
}

export async function deleteEnglishVocabulary(id: number) {
  const { error } = await supabase
    .from('english_vocabularies')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { message: 'Deleted successfully', id };
}

export async function addVocabulariesBulk(words: Partial<VocabularyInput>[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const payload = words.map(word => ({
    ...word,
    user_id: user.id,
    last_reviewed_at: new Date().toISOString().split('T')[0]
  }));

  const { data, error } = await supabase
    .from('vocabularies')
    .insert(payload)
    .select();

  if (error) throw error;
  return data as Vocabulary[];
}

export async function addEnglishVocabulariesBulk(words: Partial<EnglishVocabularyInput>[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const payload = words.map(word => ({
    ...word,
    user_id: user.id,
    last_reviewed_at: new Date().toISOString().split('T')[0]
  }));

  const { data, error } = await supabase
    .from('english_vocabularies')
    .insert(payload)
    .select();

  if (error) throw error;
  return data as EnglishVocabulary[];
}
