const { createJsonResponse } = require('./openai.service');
const { normalizeText } = require('../utils/foodKeywords.util');

const parseBudgetFallback = (message) => {
  const text = normalizeText(message).replace(/\./g, '').replace(/,/g, '');
  const thousandMatch = text.match(/(\d+(?:\.\d+)?)\s*(k|nghin|ngan)/i);
  if (thousandMatch) return Math.round(Number(thousandMatch[1]) * 1000);

  const millionMatch = text.match(/(\d+(?:\.\d+)?)\s*(tr|trieu)/i);
  if (millionMatch) return Math.round(Number(millionMatch[1]) * 1000000);

  const plainMatch = text.match(/\b(\d{5,7})\b/);
  return plainMatch ? Number(plainMatch[1]) : null;
};

const fallbackParseIntent = (message) => {
  const text = normalizeText(message);
  const peopleMatch = text.match(/(\d+)\s*nguoi/);
  const excludeKeywords = [];
  const includeKeywords = [];

  const negativePatterns = [
    /khong an duoc ([^,.!?]+)/g,
    /khong an ([^,.!?]+)/g,
    /khong uong ([^,.!?]+)/g,
    /khong thich ([^,.!?]+)/g,
    /khong muon ([^,.!?]+)/g
  ];

  negativePatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const keyword = String(match[1] || '').trim();
      if (keyword) excludeKeywords.push(keyword);
    }
  });

  const positivePatterns = [
    /muon an ([^,.!?]+)/g,
    /an ([^,.!?]+)/g,
    /thich ([^,.!?]+)/g
  ];

  positivePatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const keyword = String(match[1] || '').trim();
      if (keyword && !keyword.startsWith('duoc ')) includeKeywords.push(keyword);
    }
  });

  const keywords = text
    .split(/[^a-z0-9]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2)
    .filter((part) => !['an', 'nhe', 'khong', 'cay', 'duoi', 'toi', 'muon', 'mon'].includes(part));

  return {
    price_max: parseBudgetFallback(text),
    is_spicy: /khong cay|it cay/.test(text) ? false : /cay/.test(text) ? true : null,
    include_keywords: Array.from(new Set(includeKeywords)).slice(0, 6),
    exclude_keywords: Array.from(new Set(excludeKeywords)).slice(0, 6),
    keywords: Array.from(new Set(keywords)).slice(0, 6),
    intent: /an nhe|nhe bung|an vat/.test(text) ? 'light' : /an no|combo|lau|full/.test(text) ? 'full' : null,
    people: peopleMatch ? Number(peopleMatch[1]) : null
  };
};

const sanitizeIntent = (intent = {}) => ({
  price_max: Number.isFinite(Number(intent.price_max)) ? Number(intent.price_max) : null,
  is_spicy: typeof intent.is_spicy === 'boolean' ? intent.is_spicy : null,
  include_keywords: Array.isArray(intent.include_keywords)
    ? intent.include_keywords.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8)
    : [],
  exclude_keywords: Array.isArray(intent.exclude_keywords)
    ? intent.exclude_keywords.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8)
    : [],
  keywords: Array.isArray(intent.keywords)
    ? intent.keywords.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8)
    : [],
  intent: ['light', 'full'].includes(intent.intent) ? intent.intent : null,
  people: Number.isFinite(Number(intent.people)) ? Number(intent.people) : null
});

const parseFoodIntent = async (message) => {
  const systemPrompt =
    'Ban la bo phan phan tich intent cho he thong goi y mon an. Hay doc cau tieng Viet va tra ve duy nhat JSON voi cac truong: price_max (number|null), is_spicy (boolean|null), include_keywords (string[]), exclude_keywords (string[]), keywords (string[]), intent ("light"|"full"|null), people (number|null). Khong them bat ky text nao khac.';

  const userPrompt = `Tin nhan nguoi dung: ${message}

Yeu cau:
- price_max la ngan sach toi da theo VND neu co.
- is_spicy = false neu nguoi dung muon khong cay/it cay; true neu ho muon cay.
- include_keywords la cac mon/nguyen lieu nguoi dung muon an.
- exclude_keywords la cac mon/nguyen lieu nguoi dung khong an duoc, khong thich, khong muon.
- keywords la tu khoa mon an/nguyen lieu quan trong, khong bao gom tu de du.
- intent = "light" cho an nhe, an vat; "full" cho an no, bua chinh, lau, combo.
- people la so nguoi neu co.

Tra ve JSON thuan.`;

  try {
    const aiIntent = await createJsonResponse({ systemPrompt, userPrompt });
    return sanitizeIntent(aiIntent);
  } catch (_error) {
    return sanitizeIntent(fallbackParseIntent(message));
  }
};

module.exports = { parseFoodIntent, fallbackParseIntent, sanitizeIntent };
