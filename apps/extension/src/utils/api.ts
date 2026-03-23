import type { VocabItem } from '../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const EXTENSION_TOKEN = import.meta.env.VITE_EXTENSION_TOKEN || '';

export async function callBackendAPI(endpoint: string, prompt: string): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Extension-Token': EXTENSION_TOKEN,
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(errorText);
  }

  const data = await response.json() as { text: string };
  return data.text;
}

function truncateArticle(text: string): string {
  const maxChars = 15000;
  return text.length > maxChars ? text.substring(0, maxChars) + '...[truncated]' : text;
}

export function createSummaryPrompt(articleText: string, articleTitle: string, targetLanguage = 'English'): string {
  const truncatedText = truncateArticle(articleText);

  return `Summarize this article IN ${targetLanguage.toUpperCase()} in exactly 800 characters or less.

Article Title: ${articleTitle}
Article Content:
${truncatedText}

FORMAT:

AUTHOR & SOURCE:
[Author name and publication in one line]

MAIN POINT:
[2-3 sentences: core message and why it matters now]

KEY INSIGHT:
[1 sentence: the most concrete or surprising fact — include numbers, names, or specific events]

Be analytical and focus on what is new or non-obvious. Do not translate word for word.`;
}

export function parseSummaryResponse(responseText: string): { summary: string; bulletPoints: string[] } {
  try {
    const extractSection = (text: string, sectionHeader: string): string => {
      const regex = new RegExp(`${sectionHeader}\\s*:?\\s*([\\s\\S]*?)(?=\\n\\n[A-Z]|$)`, 'i');
      const match = text.match(regex);
      return match && match[1] ? match[1].trim() : '';
    };

    const sections = {
      authorSource: extractSection(responseText, 'AUTHOR & SOURCE'),
      mainPoint: extractSection(responseText, 'MAIN POINT'),
      keyInsight: extractSection(responseText, 'KEY INSIGHT'),
      implications: extractSection(responseText, 'IMPLICATIONS'),
      context: extractSection(responseText, 'CONTEXT'),
    };

    let summary = '';

    if (sections.authorSource) summary += `**Author & Source:** ${sections.authorSource}\n\n`;
    if (sections.mainPoint) summary += `**Main Point:**\n${sections.mainPoint}\n\n`;
    if (sections.keyInsight) summary += `**Key Insight:**\n${sections.keyInsight}\n\n`;
    if (sections.implications) summary += `**Implications:**\n${sections.implications}`;
    if (sections.context && sections.context.length > 10) {
      summary += `\n\n**Context:**\n${sections.context}`;
    }

    if (!summary || summary.length < 100) {
      summary = responseText;
    }

    return { summary: summary.trim() || responseText, bulletPoints: [] };
  } catch {
    return {
      summary: responseText.substring(0, 500),
      bulletPoints: ['Unable to parse detailed analysis - raw response shown above'],
    };
  }
}

export function createVocabularyPrompt(
  articleText: string,
  targetLanguage: string,
  cefrLevel: string,
): string {
  const truncatedText = truncateArticle(articleText);

  const levelDescriptions: Record<string, string> = {
    A1: 'absolute beginner — very common everyday words only',
    A2: 'elementary — basic everyday vocabulary',
    B1: 'intermediate — moderately common words a learner would encounter',
    B2: 'upper intermediate — less common words requiring broader knowledge',
    C1: 'advanced — sophisticated, nuanced vocabulary',
    C2: 'mastery — highly sophisticated, rare, or domain-specific words',
  };

  const levelDescription = levelDescriptions[cefrLevel] || cefrLevel;

  return `You are a language learning assistant. From the article below, extract exactly 15 words (in the article's language) that match CEFR level ${cefrLevel} (${levelDescription}).

The 15 words must include: 5–7 nouns, 3–5 verbs, and 3–5 adjectives.

For each word, include the grammatical article with the word itself if the article's language requires it (e.g. "das Haus" in German, "la maison" in French). Do the same for the ${targetLanguage} translation if that language requires articles.

For each word, provide a ${targetLanguage} translation, an example sentence taken or adapted from the article (in the article's original language), and a ${targetLanguage} translation of that example sentence.

Return ONLY a valid JSON array with no prose, no code fences, and no additional text. Each element must have exactly these four string fields: "word", "translation", "example", "example_translation".

Example format:
[{"word": "example","translation": "ejemplo","example": "This is an example sentence.","example_translation": "Esta es una oración de ejemplo."}]

Article Content:
${truncatedText}`;
}

function extractJsonArray(text: string): string | null {
  const stripped = text.replace(/```(?:json)?\s*|\s*```/g, '');
  const start = stripped.indexOf('[');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < stripped.length; i++) {
    const char = stripped[i];
    if (escape) { escape = false; continue; }
    if (char === '\\' && inString) { escape = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (char === '[') depth++;
    else if (char === ']') {
      depth--;
      if (depth === 0) return stripped.substring(start, i + 1);
    }
  }
  return null;
}

export function parseVocabularyResponse(responseText: string): VocabItem[] | null {
  try {
    const raw = responseText.trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const jsonStr = extractJsonArray(raw);
      if (!jsonStr) {
        console.error('parseVocabularyResponse: no JSON found. Response start:', raw.substring(0, 300));
        return null;
      }
      parsed = JSON.parse(jsonStr);
    }

    const items: unknown[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as Record<string, unknown>).items)
        ? (parsed as Record<string, unknown>).items as unknown[]
        : [];

    if (items.length === 0) {
      console.error('parseVocabularyResponse: empty array. Parsed:', parsed);
      return null;
    }

    const validItems = items
      .filter((item) => typeof (item as VocabItem).word === 'string' && typeof (item as VocabItem).translation === 'string')
      .map((item) => ({
        word: (item as VocabItem).word,
        translation: (item as VocabItem).translation,
        example: (item as VocabItem).example ?? '',
        example_translation: (item as VocabItem).example_translation ?? '',
      }));

    if (validItems.length === 0) {
      console.error('parseVocabularyResponse: no valid items. First item:', items[0]);
      return null;
    }

    return validItems;
  } catch (e) {
    console.error('parseVocabularyResponse error:', e, 'Response:', responseText.substring(0, 300));
    return null;
  }
}
