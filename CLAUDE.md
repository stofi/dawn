# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Shopify Dawn theme (v15.4.1) customized for **kaaret.com**. A web-native, server-rendered Liquid theme with no JS frameworks.

## Development Commands

```bash
shopify theme dev          # Local development server (previews theme on your dev store)
shopify theme check        # Lint Liquid, accessibility, best practices
shopify theme push         # Deploy to store
```

There is no build step, bundler, or test runner. CI runs Theme Check and Lighthouse via GitHub Actions.

## Architecture

**Liquid template hierarchy:**
- `layout/theme.liquid` — Main HTML shell, CSS custom properties for color schemes
- `templates/*.json` — Page definitions (JSON) that compose sections with settings
- `sections/*.liquid` — Reusable page components with `{% schema %}` config blocks
- `snippets/*.liquid` — Partials included via `{% render 'name', prop: value %}`
- `assets/` — CSS and JS files loaded by sections/layout

**JavaScript patterns:**
- Vanilla custom elements (`<product-form>`, `<cart-drawer>`, `<slideshow-component>`, etc.)
- Pub/sub event system in `assets/pubsub.js` — events: `cart-update`, `variant-change`, `quantity-update`, `option-value-selection-change`, `cart-error`
- `assets/global.js` — Shared utilities: `SectionId`, `HTMLUpdateUtility`, `getFocusableElements()`
- All JS is `defer`-loaded, no render-blocking scripts

**CSS patterns:**
- Scoped by convention: `base.css` (global), `component-*.css`, `section-*.css`
- Color schemes via CSS custom properties scoped to `.color-{scheme-id}` classes
- 120-char line width, single quotes in JS, double quotes in Liquid (`.prettierrc.json`)

**Translations:**
- Source: `locales/en.default.json`
- Used via `{{ 'key.path' | t }}` in Liquid and `"t:key.path"` in schema JSON

## Theme Code Principles

From CONTRIBUTING.md — all changes should follow:
1. **Web-native** — No frameworks, libraries, or abstractions
2. **Lean & fast** — Zero CLS, no DOM manipulation before user input, no render-blocking JS
3. **Server-rendered** — Business logic in Liquid, JS only for interactivity
4. **Functional over pixel-perfect** — Progressive enhancement, fail-open

## Linting

Theme Check is configured in `.theme-check.yml` (disables `MatchingTranslations` and `TemplateLength`). VS Code extension: `shopify.theme-check-vscode`.

## Custom Changes (kaaret.com)

This fork receives light customizations on top of upstream Dawn. When modifying, prefer extending existing sections/snippets over creating new files. Keep changes minimal to ease upstream merges.
