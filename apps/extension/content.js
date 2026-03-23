chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractArticle") {
    extractArticleContent()
      .then((result) => sendResponse(result))
      .catch((error) =>
        sendResponse({
          success: false,
          error: error.message,
        }),
      );
    return true; // Required for async response
  }
});

async function extractArticleContent() {
  try {
    const documentClone = document.cloneNode(true);

    const reader = new Readability(documentClone, {
      debug: false,
      charThreshold: 100,
    });

    const article = reader.parse();

    if (!article) {
      return {
        success: false,
        error:
          "Could not extract article content. This page may not contain a recognizable article.",
      };
    }

    if (!article.textContent || article.textContent.trim().length < 100) {
      return {
        success: false,
        error:
          "Article content is too short. This page may not be suitable for summarization.",
      };
    }

    return {
      success: true,
      data: {
        title: article.title || document.title || "Untitled",
        author: article.byline || "Unknown",
        content: article.textContent,
        excerpt:
          article.excerpt || article.textContent.substring(0, 200) + "...",
        length: article.length,
        siteName: article.siteName || extractDomain(window.location.href),
        url: window.location.href,
        language: document.documentElement.lang || '',
        publishedTime: article.publishedTime || null,
      },
    };
  } catch (error) {
    console.error("Article extraction error:", error);
    return {
      success: false,
      error: `Extraction failed: ${error.message}`,
    };
  }
}

function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch (e) {
    return "Unknown";
  }
}

console.log("AI Article Summarizer: Content script loaded");
