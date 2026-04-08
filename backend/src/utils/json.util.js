const stripCodeFences = (value) =>
  String(value || '')
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();

const safeJsonParse = (value, fallback = null) => {
  try {
    return JSON.parse(stripCodeFences(value));
  } catch (_error) {
    return fallback;
  }
};

module.exports = { safeJsonParse, stripCodeFences };
