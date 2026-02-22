(() => {
  const STYLE_ID = "octoex-styles";

  const PAGE_PATTERNS = [
    { type: "pull-requests", pattern: /^\/[^/]+\/[^/]+\/pull(s|\/\d+)/ },
    { type: "issues", pattern: /^\/[^/]+\/[^/]+\/issues(\/\d+)?/ },
    { type: "actions", pattern: /^\/[^/]+\/[^/]+\/actions/ },
    { type: "code", pattern: /^\/[^/]+\/[^/]+\/(blob|tree)\// },
    { type: "repository", pattern: /^\/[^/]+\/[^/]+\/?$/ },
    { type: "org-repositories", pattern: /^\/orgs\/[^/]+\/repositories/ },
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

  const PAGE_TYPES = PAGE_PATTERNS.map((p) => p.type).concat("global");

  function applyPageClass(pageType) {
    const root = document.documentElement;
    for (const type of PAGE_TYPES) {
      root.classList.toggle(`octoex-page-${type}`, type === pageType);
    }
  }

  function markOrgRepoVisibility(pageType) {
    if (pageType === "profile") {
      document.querySelectorAll('.org-repos.repo-list li').forEach((li) => {
        const label = li.querySelector('.Label');
        if (!label) return;
        const text = label.textContent.trim().toLowerCase();
        const visibility = text.includes('private') ? 'private' : text.includes('public') ? 'public' : '';
        if (visibility) li.setAttribute('data-octoex-visibility', visibility);
      });
    }
    if (pageType === "org-repositories") {
      document.querySelectorAll('[data-listview-component="items-list"] > *').forEach((item) => {
        const container = item.querySelector('[data-listview-item-title-container="true"]');
        if (!container) return;
        const label = container.querySelector('[data-listview-item-visibility-label="true"]');
        if (!label) return;
        const text = label.textContent.trim().toLowerCase();
        const visibility = text.includes('private') ? 'private' : text.includes('public') ? 'public' : '';
        if (visibility) item.setAttribute('data-octoex-visibility', visibility);
      });
    }
  }

  function detectPrivateRepo(pageType) {
    const isRepoPage = ["repository", "code", "pull-requests", "issues", "actions"].includes(pageType);
    if (!isRepoPage) {
      document.documentElement.classList.remove("octoex-private-repo");
      return;
    }
    const titleComponent = document.querySelector('#repo-title-component, [data-testid="repo-title-component"]');
    let isPrivate = false;
    if (titleComponent) {
      if (titleComponent.querySelector('.octicon-lock')) {
        isPrivate = true;
      } else {
        const label = titleComponent.querySelector('.Label');
        isPrivate = !!label && label.textContent.trim().toLowerCase().includes('private');
      }
    }
    document.documentElement.classList.toggle("octoex-private-repo", isPrivate);
  }

  function applyStyles() {
    chrome.storage.sync.get(null, (settings) => {
      if (chrome.runtime.lastError) return;
      const pageType = detectPageType();
      applyPageClass(pageType);
      detectPrivateRepo(pageType);
      markOrgRepoVisibility(pageType);
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

  let markDebounce = null;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      applyStyles();
    } else {
      const pageType = detectPageType();
      if (pageType === "org-repositories" && document.querySelector('[data-listview-component="items-list"] > :not([data-octoex-visibility])')) {
        clearTimeout(markDebounce);
        markDebounce = setTimeout(() => markOrgRepoVisibility("org-repositories"), 100);
      } else if (pageType === "profile" && document.querySelector('.org-repos.repo-list li:not([data-octoex-visibility])')) {
        clearTimeout(markDebounce);
        markDebounce = setTimeout(() => markOrgRepoVisibility("profile"), 100);
      }
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
