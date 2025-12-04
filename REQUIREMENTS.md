# Obsidian Frontmatter Decorator Plugin - Requirements Specification

## Document Information

- **Version:** 1.0
- **Date:** 2025-12-03
- **Format:** EARS (Easy Approach to Requirements Syntax)

## 1. Purpose

This plugin shall read `color` and `icon` frontmatter properties from Obsidian notes and apply visual styling to file references throughout the Obsidian interface, replacing the functionality provided by the Supercharged Links plugin with a simpler, frontmatter-driven approach.

## 2. Scope

### 2.1 In Scope

- Reading frontmatter properties from markdown files
- Applying colors and icons to file references in multiple UI locations
- Supporting multiple icon provider formats

### 2.2 Out of Scope

- Tag-based styling (only frontmatter properties)
- Inline field parsing (Dataview-style `field:: value`)
- Style Settings plugin integration for color customization
- Auto-generated CSS snippets

## 3. Functional Requirements

### 3.1 Frontmatter Property Reading

| ID | Requirement |
|----|-------------|
| FR-3.1.1 | The plugin shall read the `color` property from note frontmatter. |
| FR-3.1.2 | The plugin shall read the `icon` property from note frontmatter. |
| FR-3.1.3 | The plugin shall accept `color` values in hexadecimal format (e.g., `"#0ea5e9"`). |
| FR-3.1.4 | The plugin shall use the Obsidian MetadataCache API to access frontmatter properties. |
| FR-3.1.5 | When a note's frontmatter is modified, the plugin shall update the styling within a reasonable time (< 1 second). |

### 3.2 File Explorer Styling

| ID | Requirement |
|----|-------------|
| FR-3.2.1 | The plugin shall apply the `color` property value as the text color of the file name in the File Explorer. |
| FR-3.2.2 | The plugin shall display the `icon` property value as an icon preceding the file name in the File Explorer. |
| FR-3.2.3 | When a file has no `color` property, the plugin shall not modify the file's default appearance in the File Explorer. |
| FR-3.2.4 | When a file has no `icon` property, the plugin shall not add an icon to the file in the File Explorer. |

### 3.3 Tab Header Styling

| ID | Requirement |
|----|-------------|
| FR-3.3.1 | The plugin shall apply the `color` property value as the text color of the tab header for open notes. |
| FR-3.3.2 | The plugin shall display the `icon` property value as the tab icon for open notes. |
| FR-3.3.3 | When a note with styling is closed, the plugin shall remove the styling from the tab area. |

### 3.4 Quick Switcher Styling

| ID | Requirement |
|----|-------------|
| FR-3.4.1 | The plugin shall apply the `color` property value to file names displayed in the Quick Switcher (Ctrl/Cmd+O). |
| FR-3.4.2 | The plugin shall display the `icon` property as an icon in Quick Switcher results. |

### 3.5 Link Suggester/Autocompleter Styling

| ID | Requirement |
|----|-------------|
| FR-3.5.1 | When typing `[[` to create a link, the plugin shall apply the `color` property to matching file suggestions. |
| FR-3.5.2 | When typing `[[` to create a link, the plugin shall display the `icon` property in matching file suggestions. |

### 3.6 Backlinks Pane Styling

| ID | Requirement |
|----|-------------|
| FR-3.6.1 | The plugin shall apply the `color` property to file names displayed in the Backlinks pane. |
| FR-3.6.2 | The plugin shall display the `icon` property for files listed in the Backlinks pane. |

### 3.7 Editor/Internal Links Styling

| ID | Requirement |
|----|-------------|
| FR-3.7.1 | The plugin shall apply the `color` property to resolved internal links (`[[Note Name]]`) in the editor. |
| FR-3.7.2 | The plugin shall apply the `color` property to resolved internal links in Reading View. |

### 3.8 Bases Integration

| ID | Requirement |
|----|-------------|
| FR-3.8.1 | Where Obsidian Bases displays file references, the plugin shall apply the `color` property to those references. |
| FR-3.8.2 | Where Obsidian Bases displays file references, the plugin shall display the `icon` property for those references. |

### 3.9 Icon Format Support

