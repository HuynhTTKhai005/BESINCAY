const Product = require('../models/product.model.js');
const Category = require('../models/category.model.js');
const { expandKeywords, textContainsKeyword } = require('../utils/foodKeywords.util');

const NOT_DELETED_CONDITION = { $or: [{ is_deleted: false }, { is_deleted: { $exists: false } }] };
const ACTIVE_CATEGORY_CONDITION = { $or: [{ is_active: true }, { is_active: { $exists: false } }] };
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const MAX_MESSAGE_LENGTH = 500;
const CATEGORY_PRIORITY = {
  spicy: 0,
  appetizer: 1,
  drink: 2
};
const PRIORITY_SLOTS = ['spicy', 'appetizer', 'drink'];
const CATEGORY_EXCLUSION_KEYWORDS = {
  drink: ['nuoc', 'uong', 'drink', 'tra', 'soda', 'coca', 'sprite'],
  appetizer: ['khai vi', 'an vat', 'starter'],
  spicy: ['mi cay', 'mi', 'spicy']
};
const STOPWORDS = new Set([
  'toi', 'muon', 'mình', 'minh', 'can', 'mon', 'mì', 'mi', 'co', 'có', 'khong', 'không',
  'cho', 'va', 'và', 'voi', 'với', 'them', 'thêm', 'giup', 'giúp', 'loai', 'bo', 'bỏ'
]);

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();

const normalizePrice = (value) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return amount >= 1000000 && amount % 100 === 0 ? Math.round(amount / 100) : Math.round(amount);
};

const filterExcludedProducts = (products, excludedTerms = []) => {
  const expandedExcludedTerms = expandKeywords(excludedTerms);
  if (expandedExcludedTerms.length === 0) return products;

  return products.filter((product) => {
    const haystack = normalizeText(`${product.name} ${product.description}`);
    return !expandedExcludedTerms.some((term) => textContainsKeyword(haystack, term));
  });
};

const getCategoryPriority = (product) => {
  const slug = String(product?.category?.slug || '').toLowerCase();
  return Object.prototype.hasOwnProperty.call(CATEGORY_PRIORITY, slug) ? CATEGORY_PRIORITY[slug] : 99;
};

const getExcludedCategories = (intent = {}) => {
  const terms = [...(intent.excludedTerms || []), ...(intent.keywordTerms || [])]
    .map((item) => normalizeText(item))
    .filter(Boolean);

  return new Set(
    Object.entries(CATEGORY_EXCLUSION_KEYWORDS)
      .filter(([, keywords]) => keywords.some((keyword) => terms.some((term) => term.includes(keyword) || keyword.includes(term))))
      .map(([category]) => category)
  );
};

const pickOnePerPriorityGroup = (products, intent = {}) => {
  const results = [];
  const excludedCategorySet = getExcludedCategories(intent);

  PRIORITY_SLOTS.forEach((slot) => {
    if (excludedCategorySet.has(slot)) return;
    const found = products.find((product) => String(product?.category?.slug || '').toLowerCase() === slot);
    if (found) results.push(found);
  });

  if (results.length < 3) {
    products.forEach((product) => {
      if (results.length >= 3) return;
      if (excludedCategorySet.has(String(product?.category?.slug || '').toLowerCase())) return;
      if (!results.some((selected) => selected._id === product._id)) {
        results.push(product);
      }
    });
  }

  return results.slice(0, 3);
};

const normalizeProduct = (productDoc) => {
  const product = productDoc.toObject ? productDoc.toObject() : productDoc;
  const stock = Number(product?.stock ?? product?.stock_quantity ?? 0);
  return {
    _id: String(product._id),
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    image_url: product.image_url || '',
    base_price_cents: normalizePrice(product.base_price_cents),
    price_text: `${normalizePrice(product.base_price_cents).toLocaleString('vi-VN')} VND`,
    category: {
      _id: product.category_id?._id ? String(product.category_id._id) : null,
      name: product.category_id?.name || 'Khac',
      slug: product.category_id?.slug || 'khac'
    },
    is_spicy: Boolean(product.is_spicy || product.category_id?.slug === 'spicy'),
    is_available: product.is_available !== false,
    is_active: product.is_active !== false,
    stock_quantity: stock
  };
};

const parseBudget = (message) => {
  const normalized = normalizeText(message)
    .replace(/\./g, '')
    .replace(/,/g, '');

  const millionMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(tr|triệu|trieu)/i);
  if (millionMatch) return Math.round(Number(millionMatch[1]) * 1000000);

  const thousandMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(k|nghìn|nghin|ngàn|ngan)/i);
  if (thousandMatch) return Math.round(Number(thousandMatch[1]) * 1000);

  const plainNumberMatch = normalized.match(/\b(\d{5,7})\b/);
  if (plainNumberMatch) return Math.round(Number(plainNumberMatch[1]));

  return null;
};

