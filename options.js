// Options page logic for API key management

// DOM Elements
const apiKeyInput = document.getElementById("api-key");
const saveBtn = document.getElementById("save-btn");
const clearBtn = document.getElementById("clear-btn");
const toggleVisibilityBtn = document.getElementById("toggle-visibility");
const statusMessage = document.getElementById("status-message");
const keyStatus = document.getElementById("key-status");

// Load saved API key on page load
document.addEventListener("DOMContentLoaded", loadApiKey);

// Event Listeners
saveBtn.addEventListener("click", saveApiKey);
clearBtn.addEventListener("click", clearApiKey);
toggleVisibilityBtn.addEventListener("click", togglePasswordVisibility);
apiKeyInput.addEventListener("input", clearStatusMessage);

// Load API key from storage
async function loadApiKey() {
  try {
    const result = await chrome.storage.sync.get(["geminiApiKey"]);
    const apiKey = result.geminiApiKey;

    if (apiKey) {
      apiKeyInput.value = apiKey;
      updateKeyStatus(true);
    } else {
      updateKeyStatus(false);
    }
  } catch (error) {
    console.error("Error loading API key:", error);
    showStatus("Failed to load saved settings", "error");
    updateKeyStatus(false);
  }
}

// Save API key to storage
async function saveApiKey() {
  const apiKey = apiKeyInput.value.trim();

  // Validation
  if (!apiKey) {
    showStatus("Please enter an API key", "warning");
    apiKeyInput.focus();
    return;
  }

  // Basic format validation (Gemini keys typically start with "AIza")
  if (!apiKey.startsWith("AIza")) {
    showStatus(
      'Warning: Gemini API keys typically start with "AIza". Please verify your key.',
      "warning",
    );
  }

  // Minimum length check
  if (apiKey.length < 20) {
    showStatus(
      "API key seems too short. Please verify it's correct.",
      "warning",
    );
    return;
  }

  try {
    // Save to chrome.storage.sync (encrypted by Chrome)
    await chrome.storage.sync.set({ geminiApiKey: apiKey });

    showStatus("API key saved successfully!", "success");
    updateKeyStatus(true);

    // Vibrate feedback (if supported)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  } catch (error) {
    console.error("Error saving API key:", error);
    showStatus("Failed to save API key. Please try again.", "error");
  }
}

// Clear API key from storage
async function clearApiKey() {
  if (
    !confirm(
      "Are you sure you want to clear your API key? You'll need to enter it again to use the extension.",
    )
  ) {
    return;
  }

  try {
    await chrome.storage.sync.remove(["geminiApiKey"]);
    apiKeyInput.value = "";
    showStatus("API key cleared", "success");
    updateKeyStatus(false);
  } catch (error) {
    console.error("Error clearing API key:", error);
    showStatus("Failed to clear API key", "error");
  }
}

// Toggle password visibility
function togglePasswordVisibility() {
  const currentType = apiKeyInput.type;

  if (currentType === "password") {
    apiKeyInput.type = "text";
    toggleVisibilityBtn.textContent = "🔒";
    toggleVisibilityBtn.title = "Hide API key";
  } else {
    apiKeyInput.type = "password";
    toggleVisibilityBtn.textContent = "👁️";
    toggleVisibilityBtn.title = "Show API key";
  }
}

// Show status message
function showStatus(message, type = "success") {
  statusMessage.textContent = message;
  statusMessage.className = type;
  statusMessage.classList.remove("hidden");

  // Auto-hide success messages after 3 seconds
  if (type === "success") {
    setTimeout(() => {
      statusMessage.classList.add("hidden");
    }, 3000);
  }
}

// Clear status message
function clearStatusMessage() {
  statusMessage.classList.add("hidden");
}

// Update key status indicator
function updateKeyStatus(isConfigured) {
  const statusIcon = keyStatus.querySelector(".status-icon");
  const statusText = keyStatus.querySelector(".status-text");

  if (isConfigured) {
    statusIcon.textContent = "✓";
    statusText.textContent = "API Key Configured";
    keyStatus.classList.add("configured");
  } else {
    statusIcon.textContent = "✗";
    statusText.textContent = "No API Key Configured";
    keyStatus.classList.remove("configured");
  }
}

// Keyboard shortcut: Ctrl/Cmd + S to save
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    saveApiKey();
  }
});
