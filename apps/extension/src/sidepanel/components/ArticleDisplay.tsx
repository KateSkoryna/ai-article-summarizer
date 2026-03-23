import { useState } from 'react';
import type { Article } from '../../types';

interface Props {
  article: Article;
  onTranslateAndSummarize: (language: string, cefrLevel: string) => void;
  onClear: () => void;
}

const LANGUAGES = [
  'Arabic', 'Chinese (Simplified)', 'Dutch', 'English', 'French',
  'German', 'Hindi', 'Italian', 'Japanese', 'Korean',
  'Polish', 'Portuguese', 'Russian', 'Spanish', 'Swedish',
  'Turkish', 'Ukrainian',
];

const CEFR_LEVELS = [
  { value: 'A1', label: 'A1 – Beginner' },
  { value: 'A2', label: 'A2 – Elementary' },
  { value: 'B1', label: 'B1 – Intermediate' },
  { value: 'B2', label: 'B2 – Upper Intermediate' },
  { value: 'C1', label: 'C1 – Advanced' },
  { value: 'C2', label: 'C2 – Mastery' },
];

export function ArticleDisplay({ article, onTranslateAndSummarize, onClear }: Props) {
  const [targetLanguage, setTargetLanguage] = useState('');
  const [cefrLevel, setCefrLevel] = useState('');

  return (
    <div>
      <div className="article-card">
        <h2>{article.title}</h2>
        <div className="article-meta">
          <span className="article-meta-item">👤 {article.author}</span>
          <span className="article-meta-item">🌐 {article.siteName}</span>
          <span className="article-meta-item">📝 {article.length.toLocaleString()} words</span>
        </div>
        <div className="article-excerpt">{article.excerpt}</div>
        <a href={article.url} target="_blank" rel="noreferrer" className="article-url">
          {article.url}
        </a>
      </div>

      <div className="vocab-controls">
        <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}>
          <option value="">Translate to...</option>
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
        <select value={cefrLevel} onChange={(e) => setCefrLevel(e.target.value)}>
          <option value="">CEFR Level...</option>
          {CEFR_LEVELS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="button-group">
        <button
          className="btn-primary"
          onClick={() => onTranslateAndSummarize(targetLanguage, cefrLevel)}
          disabled={!targetLanguage || !cefrLevel}
        >
          ✨ Translate &amp; Summarize
        </button>
        <button className="btn-secondary" onClick={onClear}>🗑️ Clear</button>
      </div>
    </div>
  );
}
