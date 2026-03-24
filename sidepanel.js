// Side panel logic

// DOM Elements
const settingsBtn = document.getElementById("settings-btn");
const openSettingsBtn = document.getElementById("open-settings-btn");
const extractBtn = document.getElementById("extract-btn");
const summarizeBtn = document.getElementById("summarize-btn");
const clearBtn = document.getElementById("clear-btn");
const newArticleBtn = document.getElementById("new-article-btn");
const exportPdfBtn = document.getElementById("export-pdf-btn");
const findVocabBtn = document.getElementById("find-vocab-btn");
const vocabLanguageSelect = document.getElementById("vocab-language-select");
const vocabCefrSelect = document.getElementById("vocab-cefr-select");
const vocabDisplay = document.getElementById("vocab-display");
const vocabDisplayMeta = document.getElementById("vocab-display-meta");
const vocabWordList = document.getElementById("vocab-word-list");
const exportVocabPdfBtn = document.getElementById("export-vocab-pdf-btn");
const vocabNewArticleBtn = document.getElementById("vocab-new-article-btn");

const noApiKeyStatus = document.getElementById("no-api-key-status");
const mainContent = document.getElementById("main-content");
const loadingStatus = document.getElementById("loading-status");
const loadingText = document.getElementById("loading-text");
const statusMessage = document.getElementById("status-message");

const extractSectionEl = document.getElementById("extract-section");
const articleDisplay = document.getElementById("article-display");
const summaryDisplay = document.getElementById("summary-display");

const articleTitle = document.getElementById("article-title");
const articleAuthor = document.getElementById("article-author");
const articleSite = document.getElementById("article-site");
const articleLength = document.getElementById("article-length");
const articleExcerpt = document.getElementById("article-excerpt");
const articleUrl = document.getElementById("article-url");

const summaryText = document.getElementById("summary-text");
const bulletPoints = document.getElementById("bullet-points");

// Store extracted article data
let currentArticle = null;
let currentSummary = null;
let currentVocabulary = null;

// Initialize on load
document.addEventListener("DOMContentLoaded", initialize);

// Event Listeners
settingsBtn.addEventListener("click", openSettings);
if (openSettingsBtn) {
  openSettingsBtn.addEventListener("click", openSettings);
}
if (extractBtn) {
  extractBtn.addEventListener("click", extractArticle);
}
if (summarizeBtn) {
  summarizeBtn.addEventListener("click", summarizeArticle);
}
if (clearBtn) {
  clearBtn.addEventListener("click", clearArticle);
}
if (newArticleBtn) {
  newArticleBtn.addEventListener("click", startNewArticle);
}
if (exportPdfBtn) {
  exportPdfBtn.addEventListener("click", exportToPDF);
}
if (findVocabBtn) {
  findVocabBtn.addEventListener("click", findVocabulary);
}
if (exportVocabPdfBtn) {
  exportVocabPdfBtn.addEventListener("click", exportVocabularyPDF);
}
if (vocabNewArticleBtn) {
  vocabNewArticleBtn.addEventListener("click", startNewArticle);
}

// Initialize the side panel
async function initialize() {
  showLoading("Initializing...");
  await checkApiKeyStatus();
}

// Check if API key is configured
async function checkApiKeyStatus() {
  try {
    const result = await chrome.storage.sync.get(["geminiApiKey"]);
    const apiKey = result.geminiApiKey;

    hideLoading();

    if (apiKey && apiKey.trim().length > 0) {
      showMainContent();
    } else {
      showNoApiKey();
    }
  } catch (error) {
    console.error("Error checking API key:", error);
    hideLoading();
    showNoApiKey();
  }
}

