const buckets = new Map();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 12;

const getClientKey = (req) => {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.ip || 'unknown';
};

const pruneBucket = (bucket, now) => bucket.filter((timestamp) => now - timestamp < WINDOW_MS);

const aiRateLimit = (req, res, next) => {
  const key = getClientKey(req);
  const now = Date.now();
  const activeBucket = pruneBucket(buckets.get(key) || [], now);

  if (activeBucket.length >= MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Ban gui yeu cau qua nhanh. Vui long thu lai sau it phut.'
    });
  }

  activeBucket.push(now);
  buckets.set(key, activeBucket);
  next();
};

module.exports = { aiRateLimit };
