import { useState, useCallback } from "react";
import type { Article, Summary, VocabData } from "../types";
import { ArticleExtract } from "./components/ArticleExtract";
import { ArticleDisplay } from "./components/ArticleDisplay";
import { SummaryDisplay } from "./components/SummaryDisplay";
import { VocabularyDisplay } from "./components/VocabularyDisplay";
import { ExportButtons } from "./components/ExportButtons";

type AppView = "extract" | "article" | "combined";

export function App() {
  const [view, setView] = useState<AppView>("extract");
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [currentSummary, setCurrentSummary] = useState<Summary | null>(null);
  const [currentVocabulary, setCurrentVocabulary] = useState<VocabData | null>(
    null,
  );
  const [requestId, setRequestId] = useState(0);
  const [targetLanguage, setTargetLanguage] = useState("");
  const [cefrLevel, setCefrLevel] = useState("");

  function translateAndSummarize(lang: string, level: string) {
    setCurrentSummary(null);
    setCurrentVocabulary(null);
    setTargetLanguage(lang);
    setCefrLevel(level);
    setRequestId((prev) => prev + 1);
    setView("combined");
  }

  const handleSummaryReady = useCallback(
    (incoming: Summary) =>
      setCurrentSummary((prev) => ({
        ...incoming,
        summary: incoming.summary || prev?.summary || "",
        originalSummary: incoming.originalSummary ?? prev?.originalSummary,
      })),
    [],
  );
  const handleVocabReady = useCallback(
    (vocab: VocabData) => setCurrentVocabulary(vocab),
    [],
  );

  function startNewArticle() {
    setCurrentArticle(null);
    setCurrentSummary(null);
    setCurrentVocabulary(null);
    setView("extract");
  }

  return (
    <div className="container">
      <header>
        <div>
          <h1>Lexentio</h1>
          <p className="header-description">
            Your AI assistant to summarize, translate and expand your language
            skills
          </p>
        </div>
      </header>

      {view === "extract" && (
        <ArticleExtract
          onArticleExtracted={(article) => {
            setCurrentArticle(article);
            setView("article");
          }}
        />
      )}

      {view === "article" && currentArticle && (
        <ArticleDisplay
          article={currentArticle}
          onTranslateAndSummarize={translateAndSummarize}
          onClear={() => {
            setCurrentArticle(null);
            setView("extract");
          }}
        />
      )}

      {view === "combined" && currentArticle && (
        <>
          <SummaryDisplay
            article={currentArticle}
            targetLanguage={targetLanguage}
            requestId={requestId}
            onSummaryReady={handleSummaryReady}
          />
          <VocabularyDisplay
            article={currentArticle}
            targetLanguage={targetLanguage}
            cefrLevel={cefrLevel}
            requestId={requestId}
            onVocabReady={handleVocabReady}
          />
          <ExportButtons
            summary={currentSummary}
            vocabData={currentVocabulary}
            article={currentArticle}
            onNewArticle={startNewArticle}
          />
        </>
      )}
    </div>
  );
}
