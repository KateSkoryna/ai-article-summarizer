# AI Article Summarizer - Chrome Extension

A Chrome extension that uses Google Gemini AI to summarize web articles and export them to PDF format.

## Installation Instructions

### 1. Load Extension in Chrome

1. Open Chrome and navigate to: `chrome://extensions/`

2. Enable **Developer mode** (toggle in top-right corner)

3. Click **"Load unpacked"**

4. Select the `/Users/kate/ai-summarizer` directory

5. The extension should now appear in your extensions list

6. Pin the extension to your toolbar for easy access:
   - Click the puzzle piece icon in Chrome toolbar
   - Find "AI Article Summarizer"
   - Click the pin icon

### 2. Test the Extension

1. Click the extension icon in your toolbar
2. The side panel should open on the right side
3. You should see the setup prompt if no API key is configured

### 3. Configure Your Gemini API Key

1. **Get a free Gemini API key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the generated key

2. **Configure the extension:**
   - Click the extension icon in your toolbar
   - Click "Open Settings" button
   - Paste your API key in the input field
   - Click "Save API Key"

3. **Verify it's working:**
   - The side panel should show "✓ API key configured!"
   - You're now ready to summarize articles!

**Note:** The API key is stored securely in Chrome's encrypted storage and never leaves your browser except to make API calls to Google Gemini.

## Tech Stack

- Chrome Manifest V3
- Side Panel API
- Vanilla JavaScript (no build tools)
- Google Gemini API (gemini-2.5-flash model)
- jsPDF library for PDF export
- Mozilla Readability.js for article extraction

## Project Structure

```
ai-summarizer/
├── manifest.json          # Extension configuration (Manifest V3)
├── background.js          # Service worker for side panel
├── content.js             # Article extraction (Readability.js)
├── utils.js               # Gemini API integration & utilities
├── sidepanel.html         # Main UI
├── sidepanel.js           # Side panel logic
├── options.html           # Settings page
├── options.js             # Settings logic
├── options.css            # Settings styling
├── icons/                 # Extension icons (optional)
│   └── README.txt         # Icon setup instructions
└── README.md             # This file
```

**Key Files:**

- **utils.js** - Gemini API calls, prompt engineering, response parsing
- **content.js** - Extracts clean article content using Mozilla Readability.js
- **sidepanel.js** - Main workflow: extract → summarize → display

## Features

✅ **Extension Structure** - Chrome Manifest V3 with Side Panel API
✅ **API Key Management** - Secure storage in Chrome's encrypted sync storage
✅ **Article Extraction** - Clean content extraction using Mozilla Readability.js
✅ **AI Summarization** - Powered by Google Gemini 2.5 Flash model
✅ **PDF Export** - Professional formatted PDF documents with summary and metadata
✅ **Error Handling** - Comprehensive error messages for all failure scenarios
✅ **Responsive UI** - Clean, modern interface with loading states and status messages

## Troubleshooting

**Extension doesn't appear:**

- Make sure Developer mode is enabled in `chrome://extensions/`
- Check that you selected the correct directory

**Side panel doesn't open:**

- Make sure you're using Chrome 114 or later (Side Panel API requirement)
- Try reloading the extension

**"Invalid API key" error:**

- Go to Settings and verify your API key is correct
- Get a new key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Make sure the key starts with "AIza"

**"Rate limit exceeded" error:**

- Wait a few minutes before trying again
- Gemini free tier has rate limits (60 requests/minute)

**"Network error" or summarization fails:**

- Check your internet connection
- Verify the article was extracted successfully first
- Try a shorter article (very long articles may exceed token limits)

**Article extraction fails:**

- Some pages may not be recognized as articles (homepages, search results)
- Try a different article from a news site or blog
- Cannot extract from Chrome system pages (chrome://)

**PDF export not working:**

- Make sure you generated a summary first
- Check your Downloads folder for the .pdf file
- Try again if the download was blocked by browser
- File name format: `Article_Title_summary.pdf`

**Downloaded PDF file won't open:**

- Try opening with a different PDF viewer
- Make sure you have Adobe Reader, Preview (Mac), or Chrome installed
- Check that the file has .pdf extension

**Console errors:**

- Right-click the extension icon → "Inspect"
- Check the Console tab for detailed error messages

## How to Use

### 1. Setup Your API Key (One-time)

- Click the extension icon → Click "Open Settings"
- Visit [Google AI Studio](https://makersuite.google.com/app/apikey) to get a free API key
- Paste your API key and click "Save API Key"

### 2. Complete Workflow

1. **Navigate to an article:**
   - Open any news article or blog post in Chrome
   - Examples: NYTimes, Medium, BBC News, tech blogs, documentation

2. **Extract the article:**
   - Click the extension icon to open the side panel
   - Click "📄 Extract Article"
   - View the extracted title, author, word count, and excerpt

3. **Generate AI summary:**
   - Click "✨ Summarize" button
   - Wait 2-5 seconds for AI processing
   - View your summary and key points!

4. **Export to PDF:**
   - Click "📥 Export to PDF" button
   - A .pdf file downloads to your laptop
   - Open in any PDF viewer (Adobe Reader, Preview, Chrome)

5. **Start a new article:**
   - Click "📄 New Article" to reset
   - Navigate to another article and repeat

### What You Get

- **Summary:** Concise analytical summary (1500-2000 characters) focusing on what's new and important
- **Structured Analysis:** Author & Source, Main Point, Key Insight, Implications, and Context sections
- **PDF Document:** Professional formatted PDF with article title, author, source, summary, and metadata
- **Powered by:** Google Gemini AI (gemini-2.5-flash model)

## PDF Export Feature

The extension generates professional PDF documents with:

- **Article Title** (Bold, 18pt heading)
- **Metadata:** Author, source, and article URL
- **Summary Section** with AI-generated analytical overview
- **Key Points Section** with formatted bullet points (when available)
- **Footer:** Generation date and "Powered by Google Gemini AI" on every page

**PDF Features:**

- Clean typography and professional formatting
- Automatic page breaks for long content
- Markdown formatting converted to plain text
- Works with any PDF viewer (Adobe Reader, Preview, Chrome, Edge)
- Portable format - works on any device

**File naming:** `Article_Title_summary.pdf` (auto-sanitized)

---

**Version:** 1.0.0
**Powered by:** Google Gemini AI & Mozilla Readability
**License:** MIT
