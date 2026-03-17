// Content script for article extraction
// This script runs on all web pages and extracts article content using Readability.js

// Listen for messages from the side panel
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

// Extract article content using Readability
async function extractArticleContent() {
  try {
    // Readability.js is now loaded via manifest.json, no need to load dynamically

    // Clone the document to avoid modifying the original page
    const documentClone = document.cloneNode(true);

    // Create a new Readability instance and parse the content
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

    // Validate article content
    if (!article.textContent || article.textContent.trim().length < 100) {
      return {
        success: false,
        error:
          "Article content is too short. This page may not be suitable for summarization.",
      };
    }

    // Return extracted article data
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

// Extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch (e) {
    return "Unknown";
  }
}

// Log that content script is loaded
console.log("AI Article Summarizer: Content script loaded");
