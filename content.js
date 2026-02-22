(() => {
  const STYLE_ID = "octoex-styles";

  const PAGE_PATTERNS = [
    { type: "pull-requests", pattern: /^\/[^/]+\/[^/]+\/pull(s|\/\d+)/ },
    { type: "issues", pattern: /^\/[^/]+\/[^/]+\/issues(\/\d+)?/ },
    { type: "actions", pattern: /^\/[^/]+\/[^/]+\/actions/ },
    { type: "code", pattern: /^\/[^/]+\/[^/]+\/(blob|tree)\// },
    { type: "repository", pattern: /^\/[^/]+\/[^/]+\/?$/ },
    { type: "profile", pattern: /^\/[^/]+\/?$/ },
  ];

  function detectPageType() {
    const path = window.location.pathname;
    for (const { type, pattern } of PAGE_PATTERNS) {
      if (pattern.test(path)) return type;
    }
    return "global";
  }

  function buildCSS(settings, pageType) {
    if (!settings.enabled) return "";

    const parts = [];

    for (const [id, config] of Object.entries(settings.presets || {})) {
      if (!config.enabled) continue;
      const preset = OCTOEX_PRESETS[id];
      if (!preset) continue;
      const pages = config.pages || preset.defaultPages;
      if (pages.includes("global") || pages.includes(pageType)) {
        parts.push(`/* preset: ${id} */\n${preset.css}`);
      }
    }

    const customCSS = settings.customCSS || {};
    if (customCSS.global) {
      parts.push(`/* custom: global */\n${customCSS.global}`);
    }
    if (customCSS[pageType]) {
      parts.push(`/* custom: ${pageType} */\n${customCSS[pageType]}`);
    }

    return parts.join("\n\n");
  }

  function injectStyles(css) {
    let el = document.getElementById(STYLE_ID);
    if (!css) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(el);
    }
    el.textContent = css;
  }

  function detectPrivateRepo() {
    const isPrivate = !!document.querySelector(
      '.octicon-lock, [data-testid="repo-title-component"] .Label:not(.Label--success)'
    );
    document.documentElement.classList.toggle("octoex-private-repo", isPrivate);
  }

  function applyStyles() {
    chrome.storage.sync.get(null, (settings) => {
      if (chrome.runtime.lastError) return;
      detectPrivateRepo();
      const pageType = detectPageType();
      const css = buildCSS(settings, pageType);
      injectStyles(css);
    });
  }

  // Initial apply
  applyStyles();
  // Re-apply once DOM is ready if we ran at document_start
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyStyles);
  }

  // Listen for storage changes
  chrome.storage.onChanged.addListener(() => {
    applyStyles();
  });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "octoex-apply") {
      applyStyles();
    }
    if (msg.type === "octoex-get-page-type") {
      return detectPageType();
    }
  });

  // Detect SPA navigation via turbo
  let lastPath = window.location.pathname;

  const observer = new MutationObserver(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      applyStyles();
    }
  });

  function startObserver() {
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  if (document.body) {
    startObserver();
  } else {
    document.addEventListener("DOMContentLoaded", startObserver);
  }

  // Also listen to popstate for back/forward navigation
  window.addEventListener("popstate", applyStyles);

  // Intercept turbo:load for GitHub's Turbo-based navigation
  document.addEventListener("turbo:load", applyStyles);
})();
