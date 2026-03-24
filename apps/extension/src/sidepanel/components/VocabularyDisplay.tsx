import { useState, useEffect, memo } from "react";
import type { Article, VocabData } from "../../types";
import GlobeIcon from "../../assets/globe.svg?react";
import {
  callBackendAPI,
  createVocabularyPrompt,
  parseVocabularyResponse,
} from "../../utils/api";

export const VocabularyDisplay = memo(function VocabularyDisplay({
  article,
  targetLanguage,
  cefrLevel,
  requestId,
  onVocabReady,
}: {
  article: Article;
  targetLanguage: string;
  cefrLevel: string;
  requestId: number;
  onVocabReady: (vocab: VocabData) => void;
}) {
  const [data, setData] = useState<VocabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setLoading(true);
    setError(null);
    callBackendAPI(
      "vocabulary",
      createVocabularyPrompt(article.content, targetLanguage, cefrLevel),
    )
      .then((text) => {
        if (cancelled) return;
        const items = parseVocabularyResponse(text);
        if (items) {
          const vocab: VocabData = {
            items,
            language: targetLanguage,
            cefrLevel,
            articleTitle: article.title,
            articleUrl: article.url,
          };
          setData(vocab);
          onVocabReady(vocab);
        } else {
          setError("Could not parse vocabulary response");
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error
              ? err.message
              : "Failed to generate vocabulary",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  return (
    <div className="article-card">
      <h3 className="card-heading"><GlobeIcon /> Vocabulary</h3>
      {loading && <p style={{ color: "#888" }}>Loading...</p>}
      {data && (
        <>
          <p id="vocab-display-meta">
            Language: {data.language} | Level: {data.cefrLevel} |{" "}
            {data.items.length} words
          </p>
          <ul id="vocab-word-list">
            {data.items.map((item, i) => (
              <li key={i} className="vocab-word-card">
                <span className="vocab-word">
                  {item.word}
                  <span className="vocab-level-badge">{data.cefrLevel}</span>
                </span>
                <span className="vocab-translation">{item.translation}</span>
                <span className="vocab-example">{item.example}</span>
                <span className="vocab-example">
                  {item.example_translation}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      {error && <p style={{ color: "#e53e3e" }}>⚠️ {error}</p>}
    </div>
  );
});
