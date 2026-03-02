const mongoose = require('mongoose');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
require('dotenv').config();

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');

const categoriesSeed = [
  { name: 'Khai vị', slug: 'appetizer', is_active: true },
  { name: 'Mì cay', slug: 'spicy', is_active: true },
  { name: 'Lẩu', slug: 'hotpot', is_active: true },
  { name: 'Đồ uống', slug: 'drink', is_active: true },
  { name: 'Tokbokki', slug: 'tokbokki', is_active: true }
];

const productsSeed = [
  { name: 'Mì Kim Chi Thập Cẩm', description: 'Mì, bò Mỹ, tôm, mực, kim chi, nấm, rau củ.', price: 69000, category: 'spicy', image: '/menu/kcthapcam.webp' },
  { name: 'Mì Kim Chi Đùi Gà', description: 'Mì, đùi gà, kim chi, nấm, rau củ.', price: 55000, category: 'spicy', image: '/menu/kcduiga.webp' },
  { name: 'Mì Kim Chi Hải Sản', description: 'Mì, tôm, mực, kim chi, nấm, rau củ.', price: 62000, category: 'spicy', image: '/menu/kchaisan.webp' },
  { name: 'Lẩu Kim Chi Bò Mỹ (2 người)', description: 'Nước lẩu kim chi, bò Mỹ, nấm, rau, mì.', price: 199000, category: 'hotpot', image: '/menu/lau1.webp' },
  { name: 'Lẩu Kim Chi Hải Sản (2 người)', description: 'Nước lẩu kim chi, tôm, mực, nấm, rau, mì.', price: 199000, category: 'hotpot', image: '/menu/lau2.webp' },
  { name: 'Lẩu Tokbokki Bò Mỹ (2 người)', description: 'Tokbokki, bò Mỹ, rau củ, nước dùng đậm vị.', price: 199000, category: 'tokbokki', image: '/menu/lt2.webp' },
  { name: 'Lẩu Tokbokki Hải Sản (2 người)', description: 'Tokbokki, tôm, mực, rau củ, nước dùng đậm vị.', price: 199000, category: 'tokbokki', image: '/menu/Lt1.webp' },
  { name: 'Phô Mai Viên', description: 'Món khai vị giòn tan, béo nhẹ.', price: 29000, category: 'appetizer', image: '/menu/pmv.webp' },
  { name: 'Khoai Tây Chiên', description: 'Khoai tây chiên giòn nóng.', price: 32000, category: 'appetizer', image: '/menu/ktc.webp' },
  { name: 'Kimbap Chiên', description: 'Kimbap chiên giòn ăn kèm sốt.', price: 45000, category: 'appetizer', image: '/menu/kimbap.webp' },
  { name: 'Nước Gạo Hoa Anh Đào', description: 'Thức uống nhẹ vị gạo rang.', price: 35000, category: 'drink', image: '/menu/nuoc2.webp' },
  { name: 'Trà Đào', description: 'Trà đào mát lạnh.', price: 29000, category: 'drink', image: '/menu/nuoc10.webp' }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sincay');
    console.log('Đang nạp dữ liệu danh mục và sản phẩm...');

    await Category.deleteMany({});
    await Product.deleteMany({});

    const categories = await Category.insertMany(categoriesSeed);
    const categoryMap = new Map(categories.map((c) => [c.slug, c._id]));

    const products = productsSeed.map((item) => {
      const randomStock = Math.floor(Math.random() * 101);
      return {
        name: item.name,
        slug: slugify(item.name),
        description: item.description,
        base_price_cents: item.price,
        image_url: item.image,
        category_id: categoryMap.get(item.category),
        is_spicy: item.category === 'spicy',
        is_available: true,
        is_active: true,
        stock: randomStock,
        stock_quantity: randomStock
      };
    });

    await Product.insertMany(products);

    console.log(`Seed thành công: ${categories.length} danh mục, ${products.length} sản phẩm.`);
    process.exit(0);
  } catch (error) {
    console.error('Lỗi seed dữ liệu:', error);
    process.exit(1);
  }
};

seedDB();
