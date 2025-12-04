# Frontmatter Decorator

An Obsidian plugin that applies colors and icons from frontmatter properties to files throughout the Obsidian interface.

## Features

- **Frontmatter-driven styling**: Define colors and icons directly in your note's frontmatter
- **Multiple UI locations**: Styles are applied to:
  - File Explorer
  - Tab Headers
  - Quick Switcher (Ctrl/Cmd+O)
  - Link Suggester (when typing `[[`)
  - Backlinks Pane
  - Bases (database views)
  - Editor internal links
- **Configurable**: Choose which frontmatter fields to use and which UI locations to style
- **Performance optimized**: Caches frontmatter lookups for efficiency

## Usage

Add `color` and/or `icon` properties to your note's frontmatter:

```yaml
---
color: "#0ea5e9"
icon: lucide-list-todo
---
```

The plugin will automatically apply these styles wherever the file appears in Obsidian.

### Color Format

Colors can be specified in any valid CSS color format:

- Hex: `"#0ea5e9"`, `"#f00"`
- RGB: `"rgb(14, 165, 233)"`
- Named colors: `"blue"`, `"coral"`

### Icon Format

**Lucide Icons** (built-in):

- With prefix: `lucide-list-todo`
- Without prefix: `list-todo` (prefix added automatically)
- Browse at [lucide.dev](https://lucide.dev)

**Phosphor Icons** (requires [Notebook Navigator](https://github.com/drbap/notebook-navigator-obsidian)):

- Format: `phosphor:icon-name` (e.g., `phosphor:bridge`)
- Browse at [phosphoricons.com](https://phosphoricons.com)

**Simple Icons** (requires Notebook Navigator):

- Format: `simple-icons:icon-name` (e.g., `simple-icons:github`)
- Browse at [simpleicons.org](https://simpleicons.org)

## Installation

### From Obsidian Community Plugins

> **Note**: This plugin is pending approval for the Obsidian Community Plugins directory. Once approved, you'll be able to install it directly from Obsidian.

1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "Frontmatter Decorator"
4. Click Install, then Enable

### Using BRAT (Recommended for now)

[BRAT](https://github.com/TfTHacker/obsidian42-brat) allows you to install plugins directly from GitHub before they're available in the Community Plugins directory.

1. Install the BRAT plugin from Community Plugins
2. Open BRAT settings
3. Click "Add Beta Plugin"
4. Enter the repository URL: `cam-barts/obsidian-frontmatter-decorator`
5. Click "Add Plugin"
6. Enable "Frontmatter Decorator" in Community Plugins

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/cam-barts/obsidian-frontmatter-decorator/releases)
2. Create a folder called `frontmatter-decorator` in your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into this folder
4. Restart Obsidian and enable the plugin in Settings > Community Plugins

### Development Installation

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed setup instructions.

Quick start:

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start compilation in watch mode
4. Symlink the plugin folder to your vault's `.obsidian/plugins/frontmatter-decorator` directory

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Color field | Frontmatter field name for colors | `color` |
| Icon field | Frontmatter field name for icons | `icon` |
| File Explorer | Enable styling in File Explorer | On |
| Tab Headers | Enable styling in tab headers | On |
| Quick Switcher | Enable styling in Quick Switcher | On |
| Link Suggester | Enable styling in link suggester | On |
| Backlinks Pane | Enable styling in Backlinks pane | On |
| Bases | Enable styling in Bases views | On |
| Editor Links | Enable styling for internal links | On |

## Commands

- **Refresh frontmatter styles**: Manually refresh all styles (useful if styles aren't updating)

## Compatibility

- Requires Obsidian v1.4.0 or higher
- Works on desktop (Windows, macOS, Linux)
- Mobile support (iOS, Android) is not yet tested

## Comparison with Supercharged Links

This plugin provides similar functionality to Supercharged Links but with a different approach:

| Feature | Frontmatter Decorator | Supercharged Links |
|---------|---------------------------|-------------------|
| Color source | Frontmatter `color` field | Plugin settings |
| Icon source | Frontmatter `icon` field | Plugin settings |
| Configuration | Per-note | Global selectors |
| CSS generation | None (inline styles) | Auto-generated CSS |
| Style Settings integration | No | Yes |

## License

MIT

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Development setup
- Commit message conventions
- Pre-commit hooks
- Pull request process

## Support

If you find this plugin useful, consider supporting development:

- Star the repository on GitHub
- Report bugs and suggest features
- Contribute code or documentation
