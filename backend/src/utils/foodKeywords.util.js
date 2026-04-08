const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

const KEYWORD_GROUPS = {
  'hai san': ['hai san', 'tom', 'muc', 'ca', 'cha ca', 'ca vien', 'doi sun'],
  tom: ['tom'],
  muc: ['muc'],
  ca: ['ca', 'cha ca', 'ca vien'],
  bo: ['bo', 'bo my', 'bo vien'],
  heo: ['heo', 'thit heo'],
  ga: ['ga', 'dui ga', 'ga vien'],
  'xuc xich': ['xuc xich'],
  'pho mai': ['pho mai', 'phomai'],
  tokbokki: ['tokbokki']
};

const expandKeyword = (keyword) => {
  const normalized = normalizeText(keyword);
  if (!normalized) return [];

  if (KEYWORD_GROUPS[normalized]) return KEYWORD_GROUPS[normalized];

  for (const [group, aliases] of Object.entries(KEYWORD_GROUPS)) {
    if (normalized.includes(group) || aliases.includes(normalized)) {
      return aliases;
    }
  }

  return [normalized];
};

const expandKeywords = (keywords = []) =>
  Array.from(
    new Set(
      keywords
        .flatMap((keyword) => expandKeyword(keyword))
        .map((keyword) => normalizeText(keyword))
        .filter(Boolean)
    )
  );

const textContainsKeyword = (text, keyword) => {
  const haystack = normalizeText(text);
  const needle = normalizeText(keyword);
  return Boolean(needle) && haystack.includes(needle);
};

module.exports = { normalizeText, expandKeyword, expandKeywords, textContainsKeyword };