const inferIntent = (message) => {
  const text = normalizeText(message);
  const budget = parseBudget(text);
  const wantsLessSpicy = /(khong cay|it cay|nhe|cho be|tre em|de an)/i.test(text);
  const wantsSpicy = /(cay|sieu cay|cap do)/i.test(text);
  const wantsDrink = /(nuoc|uong|drink|tra|soda)/i.test(text);
  const wantsHotpot = /(lau|tokbokki)/i.test(text);
  const wantsSnack = /(khai vi|an vat|starter)/i.test(text);
  const likesSeafood = /(hai san|muc|tom|ca )/i.test(text) && !/(khong an|khong thich|khong muon)/i.test(text);
  const peopleMatch = text.match(/(\d+)\s*(nguoi)/i);
  const people = peopleMatch ? Number(peopleMatch[1]) : null;
  const excludedTerms = [];
  const includedTerms = [];

  const exclusionPatterns = [
    /khong an duoc ([^,.!?]+)/g,
    /khong an ([^,.!?]+)/g,
    /khong uong ([^,.!?]+)/g,
    /khong thich ([^,.!?]+)/g,
    /khong co ([^,.!?]+)/g,
    /khong muon ([^,.!?]+)/g,
    /bo ([^,.!?]+)/g,
    /loai ([^,.!?]+)/g
  ];

  exclusionPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const term = String(match[1] || '').trim();
      if (term) excludedTerms.push(term);
    }
  });

  const positivePatterns = [
    /co ([^,.!?]+)/g,
    /thich ([^,.!?]+)/g,
    /muon ([^,.!?]+)/g
  ];

  positivePatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const term = String(match[1] || '').trim();
      if (term) includedTerms.push(term);
    }
  });

  const keywordTerms = text
    .split(/[^a-z0-9]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2 && !STOPWORDS.has(part));

  return {
    budget,
    wantsLessSpicy,
    wantsSpicy,
    wantsDrink,
    wantsHotpot,
    wantsSnack,
    likesSeafood,
    people,
    excludedTerms,
    includedTerms,
    keywordTerms
  };
};

const scoreProduct = (product, intent, message) => {
  let score = 0;
  const text = normalizeText(`${product.name} ${product.description} ${product.category?.name} ${product.category?.slug}`);

  if (intent.wantsDrink && product.category.slug === 'drink') score += 6;
  if (intent.wantsHotpot && ['hotpot', 'tokbokki'].includes(product.category.slug)) score += 6;
  if (intent.wantsSnack && product.category.slug === 'appetizer') score += 5;
  if (intent.wantsLessSpicy && !product.is_spicy) score += 4;
  if (intent.wantsSpicy && product.is_spicy) score += 4;
  if (intent.likesSeafood && /(hai san|muc|tom|ca )/i.test(text)) score += 4;

  if (intent.budget) {
    if (product.base_price_cents <= intent.budget) score += 3;
    if (intent.people && product.base_price_cents <= intent.budget / Math.max(intent.people, 1)) score += 2;
  }

  intent.includedTerms.forEach((term) => {
    if (normalizeText(term).split(/\s+/).some((chunk) => chunk && text.includes(chunk))) {
      score += 5;
    }
  });

  const excludedMatched = intent.excludedTerms.some((term) => {
    const normalizedTerm = normalizeText(term);
    return normalizedTerm.split(/\s+/).some((chunk) => chunk && text.includes(chunk));
  });

  if (excludedMatched) {
    score -= 100;
  }

  intent.keywordTerms.forEach((keyword) => {
    if (text.includes(keyword)) score += 1;
  });

  if (product.is_active) score += 1;
  if (product.is_available) score += 1;
  if (product.stock_quantity > 0) score += 1;

  return score;
};

const buildFallbackReply = (message, products) => {
  const intent = inferIntent(message);
  const ranked = [...products]
    .map((product) => ({ product, score: scoreProduct(product, intent, message) }))
    .sort((a, b) =>
      b.score - a.score ||
      getCategoryPriority(a.product) - getCategoryPriority(b.product) ||
      a.product.base_price_cents - b.product.base_price_cents
    )
    .map((entry) => entry.product);

  let shortlisted = filterExcludedProducts(
    ranked.filter((product) => product.stock_quantity > 0),
    intent.excludedTerms
  );
  if (intent.budget) {
    const withinBudget = shortlisted.filter((product) => product.base_price_cents <= intent.budget);
    if (withinBudget.length > 0) shortlisted = withinBudget;
  }

  const suggestions = pickOnePerPriorityGroup(shortlisted, intent);
  if (suggestions.length === 0) {
    return {
      reply: 'Khong tim thay mon phu hop.',
      suggestions: products.slice(0, 3)
    };
  }

  return {
    reply: suggestions.map((product) => `${product.name} + ${product.price_text}.`).join(' '),
    suggestions
  };
};

