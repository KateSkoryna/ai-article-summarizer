import { useState, useRef } from 'react';
import type { Article, Summary, VocabData } from '../types';
import {
  callBackendAPI,
  createSummaryPrompt,
  parseSummaryResponse,
  createVocabularyPrompt,
  parseVocabularyResponse,
} from '../utils/api';
import { exportSummaryPDF, exportVocabularyPDF, exportBothPDF } from '../utils/pdf';
import { LoadingSpinner } from './components/LoadingSpinner';
import { StatusMessage } from './components/StatusMessage';
import { ArticleExtract } from './components/ArticleExtract';
import { ArticleDisplay } from './components/ArticleDisplay';
import { CombinedDisplay } from './components/CombinedDisplay';

type AppView = 'extract' | 'article' | 'combined';
type StatusType = 'success' | 'error' | 'warning' | 'info';

interface Status {
  message: string;
  type: StatusType;
}

export function App() {
  const [view, setView] = useState<AppView>('extract');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');
  const [status, setStatus] = useState<Status | null>(null);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [currentSummary, setCurrentSummary] = useState<Summary | null>(null);
  const [currentVocabulary, setCurrentVocabulary] = useState<VocabData | null>(null);

  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showStatus(message: string, type: StatusType) {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setStatus({ message, type });
    if (type === 'success') {
      statusTimerRef.current = setTimeout(() => setStatus(null), 4000);
    }
  }

  function hideStatus() {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setStatus(null);
  }

  async function extractArticle() {
    try {
      setLoading(true);
      setLoadingText('Extracting article content...');
      hideStatus();

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error('No active tab found');

      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
        throw new Error('Cannot extract content from Chrome system pages');
      }

      const response = await chrome.tabs.sendMessage(tab.id!, { action: 'extractArticle' });

      if (response.success) {
        setCurrentArticle(response.data);
        setView('article');
        showStatus('Article extracted successfully!', 'success');
      } else {
        throw new Error(response.error || 'Failed to extract article');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('Receiving end does not exist')) {
        showStatus('Could not reach the page. Please refresh the tab and try again.', 'error');
      } else {
        showStatus(message, 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  async function translateAndSummarize(targetLanguage: string, cefrLevel: string) {
    if (!currentArticle) {
      showStatus('No article loaded. Please extract an article first.', 'warning');
      return;
    }

    try {
      setLoading(true);
      setLoadingText('Generating summary and vocabulary...');
      hideStatus();

      const summaryPrompt = createSummaryPrompt(currentArticle.content, currentArticle.title, targetLanguage);
      const originalSummaryPrompt = createSummaryPrompt(currentArticle.content, currentArticle.title, "the article's original language");
      const vocabPrompt = createVocabularyPrompt(currentArticle.content, targetLanguage, cefrLevel);

      const [summaryText, originalSummaryText, vocabText] = await Promise.all([
        callBackendAPI('summarize', summaryPrompt),
        callBackendAPI('summarize', originalSummaryPrompt),
        callBackendAPI('vocabulary', vocabPrompt),
      ]);

      const parsed = parseSummaryResponse(summaryText);
      const originalParsed = parseSummaryResponse(originalSummaryText);
      const summary: Summary = {
        summary: parsed.summary,
        originalSummary: originalParsed.summary,
        bulletPoints: parsed.bulletPoints,
        articleTitle: currentArticle.title,
        articleUrl: currentArticle.url,
      };

      const items = parseVocabularyResponse(vocabText);
      if (!items) {
        showStatus('Could not parse vocabulary response. Please try again.', 'error');
        return;
      }

      const vocabData: VocabData = {
        items,
        language: targetLanguage,
        cefrLevel,
        articleTitle: currentArticle.title,
        articleUrl: currentArticle.url,
      };

      setCurrentSummary(summary);
      setCurrentVocabulary(vocabData);
      setView('combined');
      showStatus('Summary and vocabulary generated!', 'success');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showStatus(`Error: ${message}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleExportSummaryPDF() {
    if (!currentSummary || !currentArticle) {
      showStatus('No summary to export. Please generate a summary first.', 'warning');
      return;
    }

    try {
      setLoading(true);
      setLoadingText('Generating PDF document...');
      await exportSummaryPDF(currentSummary, currentArticle, currentVocabulary?.language ?? '');
      showStatus('PDF document downloaded successfully!', 'success');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showStatus(`Export failed: ${message}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleExportVocabPDF() {
    if (!currentVocabulary) {
      showStatus('No vocabulary to export. Please generate a vocabulary list first.', 'warning');
      return;
    }

    try {
      setLoading(true);
      setLoadingText('Generating Vocabulary PDF...');
      await exportVocabularyPDF(currentVocabulary);
      showStatus('Vocabulary PDF downloaded successfully!', 'success');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showStatus(`Export failed: ${message}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleExportBothPDF() {
    if (!currentSummary || !currentArticle || !currentVocabulary) {
      showStatus('No content to export. Please generate a summary first.', 'warning');
      return;
    }

    try {
      setLoading(true);
      setLoadingText('Generating PDF...');
      await exportBothPDF(currentSummary, currentArticle, currentVocabulary);
      showStatus('PDF downloaded successfully!', 'success');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showStatus(`Export failed: ${message}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  function startNewArticle() {
    setCurrentArticle(null);
    setCurrentSummary(null);
    setCurrentVocabulary(null);
    setView('extract');
    hideStatus();
  }

  function clearArticle() {
    setCurrentArticle(null);
    setView('extract');
    hideStatus();
  }

  return (
    <div className="container">
      <header>
        <h1>Lexentio</h1>
      </header>

      {loading && <LoadingSpinner text={loadingText} />}
      {status && <StatusMessage message={status.message} type={status.type} />}

      {!loading && view === 'extract' && (
        <ArticleExtract onExtract={extractArticle} />
      )}

      {!loading && view === 'article' && currentArticle && (
        <ArticleDisplay
          article={currentArticle}
          onTranslateAndSummarize={translateAndSummarize}
          onClear={clearArticle}
        />
      )}

      {!loading && view === 'combined' && currentSummary && currentVocabulary && (
        <CombinedDisplay
          summary={currentSummary}
          vocabData={currentVocabulary}
          onExportSummaryPDF={handleExportSummaryPDF}
          onExportVocabPDF={handleExportVocabPDF}
          onExportBothPDF={handleExportBothPDF}
          onNewArticle={startNewArticle}
        />
      )}
    </div>
  );
}
