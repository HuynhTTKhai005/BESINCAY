const Product = require('../models/product.model.js');
const { createJsonResponse } = require('./openai.service');
const { parseFoodIntent } = require('./intentParser.service');
const { formatMenuForPrompt, normalizeMenuItem, formatPrice } = require('../utils/menuFormatter');
const { expandKeywords, textContainsKeyword, normalizeText } = require('../utils/foodKeywords.util');

const MAX_SUGGESTIONS = 3;
const CATEGORY_PRIORITY = {
  spicy: 0,
  appetizer: 1,
  drink: 2
};
const PRIORITY_SLOTS = ['spicy', 'appetizer', 'drink'];
const CATEGORY_EXCLUSION_KEYWORDS = {
  drink: ['nuoc', 'uong', 'drink', 'tra', 'soda', 'coca', 'sprite'],
  appetizer: ['khai vi', 'an vat', 'starter'],
  spicy: ['mi cay', 'mi', 'mì', 'spicy']
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildMenuQuery = (intent) => {
  const conditions = [
    { is_available: true },
    {
      $expr: {
        $gt: [{ $ifNull: ['$stock', '$stock_quantity'] }, 0]
      }
    }
  ];

  if (intent.price_max !== null) {
    conditions.push({ base_price_cents: { $lte: intent.price_max } });
  }

  if (typeof intent.is_spicy === 'boolean') {
    conditions.push({ is_spicy: intent.is_spicy });
  }

  const includeKeywords = Array.from(new Set([...(intent.keywords || []), ...(intent.include_keywords || [])]));
  if (includeKeywords.length > 0) {
    conditions.push({
      $and: includeKeywords.map((keyword) => ({
        $or: [
          { name: { $regex: escapeRegex(keyword), $options: 'i' } },
          { description: { $regex: escapeRegex(keyword), $options: 'i' } }
        ]
      }))
    });
  }

  return { $and: conditions };
};

const applyExcludeKeywords = (items, excludeKeywords = []) => {
  const expanded = expandKeywords(excludeKeywords);
  if (expanded.length === 0) return items;

  return items.filter((item) => {
    const haystack = normalizeText(`${item.name} ${item.description}`);
    return !expanded.some((keyword) => textContainsKeyword(haystack, keyword));
  });
};

const getCategoryPriority = (item) => {
  const slug = String(item?.category_slug || '').toLowerCase();
  return Object.prototype.hasOwnProperty.call(CATEGORY_PRIORITY, slug) ? CATEGORY_PRIORITY[slug] : 99;
};

const prioritizeMenu = (items) =>
  [...items].sort((a, b) => {
    const priorityDiff = getCategoryPriority(a) - getCategoryPriority(b);
    if (priorityDiff !== 0) return priorityDiff;
    return a.base_price_cents - b.base_price_cents || a.name.localeCompare(b.name);
  });

const getExcludedCategories = (intent = {}) => {
  const terms = [...(intent.exclude_keywords || []), ...(intent.keywords || [])]
    .map((item) => normalizeText(item))
    .filter(Boolean);

  return new Set(
    Object.entries(CATEGORY_EXCLUSION_KEYWORDS)
      .filter(([, keywords]) => keywords.some((keyword) => terms.some((term) => term.includes(keyword) || keyword.includes(term))))
      .map(([category]) => category)
  );
};

const pickOnePerPriorityGroup = (items, intent = {}) => {
  const sorted = prioritizeMenu(items);
  const results = [];
  const excludedCategorySet = getExcludedCategories(intent);

  PRIORITY_SLOTS.forEach((slot) => {
    if (excludedCategorySet.has(slot)) return;
    const found = sorted.find((item) => String(item.category_slug || '').toLowerCase() === slot);
    if (found) results.push(found);
  });

  if (results.length < MAX_SUGGESTIONS) {
    sorted.forEach((item) => {
      if (results.length >= MAX_SUGGESTIONS) return;
      if (excludedCategorySet.has(String(item.category_slug || '').toLowerCase())) return;
      if (!results.some((selected) => selected.id === item.id)) {
        results.push(item);
      }
    });
  }

  return results.slice(0, MAX_SUGGESTIONS);
};

const fallbackRecommendations = (items, intent) =>
  pickOnePerPriorityGroup(items, intent).map((item) => ({
    name: item.name,
    reason:
      intent.price_max !== null
        ? `Phu hop ngan sach, gia ${formatPrice(item.base_price_cents)}.`
        : `Phu hop yeu cau va dang san co.`
  }));

const sanitizeRecommendations = (recommendations, menuItems) => {
  const validNames = new Map(menuItems.map((item) => [item.name.toLowerCase(), item]));
  const normalized = Array.isArray(recommendations) ? recommendations : recommendations?.suggestions;
  if (!Array.isArray(normalized)) return [];

  return normalized
    .map((item) => {
      const name = String(item?.name || '').trim();
      const reason = String(item?.reason || '').trim();
      const matched = validNames.get(name.toLowerCase());
      if (!matched) return null;
      return {
        name: matched.name,
        reason: reason || `Phu hop vi ${matched.description || 'dang san co va hop yeu cau'}.`
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const menuA = validNames.get(a.name.toLowerCase());
      const menuB = validNames.get(b.name.toLowerCase());
      return getCategoryPriority(menuA) - getCategoryPriority(menuB);
    })
    .filter((item, index, array) => {
      const menuItem = validNames.get(item.name.toLowerCase());
      const slug = String(menuItem?.category_slug || '').toLowerCase();
      if (!PRIORITY_SLOTS.includes(slug)) return true;
      return array.findIndex((candidate) => {
        const candidateMenu = validNames.get(candidate.name.toLowerCase());
        return String(candidateMenu?.category_slug || '').toLowerCase() === slug;
      }) === index;
    })
    .slice(0, MAX_SUGGESTIONS);
};

const generateRecommendations = async ({ originalMessage, filteredMenu }) => {
  const systemPrompt =
    'Ban la tro ly goi y mon an cho nha hang. Dua tren menu da loc san, hay tra ve JSON co khoa "suggestions" la mang toi da 3 phan tu. Moi phan tu gom { "name": string, "reason": string }. Chi duoc chon ten mon ton tai trong menu. Ly do ngan, ro, bang tieng Viet.';

  const userPrompt = `Tin nhan nguoi dung: ${originalMessage}

Menu da loc:
${formatMenuForPrompt(filteredMenu)}

Tra ve JSON dung dinh dang:
{
  "suggestions": [
    { "name": "...", "reason": "..." }
  ]
}`;

  return createJsonResponse({ systemPrompt, userPrompt });
};

const recommendFood = async (message) => {
  const intent = await parseFoodIntent(message);
  let menuDocs = await Product.find(buildMenuQuery(intent))
    .select('name description base_price_cents is_spicy is_available stock stock_quantity category_id')
    .populate('category_id', 'slug')
    .sort({ base_price_cents: 1, name: 1 })
    .limit(30);

  if (menuDocs.length === 0 && (intent.keywords.length > 0 || intent.include_keywords.length > 0)) {
    const relaxedIntent = { ...intent, keywords: [], include_keywords: [] };
    menuDocs = await Product.find(buildMenuQuery(relaxedIntent))
      .select('name description base_price_cents is_spicy is_available stock stock_quantity category_id')
      .populate('category_id', 'slug')
      .sort({ base_price_cents: 1, name: 1 })
      .limit(30);
  }

  const filteredMenu = prioritizeMenu(applyExcludeKeywords(menuDocs.map(normalizeMenuItem), intent.exclude_keywords));
  if (filteredMenu.length === 0) {
    return {
      intent,
      suggestions: []
    };
  }

  try {
    const aiRecommendations = await generateRecommendations({
      originalMessage: message,
      filteredMenu: pickOnePerPriorityGroup(filteredMenu, intent)
    });

    const sanitized = sanitizeRecommendations(aiRecommendations, filteredMenu);
    if (sanitized.length > 0) {
      return {
        intent,
        suggestions: sanitized
      };
    }
  } catch (_error) {
    // fall through to backend fallback
  }

  return {
    intent,
    suggestions: fallbackRecommendations(filteredMenu, intent)
  };
};

module.exports = { recommendFood, buildMenuQuery, fallbackRecommendations, sanitizeRecommendations };