const buildAiCandidateProducts = (message, products) => {
  const intent = inferIntent(message);
  const rankedProducts = [...products]
    .map((product) => ({ product, score: scoreProduct(product, intent, message) }))
    .sort((a, b) =>
      b.score - a.score ||
      getCategoryPriority(a.product) - getCategoryPriority(b.product) ||
      a.product.base_price_cents - b.product.base_price_cents
    )
    .map((entry) => entry.product);

  return pickOnePerPriorityGroup(filterExcludedProducts(rankedProducts, intent.excludedTerms), intent);
};

const buildPrompt = (message, history, products) => {
  const compactProducts = products.map((product) => ({
    id: product._id,
    name: product.name,
    description: product.description,
    price_vnd: product.base_price_cents,
    category: product.category.name,
    category_slug: product.category.slug,
    is_spicy: product.is_spicy
  }));

  return `Lich su gan day: ${JSON.stringify(history || [])}

Danh sach mon co san: ${JSON.stringify(compactProducts)}

Yeu cau hien tai: ${message}

Hay tra loi bang tieng Viet tu nhien, ngan gon, uu tien 3-5 mon cu the va noi ro vi sao phu hop. Chi duoc goi y mon co trong danh sach. Khong dat cau hoi nguoc lai cho khach, khong goi y xem menu, khong chen huong dan bo sung.`;
};

const formatSuggestionsAsText = (suggestions) => {
  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    return 'Khong tim thay mon phu hop.';
  }

  return suggestions.map((product) => `${product.name} + ${product.price_text}.`).join(' ');
};

const extractTextFromResponse = (payload) => {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload?.output) ? payload.output : [];
  const texts = [];

  output.forEach((item) => {
    const content = Array.isArray(item?.content) ? item.content : [];
    content.forEach((part) => {
      const candidate = part?.text || part?.output_text || part?.content?.[0]?.text;
      if (typeof candidate === 'string' && candidate.trim()) {
        texts.push(candidate.trim());
      }
    });
  });

  return texts.join('\n').trim();
};

exports.chat = async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim();
    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-6) : [];

    if (!message) {
      return res.status(400).json({ success: false, message: 'Thieu noi dung cau hoi' });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Cau hoi qua dai. Vui long rut gon duoi ${MAX_MESSAGE_LENGTH} ky tu.`
      });
    }

    const activeCategories = await Category.find({
      $and: [NOT_DELETED_CONDITION, ACTIVE_CATEGORY_CONDITION]
    }).select('_id');
    const categoryIds = activeCategories.map((item) => item._id);

    const productDocs = await Product.find({
      $and: [
        NOT_DELETED_CONDITION,
        { is_active: { $ne: false } },
        { is_available: { $ne: false } },
        { category_id: { $in: categoryIds } },
        {
          $expr: {
            $gt: [{ $ifNull: ['$stock', '$stock_quantity'] }, 0]
          }
        }
      ]
    })
      .populate({ path: 'category_id', model: 'Category', select: 'name slug' })
      .sort({ created_at: -1 })
      .limit(60);

    const products = productDocs.map(normalizeProduct);
    const fallback = buildFallbackReply(message, products);
    const aiProducts = buildAiCandidateProducts(message, products);
    const openAiKey = String(process.env.OPENAI_API_KEY || '').trim();

    if (!openAiKey) {
      return res.json({
        success: true,
        data: {
          reply: fallback.reply,
          suggestions: fallback.suggestions,
          provider: 'fallback'
        }
      });
    }

    const aiResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        instructions:
          'Ban la tro ly tu van mon an cho Sincay. Chi tu van dua tren danh sach mon duoc cung cap. Khong duoc tu them mon, gia, uu dai, tinh trang kho hay thong tin ngoai du lieu. Chi can tra loi bang van ban de xuat mon phu hop, khong hoi nguoc lai, khong goi y xem menu, khong them loi moi thao tac.',
        input: buildPrompt(message, history, aiProducts)
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI chat error:', aiResponse.status, errorText);

      return res.json({
        success: true,
        data: {
          reply: fallback.reply,
          suggestions: fallback.suggestions,
          provider: 'fallback'
        }
      });
    }

    const payload = await aiResponse.json();
    const aiText = extractTextFromResponse(payload) || fallback.reply;
    const finalText = formatSuggestionsAsText(aiProducts.slice(0, 4));

    return res.json({
      success: true,
      data: {
        reply: aiText && aiText.toLowerCase().includes('khong tim') ? aiText : finalText,
        suggestions: aiProducts.slice(0, 4),
        provider: 'openai'
      }
    });
  } catch (error) {
    console.error('AI controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Khong the xu ly yeu cau tu van mon luc nay'
    });
  }
};
