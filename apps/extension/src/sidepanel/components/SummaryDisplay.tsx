import { useState, useEffect, memo } from "react";
import type { Article, Summary } from "../../types";
import BookIcon from "../../assets/book.svg?react";
import {
  callBackendAPI,
  createSummaryPrompt,
  parseSummaryResponse,
} from "../../utils/api";

function formatMarkdownToHTML(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");
}

const OriginalSummarySection = memo(function OriginalSummarySection({
  article,
  requestId,
  onReady,
}: {
  article: Article;
  requestId: number;
  onReady: (text: string) => void;
}) {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setLoading(true);
    setError(null);
    callBackendAPI(
      "summarize",
      createSummaryPrompt(
        article.content,
        article.title,
        "the article's original language",
      ),
    )
      .then((text) => {
        if (cancelled) return;
        const parsed = parseSummaryResponse(text);
        setData(parsed.summary);
        onReady(parsed.summary);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error
              ? err.message
              : "Failed to generate original summary",
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
      <h3 className="card-heading"><BookIcon /> Original Summary</h3>
      {loading && <p style={{ color: "#888" }}>Loading...</p>}
      {data && (
        <div dangerouslySetInnerHTML={{ __html: formatMarkdownToHTML(data) }} />
      )}
      {error && <p style={{ color: "#e53e3e" }}>⚠️ {error}</p>}
    </div>
  );
});

const TranslatedSummarySection = memo(function TranslatedSummarySection({
  article,
  targetLanguage,
  requestId,
  onReady,
}: {
  article: Article;
  targetLanguage: string;
  requestId: number;
  onReady: (text: string) => void;
}) {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setLoading(true);
    setError(null);
    callBackendAPI(
      "summarize",
      createSummaryPrompt(article.content, article.title, targetLanguage),
    )
      .then((text) => {
        if (cancelled) return;
        const parsed = parseSummaryResponse(text);
        setData(parsed.summary);
        onReady(parsed.summary);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to generate summary",
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
      <h3 className="card-heading"><BookIcon /> Summary ({targetLanguage})</h3>
      {loading && <p style={{ color: "#888" }}>Loading...</p>}
      {data && (
        <div dangerouslySetInnerHTML={{ __html: formatMarkdownToHTML(data) }} />
      )}
      {error && <p style={{ color: "#e53e3e" }}>⚠️ {error}</p>}
    </div>
  );
});

export function SummaryDisplay({
  article,
  targetLanguage,
  requestId,
  onSummaryReady,
}: {
  article: Article;
  targetLanguage: string;
  requestId: number;
  onSummaryReady: (summary: Summary) => void;
}) {
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);

  useEffect(() => {
    setOriginalText(null);
    setTranslatedText(null);
  }, [requestId]);

  function handleOriginalReady(text: string) {
    setOriginalText(text);
    onSummaryReady({
      summary: translatedText ?? "",
      originalSummary: text,
      bulletPoints: [],
      articleTitle: article.title,
      articleUrl: article.url,
    });
  }

  function handleTranslatedReady(text: string) {
    setTranslatedText(text);
    onSummaryReady({
      summary: text,
      originalSummary: originalText ?? undefined,
      bulletPoints: [],
      articleTitle: article.title,
      articleUrl: article.url,
    });
  }

  return (
    <>
      <OriginalSummarySection
        article={article}
        requestId={requestId}
        onReady={handleOriginalReady}
      />
      <TranslatedSummarySection
        article={article}
        targetLanguage={targetLanguage}
        requestId={requestId}
        onReady={handleTranslatedReady}
      />
    </>
  );
}
