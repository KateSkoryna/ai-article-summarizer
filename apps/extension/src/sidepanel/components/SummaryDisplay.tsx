import type { Summary } from '../../types';

interface Props {
  summary: Summary;
  onExportPDF: () => void;
  onNewArticle: () => void;
}

function formatMarkdownToHTML(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

export function SummaryDisplay({ summary, onExportPDF, onNewArticle }: Props) {
  return (
    <div>
      <div className="article-card">
        <h3 className="card-heading">📝 Summary</h3>
        <div
          id="summary-text"
          dangerouslySetInnerHTML={{ __html: formatMarkdownToHTML(summary.summary) }}
        />

        {summary.bulletPoints.length > 0 && (
          <div id="bullet-points-section">
            <h3 className="card-heading">📌 Additional Points</h3>
            <ul id="bullet-points">
              {summary.bulletPoints.map((point, i) => (
                <li
                  key={i}
                  className={point.startsWith('**') && point.endsWith(':**') ? 'section-header' : ''}
                  dangerouslySetInnerHTML={{ __html: formatMarkdownToHTML(point) }}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="button-group">
        <button className="btn-primary" onClick={onExportPDF}>📥 Export to PDF</button>
        <button className="btn-secondary" onClick={onNewArticle}>📄 New Article</button>
      </div>
    </div>
  );
}
