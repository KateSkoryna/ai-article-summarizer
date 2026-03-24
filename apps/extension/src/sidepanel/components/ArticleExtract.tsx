import { useState } from "react";
import type { Article } from "../../types";
import { LoadingSpinner } from "./LoadingSpinner";
import { StatusMessage } from "./StatusMessage";
import { Button } from "./Button";

export function ArticleExtract({
  onArticleExtracted,
}: {
  onArticleExtracted: (article: Article) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function extract() {
    try {
      setLoading(true);
      setError(null);

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab) throw new Error("No active tab found");

      if (
        tab.url?.startsWith("chrome://") ||
        tab.url?.startsWith("chrome-extension://")
      ) {
        throw new Error("Cannot extract content from Chrome system pages");
      }

      const response = await chrome.tabs.sendMessage(tab.id!, {
        action: "extractArticle",
      });

      if (response.success) {
        onArticleExtracted(response.data);
      } else {
        throw new Error(response.error || "Failed to extract article");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(
        message.includes("Receiving end does not exist")
          ? "Could not reach the page. Please refresh the tab and try again."
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="extract-section">
      {loading && <LoadingSpinner text="Extracting article content..." />}
      {error && <StatusMessage message={error} type="error" />}
      {!loading && (
        <>
          <Button onClick={extract}>Extract Article</Button>
          <p className="extract-hint">
            Click to extract article content from the current page
          </p>
        </>
      )}
    </div>
  );
}