| ID | Requirement |
|----|-------------|
| FR-3.9.1 | The plugin shall support Lucide icons using the format `lucide-{icon-name}` (e.g., `lucide-list-todo`). |
| FR-3.9.2 | The plugin shall support Obsidian's built-in `setIcon()` API for rendering Lucide icons. |
| FR-3.9.3 | The plugin should support Phosphor icons using the format `phosphor:{icon-name}` (e.g., `phosphor:bridge`). The `ph-` prefix is automatically stripped if present for backwards compatibility. |
| FR-3.9.4 | The plugin should support Simple Icons using the format `simple-icons:{icon-id}`. |
| FR-3.9.5 | When an icon format is unrecognized, the plugin shall not display an icon (fail silently). |

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement |
|----|-------------|
| NFR-4.1.1 | The plugin shall not noticeably degrade Obsidian startup time for vaults with fewer than 10,000 notes. |
| NFR-4.1.2 | The plugin shall use efficient DOM observation techniques to minimize CPU usage. |
| NFR-4.1.3 | The plugin shall cache frontmatter lookups to avoid repeated MetadataCache queries for the same file. |

### 4.2 Compatibility

| ID | Requirement |
|----|-------------|
| NFR-4.2.1 | The plugin shall support Obsidian version 1.4.0 or higher. |
| NFR-4.2.2 | The plugin shall function on desktop platforms (Windows, macOS, Linux). |
| NFR-4.2.3 | The plugin shall function on mobile platforms (iOS, Android). |
| NFR-4.2.4 | The plugin shall be compatible with popular themes (Minimal, Prism, etc.). |

### 4.3 Maintainability

| ID | Requirement |
|----|-------------|
| NFR-4.3.1 | The plugin shall be written in TypeScript following Obsidian plugin development best practices. |
| NFR-4.3.2 | The plugin shall use the official Obsidian sample plugin as a structural template. |
| NFR-4.3.3 | The plugin shall be distributable via the Obsidian Community Plugins directory. |

### 4.4 Configurability

| ID | Requirement |
|----|-------------|
| NFR-4.4.1 | The plugin should allow users to configure which frontmatter field names to use for color and icon (defaulting to `color` and `icon`). |
| NFR-4.4.2 | The plugin should allow users to enable/disable styling for individual UI locations (File Explorer, Tab Headers, Quick Switcher, Link Suggester, Backlinks, Bases, Editor Links). |

## 5. Constraints

| ID | Constraint |
|----|------------|
| C-5.1 | CSS cannot dynamically read attribute values as color properties; the plugin must apply colors via inline styles or inject CSS rules. |
| C-5.2 | The File Explorer uses virtual scrolling; DOM modifications must account for elements being created/destroyed during scrolling. |
| C-5.3 | External icon providers (Phosphor, Simple Icons) may require additional integration or dependencies. |

## 6. Assumptions

| ID | Assumption |
|----|------------|
| A-6.1 | Users will define `color` values as valid CSS color strings (hex, rgb, named colors). |
| A-6.2 | Users will define `icon` values following established naming conventions from supported icon libraries. |
| A-6.3 | The Obsidian API for MetadataCache will remain stable across minor version updates. |

## 7. Dependencies

| ID | Dependency |
|----|------------|
| D-7.1 | Obsidian Plugin API (`obsidian` module) |
| D-7.2 | Obsidian MetadataCache for frontmatter access |
| D-7.3 | Obsidian `setIcon()` utility for Lucide icon rendering |
| D-7.4 | **Notebook Navigator plugin** (optional) - Required for Phosphor and Simple Icons support. When installed, this plugin uses Notebook Navigator's `externalIconController.iconService` to render icons from these providers. Without Notebook Navigator, only Lucide icons are supported. |

## 8. Acceptance Criteria

| ID | Criteria |
|----|----------|
| AC-8.1 | A note with `color: "#0ea5e9"` in frontmatter displays with blue text in the File Explorer. |
| AC-8.2 | A note with `icon: lucide-list-todo` displays with a todo list icon in the File Explorer. |
| AC-8.3 | Opening a note with color/icon frontmatter shows the styling in the tab header. |
| AC-8.4 | Typing `[[` and searching for a styled note shows the color and icon in suggestions. |
| AC-8.5 | Modifying a note's `color` frontmatter updates the display without requiring Obsidian restart. |
| AC-8.6 | The plugin can be installed from the Obsidian Community Plugins browser. |

## 9. Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2025-12-03 | Initial requirements specification |
