# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Workflow Rules

**IMPORTANT:**
- Make code changes when the user requests them
- **NEVER commit changes without explicit user permission**
- When changes are ready, inform the user and wait for them to approve before committing
- The user prefers to review changes before they are committed to git history
- **DO NOT include co-author attribution** in commit messages
- Keep commit messages concise and descriptive

## Code Style Guidelines

**Variable Naming:**
- Use clear, self-explanatory variable names that describe their purpose
- Avoid abbreviations unless universally understood (e.g., `url`, `api`)
- Examples: `bulletPointsSection` instead of `bps`, `currentArticle` instead of `currArt`

**Comments:**
- Avoid unnecessary comments - code should be self-documenting
- Only add comments when logic is genuinely complex or non-obvious
- Never add comments that simply restate what the code does
- Focus on writing clear code with descriptive names instead of relying on comments

## Development Commands

### Testing the Extension

```bash
# Load/reload extension in Chrome
# 1. Navigate to: chrome://extensions/
# 2. Enable "Developer mode" (top-right toggle)
# 3. Click "Load unpacked" (for initial load) or Reload icon (after changes)
# 4. Select this directory: /Users/kate/ai-summarizer
```

### Debugging

```bash
# Debug side panel
# 1. Click extension icon to open side panel
# 2. Right-click anywhere in side panel → "Inspect"
# 3. Console tab shows errors from sidepanel.js and utils.js

# Debug content script (article extraction)
# 1. Open any web page
# 2. F12 → Console tab
# 3. Look for "AI Article Summarizer: Content script loaded"
# 4. Errors from content.js and Readability.js appear here

# Debug background service worker
# 1. Go to chrome://extensions/
# 2. Find "AI Article Summarizer"
# 3. Click "Inspect views: service worker"
# 4. Console shows errors from background.js
```

## Architecture Overview

### Extension Type

Chrome Extension (Manifest V3) with **Side Panel API** - the UI appears as a sidebar, not a popup.

### Core Data Flow

```
User clicks extension icon
         ↓
background.js opens side panel (sidepanel.html)
         ↓
User clicks "Extract Article"
         ↓
sidepanel.js → chrome.tabs.sendMessage('extractArticle')
         ↓
content.js receives message, uses Readability.js
         ↓
Returns: {title, content, author, excerpt, url, length, siteName}
         ↓
sidepanel.js displays article metadata
         ↓
User clicks "Summarize"
         ↓
sidepanel.js → utils.js::callGeminiAPI(prompt, apiKey)
         ↓
Gemini API returns structured text response
         ↓
utils.js::parseSummaryResponse() extracts sections
         ↓
sidepanel.js::displaySummary() renders formatted summary
         ↓
User clicks "Export to PDF"
         ↓
sidepanel.js::exportToPDF() uses jspdf library
         ↓
Browser downloads .pdf file to user's laptop
```

### Critical Architecture Details

#### 1. Message Passing Pattern (sidepanel.js ↔ content.js)

Content scripts run in isolated contexts. Communication requires:

```javascript
// sidepanel.js sends
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const response = await chrome.tabs.sendMessage(tab.id, {
  action: "extractArticle",
});

// content.js receives
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractArticle") {
    extractArticleContent().then((result) => sendResponse(result));
    return true; // CRITICAL: Required for async response
  }
});
```

#### 2. Library Loading Strategy (CSP Constraints)

Chrome extensions have strict Content Security Policy - **no external CDN scripts allowed**.

**Solution:** All libraries are downloaded locally:

- `Readability.js` (82KB) - Mozilla's article extraction
- `jspdf.umd.min.js` (355KB) - UMD build from `unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js`

Loaded in HTML:

```html
<script src="jspdf.umd.min.js"></script>
<!-- Must load before sidepanel.js -->
<script src="utils.js"></script>
<script src="sidepanel.js"></script>
```

Content scripts loaded via manifest.json (NOT dynamically):

```json
"content_scripts": [{
  "matches": ["<all_urls>"],
  "js": ["Readability.js", "content.js"]  // Order matters
}]
```

#### 3. Variable Naming Conflict Risk

Both `utils.js` and `sidepanel.js` are loaded in the same scope. **Avoid global variable name collisions.**

Example past issue:

- `utils.js` had function `extractSection`
- `sidepanel.js` had DOM element variable `const extractSection = document.getElementById(...)`
- **Solution:** Renamed DOM element to `extractSectionEl`

#### 4. Gemini API Integration (utils.js)

**Current Model:** `gemini-2.5-flash` (cheapest, fast)

**Key Configuration:**

```javascript
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

generationConfig: {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 4096  // Increased for detailed summaries
}
```

**Prompt Engineering Critical Points:**

- Summary length: 1500-2000 characters
- Must be ANALYTICAL, not translation
- Format: AUTHOR & SOURCE (1 line) → MAIN POINT → KEY INSIGHT → IMPLICATIONS → CONTEXT
- No bullet point extraction (to prevent duplication with summary sections)

#### 5. Summary Display Logic (sidepanel.js)

**Critical UI Behavior:**

