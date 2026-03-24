import { useState } from "react";
import type { Article, Summary, VocabData } from "../../types";
import {
  exportSummaryPDF,
  exportVocabularyPDF,
  exportBothPDF,
} from "../../utils/pdf";
import { StatusMessage } from "./StatusMessage";
import { Button } from "./Button";

export function ExportButtons({
  summary,
  vocabData,
  article,
  onNewArticle,
}: {
  summary: Summary | null;
  vocabData: VocabData | null;
  article: Article;
  onNewArticle: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  async function handleExport(fn: () => Promise<void>, successMessage: string) {
    try {
      setLoading(true);
      setStatus(null);
      await fn();
      setStatus({ message: successMessage, type: "success" });
    } catch (err: unknown) {
      setStatus({
        message: `Export failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {status && <StatusMessage message={status.message} type={status.type} />}
      <div className="button-group">
        {summary && (
          <Button
            disabled={loading}
            onClick={() =>
              handleExport(
                () =>
                  exportSummaryPDF(summary, article, vocabData?.language ?? ""),
                "Summary PDF downloaded!",
              )
            }
          >
Export Summary PDF
          </Button>
        )}
        {vocabData && (
          <Button
            disabled={loading}
            onClick={() =>
              handleExport(
                () => exportVocabularyPDF(vocabData),
                "Vocabulary PDF downloaded!",
              )
            }
          >
Export Vocabulary PDF
          </Button>
        )}
        {summary && vocabData && (
          <Button
            disabled={loading}
            onClick={() =>
              handleExport(
                () => exportBothPDF(summary, article, vocabData),
                "PDF downloaded!",
              )
            }
          >
Export Both PDF
          </Button>
        )}
      </div>
      <div className="button-group">
        <Button variant="secondary" onClick={onNewArticle}>
          New Article
        </Button>
      </div>
    </>
  );
}
