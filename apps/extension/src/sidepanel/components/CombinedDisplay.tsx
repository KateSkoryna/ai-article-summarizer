import type { Summary, VocabData } from '../../types';

interface Props {
  summary: Summary;
  vocabData: VocabData;
  onExportSummaryPDF: () => void;
  onExportVocabPDF: () => void;
  onExportBothPDF: () => void;
  onNewArticle: () => void;
}

function formatMarkdownToHTML(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

export function CombinedDisplay({ summary, vocabData, onExportSummaryPDF, onExportVocabPDF, onExportBothPDF, onNewArticle }: Props) {
  return (
    <div>
      {summary.originalSummary && (
        <div className="article-card">
          <h3 className="card-heading">📝 Original Summary</h3>
          <div dangerouslySetInnerHTML={{ __html: formatMarkdownToHTML(summary.originalSummary) }} />
        </div>
      )}

      <div className="article-card">
        <h3 className="card-heading">📝 Summary ({vocabData.language})</h3>
        <div dangerouslySetInnerHTML={{ __html: formatMarkdownToHTML(summary.summary) }} />
      </div>

      <div className="article-card">
        <h3 className="card-heading">📚 Vocabulary</h3>
        <p id="vocab-display-meta">
          Language: {vocabData.language} | Level: {vocabData.cefrLevel} | {vocabData.items.length} words
        </p>
        <div id="vocab-word-list">
          {vocabData.items.map((item, i) => (
            <div key={i} className="vocab-word-card">
              <div className="vocab-word">
                {item.word}
                <span className="vocab-level-badge">{vocabData.cefrLevel}</span>
              </div>
              <div className="vocab-translation">{item.translation}</div>
              <div className="vocab-example">{item.example}</div>
              <div className="vocab-example">{item.example_translation}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="button-group">
        <button className="btn-primary" onClick={onExportSummaryPDF}>📥 Export Summary PDF</button>
        <button className="btn-primary" onClick={onExportVocabPDF}>📥 Export Vocabulary PDF</button>
        <button className="btn-primary" onClick={onExportBothPDF}>📥 Export Both</button>
      </div>
      <div className="button-group">
        <button className="btn-secondary" onClick={onNewArticle}>📄 New Article</button>
      </div>
    </div>
  );
}
