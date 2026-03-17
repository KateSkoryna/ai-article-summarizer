import type { VocabData } from '../../types';

interface Props {
  vocabData: VocabData;
  onExportPDF: () => void;
  onNewArticle: () => void;
}

export function VocabularyDisplay({ vocabData, onExportPDF, onNewArticle }: Props) {
  return (
    <div>
      <div className="article-card">
        <h3 className="card-heading">📚 Vocabulary List</h3>
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
        <button className="btn-primary" onClick={onExportPDF}>📥 Export Vocabulary PDF</button>
        <button className="btn-secondary" onClick={onNewArticle}>📄 New Article</button>
      </div>
    </div>
  );
}
