# Frontmatter Decorator - AI Agent Guide

This document provides context for AI coding assistants working on this Obsidian plugin.

## Project Overview

Frontmatter Decorator reads `color` and `icon` properties from note frontmatter and applies visual styling throughout the Obsidian interface (File Explorer, tabs, Quick Switcher, etc.).

## Tech Stack

- **Language**: TypeScript
- **Build**: esbuild via `npm run build`
- **Target**: Obsidian Plugin API
- **Hooks**: prek (pre-commit hooks)
- **Commits**: Commitizen via `uvx cz`
- **Linting**: ESLint (TypeScript), rumdl (Markdown)

## Key Files

| File | Purpose |
|------|---------|
| `main.ts` | Plugin entry point, all source code |
| `manifest.json` | Plugin metadata (id, version, minAppVersion) |
| `styles.css` | CSS for icon containers and styling |
| `versions.json` | Maps plugin versions to minimum Obsidian versions |

## Architecture

The plugin uses a modular observer pattern:

- **FileStyleCache** - Caches frontmatter lookups for performance
- **StyleApplicator** - Applies colors/icons to DOM elements
- **DOMObserver subclasses** - Watch and style specific UI areas:
  - `FileExplorerObserver`
  - `TabHeaderObserver`
  - `SuggesterObserver` (Quick Switcher + Link Suggester)
  - `BacklinksObserver`
  - `BasesObserver`
  - `EditorLinksObserver`

## Icon Support

- **Lucide**: Built-in via Obsidian's `setIcon()` API
- **Phosphor/Simple Icons**: Requires Notebook Navigator plugin, uses its `externalIconController.iconService.renderIcon()`

## Build & Test

```bash
npm install          # Install dependencies
npm run dev          # Watch mode for development
npm run build        # Production build
```

Test by copying `main.js`, `manifest.json`, and `styles.css` to:

```text
<Vault>/.obsidian/plugins/frontmatter-decorator/
```

Then reload Obsidian (Ctrl/Cmd+R).

## Common Patterns

### Adding a new observer

1. Create a class extending `DOMObserver`
2. Implement `start()`, `stop()`, and `refresh()` methods
3. Add setting toggle in `FrontmatterDecoratorSettings`
4. Initialize in `startObservers()` if setting is enabled
5. Add settings UI in `FrontmatterDecoratorSettingTab`

### Avoiding infinite loops

MutationObservers can trigger themselves when modifying DOM. Use guards:

```typescript
private isRefreshing = false;

refresh(): void {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    try {
        // ... do work
    } finally {
        this.isRefreshing = false;
    }
}
```

## Security Guidelines

- Default to local/offline operation
- No telemetry or external network calls
- No remote code execution
- Use Obsidian's APIs, avoid Node/Electron APIs

## Release Process

Releases are automated via GitHub Actions:

1. **Version Bump** (`version-bump.yml`): On push to main, analyzes conventional commits and bumps version accordingly:
   - `feat:` → minor bump
   - `fix:` → patch bump
   - `feat!:` or `fix!:` → major bump

2. **Release** (`release.yml`): When a version bump commit is detected, creates a GitHub release with:
   - Tag matching version (no "v" prefix)
   - `main.js`, `manifest.json`, and `styles.css` attached

### Manual release (if needed)

1. Update version in `manifest.json`, `package.json`, and `versions.json`
2. Run `npm run build`
3. Create GitHub release with tag matching version
4. Attach `main.js`, `manifest.json`, and `styles.css`

## Commit Messages

Use conventional commits. Run `npm run commit` or `uvx cz` for guided commits.

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