// Extract article from current page
async function extractArticle() {
  try {
    showLoading("Extracting article content...");
    hideStatus();

    // Get current active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      throw new Error("No active tab found");
    }

    // Check if tab is a valid URL (not chrome:// or extension pages)
    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://")
    ) {
      throw new Error("Cannot extract content from Chrome system pages");
    }

    // Send message to content script to extract article
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "extractArticle",
    });

    hideLoading();

    if (response.success) {
      currentArticle = response.data;
      displayArticle(response.data);
      showStatus("Article extracted successfully!", "success");
    } else {
      throw new Error(response.error || "Failed to extract article");
    }
  } catch (error) {
    console.error("Extract article error:", error);
    hideLoading();
    if (error.message.includes("Receiving end does not exist")) {
      showStatus(
        "Could not reach the page. Please refresh the tab and try again.",
        "error",
      );
    } else {
      showStatus(error.message, "error");
    }
  }
}

// Display extracted article
function displayArticle(article) {
  articleTitle.textContent = article.title;
  articleAuthor.textContent = article.author;
  articleSite.textContent = article.siteName;
  articleLength.textContent = article.length.toLocaleString();
  articleExcerpt.textContent = article.excerpt;
  articleUrl.textContent = article.url;
  articleUrl.href = article.url;

  extractSectionEl.classList.add("hidden");
  articleDisplay.classList.remove("hidden");
}

// Clear article display
function clearArticle() {
  currentArticle = null;
  articleDisplay.classList.add("hidden");
  extractSectionEl.classList.remove("hidden");
  hideStatus();
}

// Summarize article using Gemini API
async function summarizeArticle() {
  if (!currentArticle) {
    showStatus(
      "No article to summarize. Please extract an article first.",
      "warning",
    );
    return;
  }

  try {
    showLoading("Generating AI summary...");
    hideStatus();

    // Get API key from storage
    const apiKey = await getApiKey();

    if (!apiKey) {
      hideLoading();
      showStatus(
        "API key not found. Please configure your Gemini API key in settings.",
        "error",
      );
      return;
    }

    // Create the prompt
    const prompt = createSummaryPrompt(
      currentArticle.content,
      currentArticle.title,
    );

    // Call Gemini API
    const response = await callGeminiAPI(prompt, apiKey);

    // Parse the response
    const parsed = parseSummaryResponse(response);

    // Store the summary
    currentSummary = {
      summary: parsed.summary,
      bulletPoints: parsed.bulletPoints,
      articleTitle: currentArticle.title,
      articleUrl: currentArticle.url,
    };

    hideLoading();

    // Display the summary
    displaySummary(parsed);

    showStatus("Summary generated successfully!", "success");
  } catch (error) {
    console.error("Summarization error:", error);
    hideLoading();
    showStatus(`Error: ${error.message}`, "error");
  }
}

// Display the generated summary
function displaySummary(parsed) {
  // Display summary text with HTML formatting
  summaryText.innerHTML = formatMarkdownToHTML(parsed.summary);

  // Get the bullet points section container
  const bulletPointsSection = document.getElementById("bullet-points-section");

  // Clear and populate bullet points
  bulletPoints.innerHTML = "";

  if (parsed.bulletPoints && parsed.bulletPoints.length > 0) {
    parsed.bulletPoints.forEach((point) => {
      const li = document.createElement("li");

      // Check if this is a section header (bold without bullet content)
      if (point.startsWith("**") && point.endsWith(":**")) {
        li.classList.add("section-header");
        li.innerHTML = formatMarkdownToHTML(point);
      } else {
        li.innerHTML = formatMarkdownToHTML(point);
      }

      bulletPoints.appendChild(li);
    });

    // Show the bullet points section
    bulletPointsSection.style.display = "block";
  } else {
    // Hide only the bullet points section, keep summary visible
    bulletPointsSection.style.display = "none";
  }

  // Hide article display, show summary
  articleDisplay.classList.add("hidden");
  summaryDisplay.classList.remove("hidden");
}

