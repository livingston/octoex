const OCTOEX_PRESETS = {
  "private-repo-header": {
    name: "Private Repo Orange Header",
    description: "Shows an orange background header on private repositories",
    defaultPages: ["repository", "code", "pull-requests", "issues", "actions"],
    css: `
      .GlobalNav {
        --octoex-repo-accent: #3c6f3c !important;
      }
      html.octoex-private-repo .GlobalNav {
        --octoex-repo-accent: #ff964f !important;
      }
    `,
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.OCTOEX_PRESETS = OCTOEX_PRESETS;
}
