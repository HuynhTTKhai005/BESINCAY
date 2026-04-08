const formatPrice = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const normalizeMenuItem = (productDoc) => {
  const product = productDoc?.toObject ? productDoc.toObject() : productDoc;
  return {
    id: String(product._id),
    name: String(product.name || '').trim(),
    description: String(product.description || '').trim(),
    base_price_cents: Number(product.base_price_cents || 0),
    is_spicy: product.is_spicy === true,
    is_available: product.is_available !== false,
    stock: Number(product.stock ?? product.stock_quantity ?? 0),
    category_slug: String(product.category_id?.slug || '').trim().toLowerCase()
  };
};

const formatMenuForPrompt = (items) =>
  items
    .map((item, index) =>
      `${index + 1}. ${item.name} | ${formatPrice(item.base_price_cents)} | nhom=${item.category_slug || 'khac'} | cay=${item.is_spicy ? 'co' : 'khong'} | ${item.description || 'khong mo ta'}`
    )
    .join('\n');

module.exports = { formatPrice, normalizeMenuItem, formatMenuForPrompt };
