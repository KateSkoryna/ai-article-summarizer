export interface Article {
  title: string;
  author: string;
  content: string;
  excerpt: string;
  length: number;
  siteName: string;
  url: string;
  language: string;
}

export interface Summary {
  summary: string;
  originalSummary?: string;
  bulletPoints: string[];
  articleTitle: string;
  articleUrl: string;
}

export interface VocabItem {
  word: string;
  translation: string;
  example: string;
  example_translation: string;
}

export interface VocabData {
  items: VocabItem[];
  language: string;
  cefrLevel: string;
  articleTitle: string;
  articleUrl: string;
}
