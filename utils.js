// Shared utility functions for API calls and storage

/**
 * Get API key from Chrome storage
 * @returns {Promise<string|null>} The stored API key or null
 */
async function getApiKey() {
  try {
    const result = await chrome.storage.sync.get(["geminiApiKey"]);
    return result.geminiApiKey || null;
  } catch (error) {
    console.error("Error retrieving API key:", error);
    return null;
  }
}

/**
 * Set API key in Chrome storage
 * @param {string} apiKey - The API key to store
 * @returns {Promise<void>}
 */
async function setApiKey(apiKey) {
  try {
    await chrome.storage.sync.set({ geminiApiKey: apiKey });
  } catch (error) {
    console.error("Error storing API key:", error);
    throw error;
  }
}

/**
 * Call Google Gemini API to generate content
 * @param {string} prompt - The prompt to send to Gemini
 * @param {string} apiKey - The API key to use
 * @returns {Promise<string>} The generated response text
 */
async function callGeminiAPI(prompt, apiKey) {
  const modelName = "gemini-2.5-flash";
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error?.message ||
        `API request failed with status ${response.status}`;

      // Handle specific error cases
      if (response.status === 400 && errorMessage.includes("API key")) {
        throw new Error("Invalid API key. Please check your settings.");
      } else if (response.status === 429) {
        throw new Error(
          "Rate limit exceeded. Please wait a moment and try again.",
        );
      } else if (response.status === 403) {
        throw new Error(
          "API key does not have permission. Please check your Google Cloud Console settings.",
        );
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Validate response structure
    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content
    ) {
      throw new Error("Unexpected API response format");
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    return generatedText;
  } catch (error) {
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError")
    ) {
      throw new Error("Network error. Please check your internet connection.");
    }
    throw error;
  }
}

/**
 * Create a summarization prompt for Gemini
 * @param {string} articleText - The article content to summarize
 * @param {string} articleTitle - The article title
 * @returns {string} The formatted prompt
 */
function createSummaryPrompt(articleText, articleTitle) {
  // Truncate very long articles to stay within token limits
  const maxChars = 15000; // Approximately 3750 tokens
  const truncatedText =
    articleText.length > maxChars
      ? articleText.substring(0, maxChars) + "...[truncated]"
      : articleText;

  return `Create a concise summary of this article IN ENGLISH (1500-2000 characters).

Article Title: ${articleTitle}
Article Content:
${truncatedText}

CRITICAL INSTRUCTIONS:
- Write a SUMMARY, not a translation
- Focus on what's NEW, SURPRISING, or IMPORTANT
- Do NOT repeat obvious facts or context everyone knows
- Do NOT use quotes unless absolutely necessary
- Identify ONE specific crucial fact or insight in one sentence
- Be analytical, not descriptive
- Keep it 1500-2000 characters total

FORMAT:

AUTHOR & SOURCE:
[One line: Author name (if mentioned) and publication, e.g., "Christina Nagel, ARD-Hauptstadtstudio" or just "Tagesschau.de"]

MAIN POINT:
[2-3 sentences: What is the core message? Why does this matter NOW?]

KEY INSIGHT:
[1 specific crucial fact or development that stands out - be concrete with numbers, names, or specific events]

IMPLICATIONS:
[2-3 sentences: What does this mean? What are the consequences or significance?]

CONTEXT (if relevant):
[1-2 sentences: Only if there's essential background needed to understand the significance]

Remember: Be concise, analytical, and focus on what's NOT obvious.`;
}

/**
 * Parse the Gemini API response into structured summary data
 * @param {string} responseText - The raw response from Gemini
 * @returns {Object} Parsed summary with summary text and bullet points array
 */
function parseSummaryResponse(responseText) {
  try {
    // Extract sections from the summary
    const sections = {
      authorSource: extractSection(responseText, "AUTHOR & SOURCE"),
      mainPoint: extractSection(responseText, "MAIN POINT"),
      keyInsight: extractSection(responseText, "KEY INSIGHT"),
      implications: extractSection(responseText, "IMPLICATIONS"),
      context: extractSection(responseText, "CONTEXT"),
    };

    // Build comprehensive summary from all sections
    let summary = "";

    if (sections.authorSource) {
      summary += `**Author & Source:** ${sections.authorSource}\n\n`;
    }

    if (sections.mainPoint) {
      summary += `**Main Point:**\n${sections.mainPoint}\n\n`;
    }

    if (sections.keyInsight) {
      summary += `**Key Insight:**\n${sections.keyInsight}\n\n`;
    }

    if (sections.implications) {
      summary += `**Implications:**\n${sections.implications}`;
    }

    if (sections.context && sections.context.length > 10) {
      summary += `\n\n**Context:**\n${sections.context}`;
    }

    // If no structured sections found, use the full raw response
    if (!summary || summary.length < 100) {
      summary = responseText; // Show FULL response
    }

    // Don't extract bullet points - everything is already shown in the summary
    // This prevents duplication
    let bulletPoints = [];

    return {
      summary: summary.trim() || responseText,
      bulletPoints: bulletPoints,
    };
  } catch (error) {
    console.error("Error parsing summary response:", error);
    return {
      summary: responseText.substring(0, 500),
      bulletPoints: [
        "Unable to parse detailed analysis - raw response shown above",
      ],
    };
  }
}

/**
 * Extract a specific section from the response text (internal helper)
 * @param {string} text - The full response text
 * @param {string} sectionHeader - The section header to look for
 * @returns {string} The extracted section content
 */
const extractSection = function (text, sectionHeader) {
  const regex = new RegExp(
    `${sectionHeader}\\s*:?\\s*([\\s\\S]*?)(?=\\n\\n[A-Z]|$)`,
    "i",
  );
  const match = text.match(regex);
  return match && match[1] ? match[1].trim() : "";
};