// Convert markdown-style bold (**text**) to HTML <strong>
function formatMarkdownToHTML(text) {
  return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

// Find vocabulary words from current article
async function findVocabulary() {
  if (!currentArticle) {
    showStatus(
      "No article loaded. Please extract an article first.",
      "warning",
    );
    return;
  }

  const targetLanguage = vocabLanguageSelect.value;
  const cefrLevel = vocabCefrSelect.value;

  if (!targetLanguage || !cefrLevel) {
    showStatus(
      "Please select both a target language and a CEFR level.",
      "warning",
    );
    return;
  }

  try {
    showLoading("Finding vocabulary words...");
    hideStatus();

    const apiKey = await getApiKey();
    if (!apiKey) {
      hideLoading();
      showStatus(
        "API key not found. Please configure your Gemini API key in settings.",
        "error",
      );
      return;
    }

    const prompt = createVocabularyPrompt(
      currentArticle.content,
      targetLanguage,
      cefrLevel,
    );
    const response = await callGeminiAPI(prompt, apiKey);
    const items = parseVocabularyResponse(response);

    if (!items) {
      hideLoading();
      showStatus(
        "Could not parse vocabulary response. Please try again.",
        "error",
      );
      return;
    }

    currentVocabulary = {
      items,
      language: targetLanguage,
      cefrLevel,
      articleTitle: currentArticle.title,
      articleUrl: currentArticle.url,
    };

    hideLoading();
    displayVocabulary(currentVocabulary);
    showStatus("Vocabulary list generated!", "success");
  } catch (error) {
    console.error("Vocabulary error:", error);
    hideLoading();
    showStatus(`Error: ${error.message}`, "error");
  }
}

// Display vocabulary word cards
function displayVocabulary(vocabData) {
  vocabDisplayMeta.textContent = `Language: ${vocabData.language} | Level: ${vocabData.cefrLevel} | ${vocabData.items.length} words`;

  vocabWordList.innerHTML = "";
  vocabData.items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "vocab-word-card";
    card.innerHTML = `
      <div class="vocab-word">${item.word}<span class="vocab-level-badge">${vocabData.cefrLevel}</span></div>
      <div class="vocab-translation">${item.translation}</div>
      <div class="vocab-example">${item.example}</div>
      <div class="vocab-example">${item.example_translation}</div>
    `;
    vocabWordList.appendChild(card);
  });

  articleDisplay.classList.add("hidden");
  summaryDisplay.classList.add("hidden");
  vocabDisplay.classList.remove("hidden");
}

