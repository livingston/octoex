(() => {
  const masterToggle = document.getElementById("master-toggle");
  const presetsList = document.getElementById("presets-list");
  const pageSelect = document.getElementById("page-select");
  const cssEditor = document.getElementById("css-editor");
  const saveBtn = document.getElementById("save-css");
  const saveStatus = document.getElementById("save-status");
  const pageTypeIndicator = document.getElementById("page-type-indicator");
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".panel");

  let settings = {};

  // Tab switching
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`${tab.dataset.tab}-panel`).classList.add("active");
    });
  });

  // Load settings and render
  function load() {
    chrome.storage.sync.get(null, (data) => {
      if (chrome.runtime.lastError) return;
      settings = data;
      render();
    });
  }

  function render() {
    // Master toggle
    masterToggle.checked = settings.enabled !== false;
    document.body.classList.toggle("disabled", !masterToggle.checked);

    // Presets
    presetsList.innerHTML = "";
    for (const [id, preset] of Object.entries(OCTOEX_PRESETS)) {
      const config = settings.presets?.[id] || { enabled: false, pages: preset.defaultPages };
      const item = document.createElement("div");
      item.className = "preset-item";

      const pages = (config.pages || preset.defaultPages)
        .map((p) => `<span class="page-chip">${p}</span>`)
        .join("");

      item.innerHTML = `
        <div class="preset-info">
          <div class="preset-name">${preset.name}</div>
          <div class="preset-desc">${preset.description}</div>
          <div class="preset-pages">${pages}</div>
        </div>
        <label class="toggle">
          <input type="checkbox" data-preset="${id}" ${config.enabled ? "checked" : ""}>
          <span class="toggle-slider"></span>
        </label>
      `;
      presetsList.appendChild(item);
    }

    // Bind preset toggles
    presetsList.querySelectorAll("input[data-preset]").forEach((input) => {
      input.addEventListener("change", () => {
        const presetId = input.dataset.preset;
        if (!settings.presets) settings.presets = {};
        if (!settings.presets[presetId]) {
          settings.presets[presetId] = {
            enabled: false,
            pages: OCTOEX_PRESETS[presetId].defaultPages,
          };
        }
        settings.presets[presetId].enabled = input.checked;
        save();
      });
    });

    // Custom CSS - load current page type's CSS
    loadCSSForPage(pageSelect.value);
  }

  function loadCSSForPage(page) {
    cssEditor.value = settings.customCSS?.[page] || "";
  }

  pageSelect.addEventListener("change", () => {
    loadCSSForPage(pageSelect.value);
  });

  // Master toggle
  masterToggle.addEventListener("change", () => {
    settings.enabled = masterToggle.checked;
    document.body.classList.toggle("disabled", !masterToggle.checked);
    save();
  });

  // Save CSS
  saveBtn.addEventListener("click", () => {
    if (!settings.customCSS) settings.customCSS = {};
    settings.customCSS[pageSelect.value] = cssEditor.value;
    save(() => {
      saveStatus.textContent = "Saved!";
      setTimeout(() => (saveStatus.textContent = ""), 2000);
    });
  });

  // Allow Ctrl+S / Cmd+S in textarea
  cssEditor.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      saveBtn.click();
    }
    // Tab key inserts two spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const start = cssEditor.selectionStart;
      const end = cssEditor.selectionEnd;
      cssEditor.value = cssEditor.value.substring(0, start) + "  " + cssEditor.value.substring(end);
      cssEditor.selectionStart = cssEditor.selectionEnd = start + 2;
    }
  });

  function save(cb) {
    chrome.storage.sync.set(settings, () => {
      if (chrome.runtime.lastError) return;
      notifyContentScript();
      if (cb) cb();
    });
  }

  function notifyContentScript() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "octoex-apply" }).catch(() => {});
      }
    });
  }

  // Detect current page type from active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.url) return;
    try {
      const url = new URL(tabs[0].url);
      if (url.hostname !== "github.com") {
        pageTypeIndicator.textContent = "Not a GitHub page";
        return;
      }
      const path = url.pathname;
      const patterns = [
        { type: "pull-requests", pattern: /^\/[^/]+\/[^/]+\/pull(s|\/\d+)/ },
        { type: "issues", pattern: /^\/[^/]+\/[^/]+\/issues(\/\d+)?/ },
        { type: "actions", pattern: /^\/[^/]+\/[^/]+\/actions/ },
        { type: "code", pattern: /^\/[^/]+\/[^/]+\/(blob|tree)\// },
        { type: "repository", pattern: /^\/[^/]+\/[^/]+\/?$/ },
        { type: "profile", pattern: /^\/[^/]+\/?$/ },
      ];
      let detected = "global";
      for (const { type, pattern } of patterns) {
        if (pattern.test(path)) {
          detected = type;
          break;
        }
      }
      pageTypeIndicator.textContent = detected;
    } catch {
      pageTypeIndicator.textContent = "Unknown";
    }
  });

  load();
})();
