const OCTOEX_PRESETS = {
  "private-repo-accent": {
    name: "Private Repo Accent",
    description: "Highlights private repos with an orange accent, public with green",
    defaultPages: ["repository", "code", "pull-requests", "issues", "actions", "profile"],
    css: `
      html:is(.octoex-page-repository, .octoex-page-code, .octoex-page-pull-requests, .octoex-page-issues, .octoex-page-actions) .GlobalNav {
        --octoex-repo-accent: #3c6f3c;
      }
      html.octoex-private-repo .GlobalNav {
        --octoex-repo-accent: #ff964f;
      }
      #user-repositories-list li.private {
        --octoex-repo-accent: #ff964f;
      }
      #user-repositories-list li.public {
        --octoex-repo-accent: #3c6f3c;
      }
    `,
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.OCTOEX_PRESETS = OCTOEX_PRESETS;
}
