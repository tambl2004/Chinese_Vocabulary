import { convertPinyinNumberToAccent } from './pinyinUtils';
import * as OpenCC from 'opencc-js';

const s2tConverter = OpenCC.Converter({ from: 'cn', to: 'tw' });

// Types
export interface ChineseMatch {
  chinese: string;
  pinyin: string;
  han_viet: string;
  meaning: string;
  word_type?: string;
}

export interface EnglishMatch {
  word: string;
  transliteration: string;
  meaning: string;
  word_type?: string;
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
  
  const hanvietList: string[] = [];
  const fallbackPinyinList: string[] = [];
  
  const traditionalWord = s2tConverter(word);
  
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const tradChar = traditionalWord[i] || char;
    const match = dictMap.get(tradChar) || dictMap.get(char);
    if (match && match.length > 0) {
      const item = match[0];
      const pinyinAccent = convertPinyinNumberToAccent(item.pinyin);
      fallbackPinyinList.push(pinyinAccent);
      
      const hv = item.hanviet.length > 0 ? item.hanviet[0] : '';
      hanvietList.push(hv);
    } else {
      fallbackPinyinList.push(char);
      hanvietList.push(char);
    }
  }
  
  const han_viet = hanvietList.join(' ');
  let pinyin = fallbackPinyinList.join(' ');
  let meaning = '';
  let word_type = 'Danh từ';

  try {
    const [viRes, enRes] = await Promise.all([
      fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=vi&dt=t&dt=rm&q=${encodeURIComponent(word)}`),
      fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&hl=en&dt=bd&q=${encodeURIComponent(word)}`)
    ]);

    if (viRes.ok) {
      const viData = await viRes.json();
      if (viData && viData[0]) {
        // Meaning is at data[0][0][0]
        if (viData[0][0] && viData[0][0][0]) {
          meaning = viData[0][0][0].trim();
        }
        // Pinyin is at data[0][1] and index 3
        if (viData[0][1] && viData[0][1][3]) {
          pinyin = viData[0][1][3].trim().toLowerCase();
        }
      }
    }

    const posList: string[] = [];

    if (enRes.ok) {
      const enData = await enRes.json();
      if (enData && enData[1]) {
        for (const item of enData[1]) {
          if (item && item[0]) {
            const enPos = item[0].toLowerCase();
            let mapped = '';
            if (enPos.includes('noun')) {
              mapped = 'Danh từ';
            } else if (enPos.includes('verb')) {
              mapped = 'Động từ';
            } else if (enPos.includes('adjective')) {
              mapped = 'Tính từ';
            } else if (enPos.includes('adverb')) {
              mapped = 'Phó từ';
            } else if (enPos.includes('pronoun')) {
              mapped = 'Đại từ';
            } else if (enPos.includes('preposition')) {
              mapped = 'Giới từ';
            } else if (enPos.includes('conjunction')) {
              mapped = 'Liên từ';
            } else if (enPos.includes('interjection')) {
              mapped = 'Thán từ';
            } else if (enPos.includes('numeral') || enPos.includes('number') || enPos.includes('cardinal')) {
              mapped = 'Lượng từ';
            }
            
            if (mapped && !posList.includes(mapped)) {
              posList.push(mapped);
            }
          }
        }
      }
    }

    // Refine word type using Vietnamese meaning heuristic
    if (meaning) {
      const cleanMeaning = meaning.trim().toLowerCase();
      const firstWord = cleanMeaning.split(/[\s,;-]+/)[0];
      
      const verbStarters = new Set([
        'nhảy', 'chạy', 'bơi', 'đi', 'đến', 'về', 'gặp', 'nói', 'kể', 'hỏi', 'nghe', 'xem', 'nhìn', 'thấy', 
        'đọc', 'viết', 'vẽ', 'học', 'dạy', 'ăn', 'uống', 'ngủ', 'chơi', 'làm', 'chế', 'sửa', 'mua', 'bán', 
        'mượn', 'trả', 'gửi', 'nhận', 'mang', 'cầm', 'nắm', 'lấy', 'cho', 'tặng', 'đấu', 'đánh', 'kéo', 'đẩy',
        'hát', 'múa', 'khóc', 'cười', 'tắm', 'giặt', 'chụp', 'leo', 'trèo', 'bay', 'lội',
        'nghĩ', 'hiểu', 'biết', 'yêu', 'ghét', 'thích', 'mong', 'muốn', 'sợ', 'lo', 'giúp', 'chia', 'cắt', 
        'mở', 'đóng', 'tắt', 'bật', 'quay', 'xoay', 'luyện', 'phát', 'tiến', 'sử', 'cảm', 'quyết', 'tin', 
        'mơ', 'hy', 'tham', 'tổ',
        'tập', 'bắt', 'kết', 'hoàn', 'tìm', 'tránh', 'chờ', 'hẹn', 'phản', 'đồng', 'chấp', 'từ', 'ngăn', 
        'cấm', 'đề', 'khuyên', 'nhắc', 'chú', 'quan', 'chăm', 'giải', 'xử', 'thực', 'áp', 'tạo', 'gây', 
        'dẫn', 'thay', 'biến', 'tăng', 'giảm', 'xuất'
      ]);

      const adjStarters = new Set([
        'đẹp', 'xấu', 'cao', 'thấp', 'ngắn', 'dài', 'to', 'nhỏ', 'lớn', 'bé', 'nóng', 'lạnh', 'ấm', 'mát',
        'nhanh', 'chậm', 'tốt', 'tồi', 'giàu', 'nghèo', 'khỏe', 'yếu', 'thông', 'minh', 'ngu', 'dốt', 'chăm',
        'lười', 'sạch', 'bẩn', 'thơm', 'thối', 'ngọt', 'chua', 'cay', 'mặn', 'đắng', 'nhạt', 'khô', 'ướt',
        'đầy', 'trống', 'nặng', 'nhẹ', 'sáng', 'tối', 'mới', 'cũ', 'trẻ', 'già', 'đắt', 'rẻ', 'dễ', 'khó',
        'đúng', 'sai', 'gần', 'xa', 'sâu', 'nông', 'rộng', 'hẹp', 'vui', 'buồn', 'vất', 'khó', 'khổ',
        'sướng', 'khác', 'giống', 'quen', 'lạ', 'nguy', 'hiểm', 'an', 'toàn', 'tự', 'do', 'hạnh', 'phúc'
      ]);

      const classifierStarters = new Set([
        'cái', 'con', 'chiếc', 'tấm', 'bức', 'quyển', 'cuốn', 'bản', 'tờ', 'sợi', 'cây', 'quả', 'trái', 
        'hạt', 'củ', 'bông', 'đoá', 'ngôi', 'gian', 'căn', 'khẩu', 'lưỡi', 'cỗ', 'viên', 'cặp', 'đôi', 
        'bộ', 'nhóm', 'đàn', 'lần', 'lượt', 'chuyến'
      ]);

      const numeralStarters = new Set([
        'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'trăm', 'nghìn', 'ngàn', 
        'vạn', 'triệu', 'tỷ', 'lăm', 'tư', 'mươi'
      ]);

      const pronounStarters = new Set([
        'tới', 'tôi', 'tao', 'tớ', 'mình', 'chúng', 'bạn', 'mày', 'cậu', 'anh', 'chị', 'ông', 'bà', 'nó', 'họ', 
        'ai', 'gì', 'nào', 'đâu', 'đây', 'kia', 'ấy', 'này'
      ]);

      const prepositionStarters = new Set([
        'ở', 'tại', 'trong', 'ngoài', 'trên', 'dưới', 'trước', 'sau', 'giữa', 'đến', 'từ', 'bằng', 'với', 
        'cho', 'vì', 'do', 'bởi', 'về'
      ]);

      const conjunctionStarters = new Set([
        'và', 'hoặc', 'nhưng', 'mà', 'nếu', 'thì', 'tuy', 'như', 'hơn'
      ]);

      const particleStarters = new Set([
        'của', 'rồi', 'nhỉ', 'nhé', 'nha', 'chứ', 'sao', 'quá', 'lắm', 'thật'
      ]);

      const adverbStarters = new Set([
        'rất', 'quá', 'lắm', 'hơi', 'cực', 'hoàn', 'đều', 'cũng', 'đã', 'đang', 'sẽ', 'chưa', 'không', 
        'chẳng', 'đừng', 'hãy', 'luôn', 'thường', 'vừa', 'mới', 'lại', 'chỉ'
      ]);

      const interjectionStarters = new Set([
        'ôi', 'a', 'ơi', 'dạ', 'vâng'
      ]);

      const detectedPos = [];
      if (verbStarters.has(firstWord)) detectedPos.push('Động từ');
      if (adjStarters.has(firstWord)) detectedPos.push('Tính từ');
      if (classifierStarters.has(firstWord)) detectedPos.push('Lượng từ');
      if (numeralStarters.has(firstWord)) detectedPos.push('Số từ');
      if (pronounStarters.has(firstWord)) detectedPos.push('Đại từ');
      if (prepositionStarters.has(firstWord)) detectedPos.push('Giới từ');
      if (conjunctionStarters.has(firstWord)) detectedPos.push('Liên từ');
      if (particleStarters.has(firstWord) || ['的', '了', '吧', '吗', '呢', '着', '过'].includes(word)) detectedPos.push('Trợ từ');
      if (adverbStarters.has(firstWord)) detectedPos.push('Phó từ');
      if (interjectionStarters.has(firstWord)) detectedPos.push('Thán từ');

      // If we have highly specific grammar categories, remove generic "Danh từ" unless it's a Verb/Adjective
      const specificCategories = ['Lượng từ', 'Số từ', 'Trợ từ', 'Liên từ', 'Thán từ', 'Phó từ', 'Giới từ', 'Đại từ'];
      const hasSpecific = detectedPos.some(pos => specificCategories.includes(pos));
      
      if (hasSpecific) {
        const index = posList.indexOf('Danh từ');
        if (index > -1) {
          posList.splice(index, 1);
        }
      }

      // Merge detected POS into posList
      for (const pos of detectedPos) {
        if (!posList.includes(pos)) {
          posList.push(pos);
        }
      }
    }

    // Sort by priority map to ensure primary word types like Động từ/Tính từ appear first
    const posPriority: Record<string, number> = {
      'Động từ': 1,
      'Tính từ': 2,
      'Danh từ': 3,
      'Phó từ': 4,
      'Đại từ': 5,
      'Giới từ': 6,
      'Liên từ': 7,
      'Thán từ': 8,
      'Lượng từ': 9,
      'Số từ': 10,
      'Trợ từ': 11,
      'Khác': 12
    };

    posList.sort((a, b) => {
      const prioA = posPriority[a] || 99;
      const prioB = posPriority[b] || 99;
      return prioA - prioB;
    });

    word_type = posList.length > 0 ? posList.join('/') : 'Danh từ';

  } catch (error) {
    console.error('Error fetching online pinyin/meaning/wordtype:', error);
  }

  return {
    chinese: word,
    pinyin,
    han_viet,
    meaning,
    word_type
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
  let word_type = 'Danh từ';
  
  // 1. Dictionary phonetic & POS
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
        if (entry.meanings && entry.meanings.length > 0) {
          const pos = entry.meanings[0].partOfSpeech?.toLowerCase() || '';
          if (pos.includes('noun')) {
            word_type = 'Danh từ';
          } else if (pos.includes('verb')) {
            word_type = 'Động từ';
          } else if (pos.includes('adjective')) {
            word_type = 'Tính từ';
          } else if (pos.includes('adverb')) {
            word_type = 'Phó từ';
          } else if (pos.includes('pronoun')) {
            word_type = 'Đại từ';
          } else if (pos.includes('preposition')) {
            word_type = 'Giới từ';
          } else if (pos.includes('conjunction')) {
            word_type = 'Liên từ';
          } else if (pos.includes('interjection')) {
            word_type = 'Thán từ';
          } else if (pos.includes('numeral') || pos.includes('number') || pos.includes('cardinal')) {
            word_type = 'Lượng từ';
          } else {
            word_type = 'Khác';
          }
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
      meaning: meaning || '',
      word_type
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
    word_type: 'Danh từ',
    suggestions
  };
}

