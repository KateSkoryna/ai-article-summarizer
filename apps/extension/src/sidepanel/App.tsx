import { useState, useRef } from 'react';
import type { Article, Summary, VocabData } from '../types';
import {
  callBackendAPI,
  createSummaryPrompt,
  parseSummaryResponse,
  createVocabularyPrompt,
  parseVocabularyResponse,
} from '../utils/api';
import { exportSummaryPDF, exportVocabularyPDF } from '../utils/pdf';
import { LoadingSpinner } from './components/LoadingSpinner';
import { StatusMessage } from './components/StatusMessage';
import { ArticleExtract } from './components/ArticleExtract';
import { ArticleDisplay } from './components/ArticleDisplay';
import { SummaryDisplay } from './components/SummaryDisplay';
import { VocabularyDisplay } from './components/VocabularyDisplay';

type AppView = 'extract' | 'article' | 'summary' | 'vocabulary';
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

  async function summarizeArticle() {
    if (!currentArticle) {
      showStatus('No article to summarize. Please extract an article first.', 'warning');
      return;
    }

    try {
      setLoading(true);
      setLoadingText('Generating AI summary...');
      hideStatus();

      const prompt = createSummaryPrompt(currentArticle.content, currentArticle.title);
      const responseText = await callBackendAPI('summarize', prompt);
      const parsed = parseSummaryResponse(responseText);

      const summary: Summary = {
        summary: parsed.summary,
        bulletPoints: parsed.bulletPoints,
        articleTitle: currentArticle.title,
        articleUrl: currentArticle.url,
      };

      setCurrentSummary(summary);
      setView('summary');
      showStatus('Summary generated successfully!', 'success');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showStatus(`Error: ${message}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function findVocabulary(targetLanguage: string, cefrLevel: string) {
    if (!currentArticle) {
      showStatus('No article loaded. Please extract an article first.', 'warning');
      return;
    }

    if (!targetLanguage || !cefrLevel) {
      showStatus('Please select both a target language and a CEFR level.', 'warning');
      return;
    }

    try {
      setLoading(true);
      setLoadingText('Finding vocabulary words...');
      hideStatus();

      const prompt = createVocabularyPrompt(currentArticle.content, targetLanguage, cefrLevel);
      const responseText = await callBackendAPI('vocabulary', prompt);
      const items = parseVocabularyResponse(responseText);

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

      setCurrentVocabulary(vocabData);
      setView('vocabulary');
      showStatus('Vocabulary list generated!', 'success');
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
      await exportSummaryPDF(currentSummary, currentArticle);
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
        <h1>AI Article Summarizer</h1>
      </header>

      {loading && <LoadingSpinner text={loadingText} />}
      {status && <StatusMessage message={status.message} type={status.type} />}

      {!loading && view === 'extract' && (
        <ArticleExtract onExtract={extractArticle} />
      )}

      {!loading && view === 'article' && currentArticle && (
        <ArticleDisplay
          article={currentArticle}
          onSummarize={summarizeArticle}
          onFindVocab={findVocabulary}
          onClear={clearArticle}
        />
      )}

      {!loading && view === 'summary' && currentSummary && (
        <SummaryDisplay
          summary={currentSummary}
          onExportPDF={handleExportSummaryPDF}
          onNewArticle={startNewArticle}
        />
      )}

      {!loading && view === 'vocabulary' && currentVocabulary && (
        <VocabularyDisplay
          vocabData={currentVocabulary}
          onExportPDF={handleExportVocabPDF}
          onNewArticle={startNewArticle}
        />
      )}
    </div>
  );
}
