# OctoEx

A Chrome Extension that lets you customize the styling of github.com with toggleable presets and per-page custom CSS.

## Features

### Private Repo Accent

Adds a subtle gradient glow to the GitHub navigation header that changes color based on repository visibility:

- **Green** (`#3c6f3c`) for public repositories
- **Orange** (`#ff964f`) for private repositories
- **Transparent** on non-repo pages (no layout shift)

The color transitions smoothly when navigating between repos using CSS `@property` animation.

On profile and organisation pages, each repo in the listing gets a similar gradient highlight so you can quickly distinguish private from public repos at a glance. This includes org profile pages and the `/orgs/*/repositories` tab, with support for paginated lists.

### Custom CSS

Write your own CSS scoped to specific GitHub page types:

- **Global** -- all github.com pages
- **Repository** -- main repo page
- **Code** -- file/tree views
- **Pull Requests** -- PR pages
- **Issues** -- issue pages
- **Actions** -- workflow pages
- **Profile** -- user and org profile pages
- **Org Repositories** -- org-scoped repo listings (`/orgs/*/repositories`)

### Page Type Detection

The extension detects the current page type via URL patterns and adds `octoex-page-{type}` classes to `<html>`, which you can use in your custom CSS for precise targeting.

## Installation

1. Clone or download this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked** and select the `octoex` folder
5. Navigate to github.com -- the extension is active

## Usage

Click the OctoEx icon in the toolbar to open the popup:

- **Master toggle** -- enable/disable all styling
- **Presets tab** -- toggle built-in style presets on/off
- **Custom CSS tab** -- select a page type from the dropdown and write CSS in the textarea
  - `Ctrl+S` / `Cmd+S` saves your CSS
  - `Tab` inserts two spaces

Changes apply immediately -- no page refresh needed. Settings sync across Chrome instances via `chrome.storage.sync`.

## Project Structure

```
octoex/
├── manifest.json       # MV3 manifest
├── background.js       # Service worker (install defaults, storage)
├── content.js          # Content script (page detection, CSS injection)
├── content.css         # Base styles (CSS properties, gradients)
├── presets.js          # Built-in preset definitions
├── popup/
│   ├── popup.html      # Popup UI
│   ├── popup.css       # Popup styling (GitHub dark theme)
│   └── popup.js        # Popup logic
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```