// Export vocabulary list to PDF
async function exportVocabularyPDF() {
  if (!currentVocabulary || !currentArticle) {
    showStatus(
      "No vocabulary to export. Please generate a vocabulary list first.",
      "warning",
    );
    return;
  }

  try {
    showLoading("Generating Vocabulary PDF...");
    hideStatus();

    if (typeof window.jspdf === "undefined") {
      throw new Error(
        "PDF export library not loaded. Please reload the extension.",
      );
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;
    let yPosition = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0);
    const titleLines = doc.splitTextToSize(
      `Vocabulary: ${currentVocabulary.articleTitle}`,
      maxWidth,
    );
    doc.text(titleLines, margin, yPosition);
    yPosition += titleLines.length * 7 + 6;

    // Language and level subtitle
    doc.setFontSize(11);
    doc.setFont(undefined, "italic");
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Language: ${currentVocabulary.language} | Level: ${currentVocabulary.cefrLevel}`,
      margin,
      yPosition,
    );
    yPosition += 7;

    // Source URL
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.setTextColor(26, 115, 232);
    const urlLines = doc.splitTextToSize(
      currentVocabulary.articleUrl,
      maxWidth,
    );
    doc.text(urlLines, margin, yPosition);
    yPosition += urlLines.length * 4 + 10;

    // Horizontal rule
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Word entries
    currentVocabulary.items.forEach((item) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      // Word + level badge right-aligned
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.setTextColor(32, 33, 36);
      doc.text(item.word, margin, yPosition);

      const badgeText = currentVocabulary.cefrLevel;
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.setTextColor(21, 87, 176);
      const badgeWidth = doc.getTextWidth(badgeText);
      doc.text(badgeText, pageWidth - margin - badgeWidth, yPosition);
      yPosition += 6;

      // Translation
      doc.setFontSize(11);
      doc.setFont(undefined, "normal");
      doc.setTextColor(26, 115, 232);
      doc.text(item.translation, margin, yPosition);
      yPosition += 6;

      // Example sentence (original)
      doc.setFontSize(10);
      doc.setFont(undefined, "italic");
      doc.setTextColor(95, 99, 104);
      const exampleLines = doc.splitTextToSize(item.example, maxWidth);
      exampleLines.forEach((line) => {
        if (yPosition > 275) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });

      // Example sentence (translation)
      const exampleTranslationLines = doc.splitTextToSize(item.example_translation, maxWidth);
      exampleTranslationLines.forEach((line) => {
        if (yPosition > 275) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });

      // Light separator line
      yPosition += 3;
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 7;
    });

    // Footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setFont(undefined, "italic");
      doc.setTextColor(150, 150, 150);

      const footerY = doc.internal.pageSize.getHeight() - 15;
      const dateText = `Generated by Lexentio on ${new Date().toLocaleDateString(
        "en-US",
        { year: "numeric", month: "long", day: "numeric" },
      )}`;
      const dateWidth = doc.getTextWidth(dateText);
      doc.text(dateText, (pageWidth - dateWidth) / 2, footerY);

      const poweredText = "Powered by Google Gemini AI";
      const poweredWidth = doc.getTextWidth(poweredText);
      doc.text(poweredText, (pageWidth - poweredWidth) / 2, footerY + 5);
    }

    const filename = `${sanitizeFilename(currentVocabulary.articleTitle)}_vocab_${currentVocabulary.cefrLevel}_${currentVocabulary.language}.pdf`;
    doc.save(filename);

    hideLoading();
    showStatus("Vocabulary PDF downloaded successfully!", "success");
  } catch (error) {
    console.error("Vocab export error:", error);
    hideLoading();
    showStatus(`Export failed: ${error.message}`, "error");
  }
}

// Start a new article (reset everything)
function startNewArticle() {
  currentArticle = null;
  currentSummary = null;
  currentVocabulary = null;
  summaryDisplay.classList.add("hidden");
  vocabDisplay.classList.add("hidden");
  extractSectionEl.classList.remove("hidden");
  hideStatus();
}

// Open settings page
function openSettings() {
  chrome.runtime.openOptionsPage();
}

// UI State Management
function showLoading(message = "Loading...") {
  loadingText.textContent = message;
  loadingStatus.classList.remove("hidden");
}

function hideLoading() {
  loadingStatus.classList.add("hidden");
}

function showNoApiKey() {
  noApiKeyStatus.classList.remove("hidden");
  mainContent.classList.add("hidden");
}

function showMainContent() {
  mainContent.classList.remove("hidden");
  noApiKeyStatus.classList.add("hidden");
}

function showStatus(message, type = "info") {
  statusMessage.textContent = message;
  statusMessage.className = `status-box ${type}`;
  statusMessage.classList.remove("hidden");

  // Auto-hide success messages after 4 seconds
  if (type === "success") {
    setTimeout(() => {
      hideStatus();
    }, 4000);
  }
}

function hideStatus() {
  statusMessage.classList.add("hidden");
}

// Export summary to PDF document
async function exportToPDF() {
  if (!currentSummary || !currentArticle) {
    showStatus(
      "No summary to export. Please generate a summary first.",
      "warning",
    );
    return;
  }

  try {
    showLoading("Generating PDF document...");
    hideStatus();

    // Check if jsPDF library is loaded
    if (typeof window.jspdf === "undefined") {
      throw new Error(
        "PDF export library not loaded. Please reload the extension.",
      );
    }

    // Create a new PDF document
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;
    let yPosition = 20;

    // Article Title (Heading 1)
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    const titleLines = doc.splitTextToSize(currentArticle.title, maxWidth);
    doc.text(titleLines, margin, yPosition);
    yPosition += titleLines.length * 7 + 8;

    // Metadata (Author and Source)
    doc.setFontSize(10);
    doc.setFont(undefined, "italic");
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Author: ${currentArticle.author} | Source: ${currentArticle.siteName}`,
      margin,
      yPosition,
    );
    yPosition += 6;

    // Source URL
    doc.setFontSize(9);
    doc.setTextColor(26, 115, 232);
    const urlLines = doc.splitTextToSize(currentArticle.url, maxWidth);
    doc.text(urlLines, margin, yPosition);
    yPosition += urlLines.length * 4 + 10;

    // Summary Heading
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Summary", margin, yPosition);
    yPosition += 8;

    // Summary Text
    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.setTextColor(51, 51, 51);

    // Remove markdown formatting from summary for PDF
    const cleanSummary = currentSummary.summary.replace(/\*\*(.*?)\*\*/g, "$1");
    const summaryLines = doc.splitTextToSize(cleanSummary, maxWidth);

    // Check if we need a new page
    summaryLines.forEach((line) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });

    yPosition += 8;

    // Key Points Heading (only if bullet points exist)
    if (currentSummary.bulletPoints && currentSummary.bulletPoints.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Key Points", margin, yPosition);
      yPosition += 8;

      // Bullet Points
      doc.setFontSize(11);
      doc.setFont(undefined, "normal");
      doc.setTextColor(51, 51, 51);

      currentSummary.bulletPoints.forEach((point) => {
        // Remove markdown formatting
        const cleanPoint = point.replace(/\*\*(.*?)\*\*/g, "$1");
        const bulletLines = doc.splitTextToSize(cleanPoint, maxWidth - 5);

        bulletLines.forEach((line, index) => {
          if (yPosition > 275) {
            doc.addPage();
            yPosition = 20;
          }

          if (index === 0) {
            // First line with bullet
            doc.text("•", margin, yPosition);
            doc.text(line, margin + 5, yPosition);
          } else {
            // Continuation lines (indented)
            doc.text(line, margin + 5, yPosition);
          }
          yPosition += 6;
        });

        yPosition += 2; // Extra space between bullet points
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setFont(undefined, "italic");
      doc.setTextColor(150, 150, 150);

      const footerY = doc.internal.pageSize.getHeight() - 15;
      const dateText = `Generated by Lexentio on ${new Date().toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      )}`;
      const textWidth = doc.getTextWidth(dateText);
      doc.text(dateText, (pageWidth - textWidth) / 2, footerY);

      const poweredText = "Powered by Google Gemini AI";
      const poweredWidth = doc.getTextWidth(poweredText);
      doc.text(poweredText, (pageWidth - poweredWidth) / 2, footerY + 5);
    }

    // Save the PDF
    const filename = `${sanitizeFilename(currentArticle.title)}_summary.pdf`;
    doc.save(filename);

    hideLoading();
    showStatus("PDF document downloaded successfully!", "success");
  } catch (error) {
    console.error("Export error:", error);
    hideLoading();
    showStatus(`Export failed: ${error.message}`, "error");
  }
}

// Sanitize filename for safe download
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9\s-]/gi, "_") // Replace special chars with underscore
    .replace(/\s+/g, "_") // Replace spaces with underscore
    .replace(/_+/g, "_") // Replace multiple underscores with single
    .substring(0, 50) // Limit length
    .replace(/^_|_$/g, ""); // Remove leading/trailing underscores
}

// Listen for storage changes (when API key is updated in options)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync" && changes.geminiApiKey) {
    checkApiKeyStatus();
  }
});
