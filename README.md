# AI Article Summarizer - Chrome Extension

A Chrome extension that uses Google Gemini AI to summarize web articles and export them to Word format.

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
3. You should see a "Phase 1 Complete" welcome message

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

### 4. Optional: Add Custom Icons

The extension currently uses Chrome's default icon. To add custom icons:

1. Create or download 4 PNG icons:
   - 16x16 pixels (toolbar icon)
   - 32x32 pixels (toolbar icon)
   - 48x48 pixels (extension management)
   - 128x128 pixels (Chrome Web Store)

2. Save them in the `icons/` directory as:
   - `icon16.png`
   - `icon32.png`
   - `icon48.png`
   - `icon128.png`

3. Uncomment the icons section in `manifest.json`

4. Reload the extension in `chrome://extensions/`

**Icon resources:**

- [Flaticon](https://www.flaticon.com/) - Free icons
- [Icons8](https://icons8.com/) - Free icons
- [Favicon Generator](https://www.favicon-generator.org/) - Create icons from images

## Tech Stack

- Chrome Manifest V3
- Side Panel API
- Vanilla JavaScript (no build tools)
- Google Gemini API (coming in Phase 4)
- docx library for Word export (coming in Phase 6)

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

## Development Roadmap

- [x] **Phase 1:** Extension shell
- [x] **Phase 2:** Options page & API key storage
- [x] **Phase 3:** Article extraction
- [x] **Phase 4:** Gemini API integration
- [ ] **Phase 5:** UI polish
- [x] **Phase 6:** Word export (.docx)
- [ ] **Phase 7:** Error handling
- [ ] **Phase 8:** Testing & documentation

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

**Word export not working:**

- Make sure you generated a summary first
- Check your Downloads folder for the .docx file
- Try again if the download was blocked by browser
- File name format: `Article_Title_summary.docx`

**Downloaded Word file won't open:**

- Try opening with a different word processor
- Make sure you have Microsoft Word, Google Docs, or LibreOffice installed
- Check that the file has .docx extension

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

4. **Export to Word (NEW!):**
   - Click "📥 Export to Word" button
   - A .docx file downloads to your laptop
   - Open in Microsoft Word, Google Docs, or any word processor

5. **Start a new article:**
   - Click "📄 New Article" to reset
   - Navigate to another article and repeat

### What You Get

- **Summary:** 3-5 sentence overview of the main points
- **Key Points:** 5-7 bullet points highlighting important information
- **Word Document:** Professional formatted .docx with article title, author, source, summary, bullet points, and metadata
- **Powered by:** Google Gemini AI

## Word Export Feature

The extension generates professional Word documents (.docx) with:

- **Article Title** (Heading 1)
- **Metadata:** Author, source, URL
- **Summary Section** with AI-generated overview
- **Key Points Section** with formatted bullet points
- **Footer:** Generation date and "Powered by Google Gemini AI"

**Document opens in:**

- Microsoft Word (Windows/Mac)
- Google Docs (upload to Drive)
- LibreOffice Writer
- Apple Pages
- Any word processor that supports .docx

**File naming:** `Article_Title_summary.docx` (auto-sanitized)

## Next Steps

**Remaining phases:**

- Phase 5: UI polish and refinements (optional)
- Phase 7: Enhanced error handling
- Phase 8: Final testing & comprehensive documentation

**Completed:**

- ✓ Chrome extension structure
- ✓ API key management
- ✓ Article extraction
- ✓ AI-powered summarization
- ✓ Word document export

---

**Version:** 1.0.0 (Phase 6)
**Powered by:** Google Gemini AI & Mozilla Readability
**License:** MIT
**Author:** Built with Claude Code
