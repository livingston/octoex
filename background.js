const DEFAULT_SETTINGS = {
  enabled: true,
  presets: {
    "private-repo-accent": { enabled: true, pages: ["repository", "code", "pull-requests", "issues", "actions", "profile"] },
  },
  customCSS: {
    global: "",
    "pull-requests": "",
    issues: "",
    code: "",
    repository: "",
    actions: "",
    profile: "",
  },
};

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.sync.set(DEFAULT_SETTINGS);
  } else if (details.reason === "update") {
    // Merge new presets into existing settings without overwriting user config
    chrome.storage.sync.get(null, (existing) => {
      if (chrome.runtime.lastError || !existing.presets) {
        chrome.storage.sync.set(DEFAULT_SETTINGS);
        return;
      }
      const merged = { ...existing };
      for (const [id, preset] of Object.entries(DEFAULT_SETTINGS.presets)) {
        if (!merged.presets[id]) {
          merged.presets[id] = preset;
        }
      }
      for (const [page, css] of Object.entries(DEFAULT_SETTINGS.customCSS)) {
        if (merged.customCSS[page] === undefined) {
          merged.customCSS[page] = css;
        }
      }
      chrome.storage.sync.set(merged);
    });
  }
});
