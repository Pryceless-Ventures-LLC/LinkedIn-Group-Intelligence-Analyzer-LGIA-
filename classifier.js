import OpenAI from 'openai';
import { OPENAI_API_KEY } from './config.js';

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

const DEFAULT_CLASSIFICATION = {
  category: 'general conversation',
  isSpam: false,
  engagementLevel: 'low'
};

function buildPrompt(text) {
  return `Classify the following LinkedIn group post. Return ONLY valid JSON with keys: category (one of ["spam", "promotional", "educational", "investor discussion", "deal sourcing", "general conversation", "irrelevant"]), isSpam (boolean), engagementLevel ("low" | "medium" | "high"). Post text: """${text}"""`;
}

function parseClassification(content) {
  try {
    const parsed = JSON.parse(content);
    return {
      category: parsed.category || DEFAULT_CLASSIFICATION.category,
      isSpam: typeof parsed.isSpam === 'boolean' ? parsed.isSpam : DEFAULT_CLASSIFICATION.isSpam,
      engagementLevel: parsed.engagementLevel || DEFAULT_CLASSIFICATION.engagementLevel
    };
  } catch (error) {
    console.warn('Failed to parse classification JSON. Using defaults.', error.message);
    return DEFAULT_CLASSIFICATION;
  }
}

async function classifyPost(post) {
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are a classifier for LinkedIn group posts. Respond with strict JSON that matches the requested keys only.'
      },
      { role: 'user', content: buildPrompt(post.text) }
    ]
  });

  const content = completion.choices?.[0]?.message?.content?.trim() || '';
  const parsed = parseClassification(content);

  return {
    text: post.text,
    category: parsed.category,
    isSpam: parsed.isSpam,
    engagementLevel: parsed.engagementLevel
  };
}

export async function classifyPosts(posts) {
  const results = [];
  for (const post of posts) {
    try {
      const classification = await classifyPost(post);
      results.push(classification);
    } catch (error) {
      console.error('Classification failed for a post. Using defaults.', error.message);
      results.push({ text: post.text, ...DEFAULT_CLASSIFICATION });
    }
  }
  return results;
}
