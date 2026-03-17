import type { VocabItem } from '../types';

const BACKEND_URL = 'http://localhost:3000';

export async function callBackendAPI(endpoint: string, prompt: string): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

export function createSummaryPrompt(articleText: string, articleTitle: string): string {
  const maxChars = 15000;
  const truncatedText =
    articleText.length > maxChars
      ? articleText.substring(0, maxChars) + '...[truncated]'
      : articleText;

  return `Create a concise summary of this article IN ENGLISH (1500-2000 characters).

Article Title: ${articleTitle}
Article Content:
${truncatedText}

CRITICAL INSTRUCTIONS:
- Write a SUMMARY, not a translation
- Focus on what's NEW, SURPRISING, or IMPORTANT
- Do NOT repeat obvious facts or context everyone knows
- Do NOT use quotes unless absolutely necessary
- Identify ONE specific crucial fact or insight in one sentence
- Be analytical, not descriptive
- Keep it 1500-2000 characters total

FORMAT:

AUTHOR & SOURCE:
[One line: Author name (if mentioned) and publication, e.g., "Christina Nagel, ARD-Hauptstadtstudio" or just "Tagesschau.de"]

MAIN POINT:
[2-3 sentences: What is the core message? Why does this matter NOW?]

KEY INSIGHT:
[1 specific crucial fact or development that stands out - be concrete with numbers, names, or specific events]

IMPLICATIONS:
[2-3 sentences: What does this mean? What are the consequences or significance?]

CONTEXT (if relevant):
[1-2 sentences: Only if there's essential background needed to understand the significance]

Remember: Be concise, analytical, and focus on what's NOT obvious.`;
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
  const maxChars = 15000;
  const truncatedText =
    articleText.length > maxChars
      ? articleText.substring(0, maxChars) + '...[truncated]'
      : articleText;

  const levelDescriptions: Record<string, string> = {
    A1: 'absolute beginner — very common everyday words only',
    A2: 'elementary — basic everyday vocabulary',
    B1: 'intermediate — moderately common words a learner would encounter',
    B2: 'upper intermediate — less common words requiring broader knowledge',
    C1: 'advanced — sophisticated, nuanced vocabulary',
    C2: 'mastery — highly sophisticated, rare, or domain-specific words',
  };

  const levelDescription = levelDescriptions[cefrLevel] || cefrLevel;

  return `You are a language learning assistant. From the article below, extract 10–15 words (in the article's language) that match CEFR level ${cefrLevel} (${levelDescription}).

For each word, include the grammatical article with the word itself if the article's language requires it (e.g. "das Haus" in German, "la maison" in French). Do the same for the ${targetLanguage} translation if that language requires articles.

For each word, provide a ${targetLanguage} translation, an example sentence taken or adapted from the article (in the article's original language), and a ${targetLanguage} translation of that example sentence.

Return ONLY a valid JSON array with no prose, no code fences, and no additional text. Each element must have exactly these four string fields: "word", "translation", "example", "example_translation".

Example format:
[{"word": "example","translation": "ejemplo","example": "This is an example sentence.","example_translation": "Esta es una oración de ejemplo."}]

Article Content:
${truncatedText}`;
}

export function parseVocabularyResponse(responseText: string): VocabItem[] | null {
  try {
    const match = responseText.match(/\[[\s\S]*\]/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]) as unknown[];

    if (
      !Array.isArray(parsed) ||
      parsed.length === 0 ||
      !parsed.every(
        (item) =>
          typeof (item as VocabItem).word === 'string' &&
          typeof (item as VocabItem).translation === 'string' &&
          typeof (item as VocabItem).example === 'string' &&
          typeof (item as VocabItem).example_translation === 'string',
      )
    ) {
      return null;
    }

    return parsed as VocabItem[];
  } catch {
    return null;
  }
}
