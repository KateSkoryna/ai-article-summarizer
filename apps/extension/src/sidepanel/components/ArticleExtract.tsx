interface Props {
  onExtract: () => void;
}

export function ArticleExtract({ onExtract }: Props) {
  return (
    <div id="extract-section">
      <button className="btn-primary" onClick={onExtract}>
        📄 Extract Article
      </button>
      <p className="extract-hint">
        Click to extract article content from the current page
      </p>
    </div>
  );
}
