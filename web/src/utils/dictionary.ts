import { convertPinyinNumberToAccent } from './pinyinUtils';

// Types
export interface ChineseMatch {
  chinese: string;
  pinyin: string;
  han_viet: string;
  meaning: string;
}

export interface EnglishMatch {
  word: string;
  transliteration: string;
  meaning: string;
  suggestions?: EnglishMatch[];
}

interface DictItem {
  hanviet: string[];
  pinyin: string;
}

// Memory caches
const dictMap = new Map<string, DictItem[]>();
const englishDictMap = new Map<string, EnglishMatch>();

let isChineseDictLoading = false;
let isChineseDictLoaded = false;
let isEnglishDictLoading = false;
let isEnglishDictLoaded = false;

// CSV Parser helper
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Load Chinese Dictionary
async function ensureChineseDictLoaded() {
  if (isChineseDictLoaded) return;
  if (isChineseDictLoading) {
    // Wait until loaded
    while (isChineseDictLoading) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return;
  }
  
  isChineseDictLoading = true;
  try {
    const response = await fetch('/data/hanviet.csv');
    if (!response.ok) throw new Error('Failed to load hanviet.csv');
    const content = await response.text();
    const lines = content.split(/\r?\n/);
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = parseCSVLine(line);
      if (parts.length < 3) continue;
      
      const char = parts[0].trim();
      let hanvietStr = parts[1].trim();
      const pinyin = parts[2].trim();
      
      hanvietStr = hanvietStr.replace(/[\[\]']/g, '');
      const hanvietList = hanvietStr ? hanvietStr.split(',').map(s => s.trim()) : [];
      
      if (!dictMap.has(char)) {
        dictMap.set(char, []);
      }
      dictMap.get(char)!.push({
        hanviet: hanvietList,
        pinyin: pinyin
      });
    }
    console.log(`Loaded Chinese dictionary in browser: ${dictMap.size} characters.`);
    isChineseDictLoaded = true;
  } catch (error) {
    console.error('Error loading Chinese dictionary in client:', error);
  } finally {
    isChineseDictLoading = false;
  }
}

// Load English Dictionary
async function ensureEnglishDictLoaded() {
  if (isEnglishDictLoaded) return;
  if (isEnglishDictLoading) {
    while (isEnglishDictLoading) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return;
  }
  
  isEnglishDictLoading = true;
  try {
    const response = await fetch('/data/english.csv');
    if (!response.ok) throw new Error('Failed to load english.csv');
    const content = await response.text();
    const lines = content.split(/\r?\n/);
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = parseCSVLine(line);
      if (parts.length < 3) continue;
      
      const word = parts[0].trim().toLowerCase();
      const transliteration = parts[1].trim();
      const meaning = parts[2].trim();
      
      englishDictMap.set(word, {
        word: parts[0].trim(),
        transliteration,
        meaning
      });
    }
    console.log(`Loaded English dictionary in browser: ${englishDictMap.size} words.`);
    isEnglishDictLoaded = true;
  } catch (error) {
    console.error('Error loading English dictionary in client:', error);
  } finally {
    isEnglishDictLoading = false;
  }
}

// Client Lookup API: Chinese
export async function lookupChineseWord(word: string): Promise<ChineseMatch> {
  await ensureChineseDictLoaded();
  
  const pinyinList: string[] = [];
  const hanvietList: string[] = [];
  
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const match = dictMap.get(char);
    if (match && match.length > 0) {
      const item = match[0];
      const pinyinAccent = convertPinyinNumberToAccent(item.pinyin);
      pinyinList.push(pinyinAccent);
      
      const hv = item.hanviet.length > 0 ? item.hanviet[0] : '';
      hanvietList.push(hv);
    } else {
      pinyinList.push(char);
      hanvietList.push(char);
    }
  }
  
  const pinyin = pinyinList.join(' ');
  const han_viet = hanvietList.join(' ');
  let meaning = '';
  
  const commonMeanings: Record<string, string> = {
    '城里': 'trong thành phố',
    '郊区': 'ngoại ô',
    '空气': 'không khí',
    '笔记': 'ghi chép',
    '拜托': 'nhờ vả',
    '学习': 'học tập',
    '汉语': 'tiếng Trung',
    '词汇': 'từ vựng',
    '努力': 'nỗ lực, cố gắng',
    '简单': 'đơn giản',
    '复杂': 'phức tạp',
    '感谢': 'cảm ơn',
    '电脑': 'máy tính',
    '手机': 'điện thoại di động',
    '老师': 'thầy cô giáo',
    '学生': 'học sinh, sinh viên',
    '学校': 'trường học',
    '咖啡': 'cà phê',
    '面包': 'bánh mì',
    '苹果': 'quả táo',
    '西瓜': 'dưa hấu',
    '朋友': 'bạn bè',
    '时间': 'thời gian',
    '工作': 'công việc'
  };
  
  if (commonMeanings[word]) {
    meaning = commonMeanings[word];
  }
  
  return {
    chinese: word,
    pinyin,
    han_viet,
    meaning
  };
}

// Client Lookup API: English
export async function lookupEnglishWord(word: string): Promise<EnglishMatch> {
  await ensureEnglishDictLoaded();
  
  const searchWord = word.trim().toLowerCase();
  let match = englishDictMap.get(searchWord);
  
  // Find suggestions from local dictionary
  const suggestions: EnglishMatch[] = [];
  if (searchWord.length > 0) {
    for (const key of englishDictMap.keys()) {
      if (key.startsWith(searchWord)) {
        suggestions.push(englishDictMap.get(key)!);
        if (suggestions.length >= 8) break;
      }
    }
  }
  
  if (match) {
    return {
      ...match,
      suggestions
    };
  }
  
  // Fallback: fetch online
  let transliteration = '';
  let meaning = '';
  
  // 1. Dictionary phonetic
  try {
    const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(searchWord)}`);
    if (dictRes.ok) {
      const dictData = await dictRes.json();
      if (Array.isArray(dictData) && dictData.length > 0) {
        const entry = dictData[0];
        transliteration = entry.phonetic || '';
        if (!transliteration && entry.phonetics) {
          const foundText = entry.phonetics.find((p: any) => p.text && p.text.trim())?.text;
          if (foundText) transliteration = foundText;
        }
      }
    }
  } catch (err) {
    console.error('Error fetching Dictionary API:', err);
  }
  
  // 2. Google single translation
  try {
    const translateRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(searchWord)}`);
    if (translateRes.ok) {
      const translateData = await translateRes.json();
      if (Array.isArray(translateData) && translateData[0] && translateData[0][0]) {
        meaning = translateData[0][0][0] || '';
      }
    }
  } catch (err) {
    console.error('Error fetching Google Translate:', err);
  }
  
  if (transliteration || meaning) {
    const dynamicMatch = {
      word: word.trim(),
      transliteration: transliteration || '',
      meaning: meaning || ''
    };
    englishDictMap.set(searchWord, dynamicMatch);
    return {
      ...dynamicMatch,
      suggestions
    };
  }
  
  return {
    word,
    transliteration: '',
    meaning: '',
    suggestions
  };
}