```javascript
function displaySummary(parsed) {
  summaryText.innerHTML = formatMarkdownToHTML(parsed.summary);
  const bulletPointsSection = document.getElementById("bullet-points-section");

  // IMPORTANT: Hide only bullet-points-section, NOT parent article-card
  if (parsed.bulletPoints && parsed.bulletPoints.length > 0) {
    bulletPointsSection.style.display = "block";
  } else {
    bulletPointsSection.style.display = "none"; // Only hide this div
  }

  articleDisplay.classList.add("hidden");
  summaryDisplay.classList.remove("hidden"); // Show summary container
}
```

**Why This Matters:**
Past bug - code was hiding `bulletPoints.parentElement`, which hid the entire article-card containing the summary. Now wrapped bullet points in separate `<div id="bullet-points-section">` to hide selectively.

#### 6. API Key Storage

**Secure Storage:**

```javascript
// Storage (encrypted by Chrome automatically)
chrome.storage.sync.set({ geminiApiKey: apiKey });

// Retrieval
chrome.storage.sync.get(["geminiApiKey"], (result) => {
  const apiKey = result.geminiApiKey || null;
});
```

**Storage Location:** Synced across user's Chrome browsers. Encrypted by Chrome.

#### 7. PDF Export Architecture (sidepanel.js)

Uses `jspdf` library (UMD build):

```javascript
const { jsPDF } = window.jspdf;
const doc = new jsPDF();

// Add title with formatting
doc.setFontSize(18);
doc.setFont(undefined, "bold");
doc.text(titleLines, margin, yPosition);

// Add metadata
doc.setFontSize(10);
doc.text(`Author: ${author} | Source: ${siteName}`, margin, yPosition);

// Add summary text
doc.setFontSize(11);
const summaryLines = doc.splitTextToSize(cleanSummary, maxWidth);
doc.text(summaryLines, margin, yPosition);

// Add bullet points if present
bulletPoints.forEach((point) => {
  doc.text("•", margin, yPosition);
  doc.text(line, margin + 5, yPosition);
});

// Save PDF
const filename = `${sanitizeFilename(currentArticle.title)}_summary.pdf`;
doc.save(filename);
```

## File Responsibilities

### Core Execution Files

- **sidepanel.js** - Main orchestrator (80% of business logic)
- **utils.js** - Gemini API calls, prompt engineering, response parsing
- **content.js** - Article extraction using Readability.js
- **background.js** - Minimal service worker (side panel configuration only)

### Configuration Files

- **manifest.json** - Chrome extension configuration (permissions, content scripts, side panel)
- **options.js** - API key CRUD operations

### UI Files

- **sidepanel.html** - Main UI structure (inline CSS in `<style>` tags)
- **options.html** - Settings page (inline CSS in `<style>` tags)

### External Libraries (Local)

- **Readability.js** - Mozilla's article extraction (82KB)
- **jspdf.umd.min.js** - PDF document generation UMD build (355KB)

## Common Issues and Solutions

### Issue: "Identifier 'X' has already been declared"

**Cause:** Global variable name collision between utils.js and sidepanel.js
**Solution:** Use unique prefixes or rename variables (e.g., DOM elements end with `El`)

### Issue: CSP Violation for External Script

**Cause:** Trying to load library from CDN
**Solution:** Download library locally, use UMD build if available

### Issue: Content Script Not Loading Readability.js

**Cause:** Trying to dynamically load in content.js
**Solution:** Load via manifest.json content_scripts array

### Issue: Model "gemini-X" Not Found

**Cause:** Model name changed or deprecated
**Solution:** Check user's available models, use `gemini-2.5-flash` (current)

### Issue: Summary Disappears After "Successful" Message

**Cause:** Hiding wrong parent element when bullet points are empty
**Solution:** Wrap bullet points in separate `<div id="bullet-points-section">` and hide only that

### Issue: API Response Too Short/Truncated

**Cause:** maxOutputTokens too low
**Solution:** Increase to 4096 (current setting)

### Issue: Summary is Translation, Not Analysis

**Cause:** Prompt not explicit enough
**Solution:** Add "Write a SUMMARY, not a translation" + focus on NEW/SURPRISING content

## Key Constraints

1. **No Build Tools** - Pure HTML/CSS/JS (no webpack, no npm scripts)
2. **Manifest V3** - Must use service workers, not background pages
3. **CSP Restrictions** - All scripts must be local files
4. **Side Panel API** - Requires Chrome 114+
5. **Token Limits** - Gemini API: 4096 max output tokens
6. **Article Truncation** - utils.js truncates to 15000 chars (~3750 tokens) before sending to API
7. **Summary Length** - Target 1500-2000 characters (enforced via prompt)

## Testing Checklist

When making changes, test:

1. Extension loads without errors in chrome://extensions/
2. Side panel opens when clicking extension icon
3. Article extraction works on: news sites (NYTimes), blogs (Medium), technical docs
4. Summary generation completes without errors
5. Summary displays correctly (not blank, not hidden)
6. PDF export downloads .pdf file
7. Downloaded .pdf opens correctly in PDF viewers (Adobe, Preview, Chrome)
8. API key saves/loads across browser restarts
9. Error messages display properly (invalid API key, network errors, rate limits)
10. "New Article" button resets UI correctly