export interface TatoebaExample {
  sentence: string;
  translation: string;
  pinyin?: string;
}

export async function fetchGeminiExample(
  word: string,
  meaning: string,
  wordType: string,
  lang: 'cmn' | 'eng'
): Promise<TatoebaExample> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Không tìm thấy câu ví dụ nào trong kho dữ liệu Tatoeba. (Bạn có thể cấu hình khóa VITE_GEMINI_API_KEY trong file web/.env.local để tự động sinh câu ví dụ bằng AI).'
    );
  }

  const isChinese = lang === 'cmn';
  const prompt = isChinese
    ? `Generate a simple, natural example sentence for the Chinese word '${word}' (meaning: ${meaning}, word type: ${wordType || 'danh từ'}). Provide your response as a JSON object with exactly three keys: 'sentence' (the Chinese sentence), 'translation' (natural translation in Vietnamese), and 'pinyin' (pinyin for the Chinese sentence with proper tones). Do not return any other text, only the JSON.`
    : `Generate a simple, natural example sentence for the English word '${word}' (meaning: ${meaning}, word type: ${wordType || 'danh từ'}). Provide your response as a JSON object with exactly two keys: 'sentence' (the English sentence) and 'translation' (natural translation in Vietnamese). Do not return any other text, only the JSON.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Lỗi kết nối với Gemini API: ${response.statusText}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini không phản hồi dữ liệu hợp lệ.');
  }

  const parsed = JSON.parse(text);
  if (!parsed.sentence || !parsed.translation) {
    throw new Error('Dữ liệu ví dụ sinh bởi AI không hợp lệ.');
  }

  return {
    sentence: parsed.sentence,
    translation: parsed.translation,
    pinyin: parsed.pinyin || undefined
  };
}

export async function fetchTatoebaExample(
  word: string, 
  lang: 'cmn' | 'eng',
  meaning: string = '',
  wordType: string = ''
): Promise<TatoebaExample> {
  const cleanWord = word.trim();
  
  // 1. Try to find a sentence with direct Vietnamese translation in Tatoeba
  const urlWithVietnamese = `https://api.tatoeba.org/v1/sentences?q=${encodeURIComponent(cleanWord)}&lang=${lang}&trans:lang=vie&sort=relevance&limit=3`;
  
  try {
    const response = await fetch(urlWithVietnamese);
    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        // Randomize among returned results
        const randomIndex = Math.floor(Math.random() * data.data.length);
        const selectedMatch = data.data[randomIndex];
        const sentence = selectedMatch.text;
        const translationObj = selectedMatch.translations?.find((t: any) => t.lang === 'vie') || selectedMatch.translations?.[0];
        
        if (translationObj) {
          const translation = translationObj.text;
          let pinyin = '';
          if (lang === 'cmn') {
            try {
              const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=vi&dt=t&dt=rm&q=${encodeURIComponent(sentence)}`;
              const transRes = await fetch(translateUrl);
              if (transRes.ok) {
                const transData = await transRes.json();
                if (transData && transData[0] && transData[0][1] && transData[0][1][3]) {
                  pinyin = transData[0][1][3].trim();
                }
              }
            } catch (err) {
              console.error('Failed to translate sentence to pinyin:', err);
            }
          }
          return { sentence, translation, pinyin: pinyin || undefined };
        }
      }
    }
  } catch (err) {
    console.error('Error fetching direct Vietnamese example from Tatoeba:', err);
  }

  // 2. Fallback: Search for any sentence in Tatoeba (even without direct Vietnamese translation)
  // and translate it to Vietnamese on the fly!
  try {
    const fallbackUrl = `https://api.tatoeba.org/v1/sentences?q=${encodeURIComponent(cleanWord)}&lang=${lang}&sort=relevance&limit=3`;
    const response = await fetch(fallbackUrl);
    
    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        // Randomize fallback results
        const randomIndex = Math.floor(Math.random() * data.data.length);
        const selectedMatch = data.data[randomIndex];
        const sentence = selectedMatch.text;

        // Translate the sentence using Google Translate
        try {
          const sl = lang === 'cmn' ? 'zh-CN' : 'en';
          const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=vi&dt=t&dt=rm&q=${encodeURIComponent(sentence)}`;
          const transRes = await fetch(translateUrl);
          if (transRes.ok) {
            const transData = await transRes.json();
            let translation = '';
            let pinyin = '';

            if (transData && transData[0]) {
              if (transData[0][0] && transData[0][0][0]) {
                translation = transData[0][0][0].trim();
              }
              if (lang === 'cmn' && transData[0][1] && transData[0][1][3]) {
                pinyin = transData[0][1][3].trim();
              }
            }

            if (translation) {
              return {
                sentence,
                translation,
                pinyin: pinyin || undefined
              };
            }
          }
        } catch (err) {
          console.error('Failed to translate fallback sentence:', err);
          // If translation fails, we check if there is an English translation in Tatoeba that we can use
          const enTrans = selectedMatch.translations?.find((t: any) => t.lang === 'eng');
          if (enTrans) {
            return {
              sentence,
              translation: `(Dịch tiếng Anh): ${enTrans.text}`
            };
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed fallback Tatoeba flow:', err);
  }

  // 3. Last fallback: Try generating the example using Gemini API
  return fetchGeminiExample(word, meaning, wordType, lang);
}

