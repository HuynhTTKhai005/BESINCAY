const { safeJsonParse } = require('../utils/json.util');

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

const extractOutputText = (payload) => {
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

const createJsonResponse = async ({ systemPrompt, userPrompt, model = DEFAULT_MODEL }) => {
  const apiKey = String(process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: [
        { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
        { role: 'user', content: [{ type: 'input_text', text: userPrompt }] }
      ],
      text: {
        format: {
          type: 'json_object'
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const text = extractOutputText(payload);
  const json = safeJsonParse(text);

  if (!json) {
    throw new Error('OpenAI returned invalid JSON');
  }

  return json;
};

module.exports = { createJsonResponse };
