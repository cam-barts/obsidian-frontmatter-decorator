import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	setIcon,
} from "obsidian";

// ============================================================================
// Settings
// ============================================================================

interface FrontmatterDecoratorSettings {
	colorField: string;
	iconField: string;
	enableFileExplorer: boolean;
	enableTabHeader: boolean;
	enableQuickSwitcher: boolean;
	enableSuggester: boolean;
	enableBacklinks: boolean;
	enableBases: boolean;
	enableEditorLinks: boolean;
}

const DEFAULT_SETTINGS: FrontmatterDecoratorSettings = {
	colorField: "color",
	iconField: "icon",
	enableFileExplorer: true,
	enableTabHeader: true,
	enableQuickSwitcher: true,
	enableSuggester: true,
	enableBacklinks: true,
	enableBases: true,
	enableEditorLinks: true,
};

// ============================================================================
// File Metadata Cache
// ============================================================================

interface FileStyle {
	color: string | null;
	icon: string | null;
}

/**
 * Cache for file styles to avoid repeated MetadataCache lookups
 */
class FileStyleCache {
	private cache: Map<string, FileStyle> = new Map();
	private plugin: FrontmatterDecoratorPlugin;

	constructor(plugin: FrontmatterDecoratorPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Get the style for a file path, using cache if available
	 */
	getStyle(filePath: string): FileStyle {
		if (this.cache.has(filePath)) {
			return this.cache.get(filePath)!;
		}

		const style = this.computeStyle(filePath);
		this.cache.set(filePath, style);
		return style;
	}

	/**
	 * Compute the style for a file by reading its frontmatter
	 */
	private computeStyle(filePath: string): FileStyle {
		const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
		if (!(file instanceof TFile) || file.extension !== "md") {
			return { color: null, icon: null };
		}

		const cache = this.plugin.app.metadataCache.getFileCache(file);
		const frontmatter = cache?.frontmatter;

		if (!frontmatter) {
			return { color: null, icon: null };
		}

		const colorField = this.plugin.settings.colorField;
		const iconField = this.plugin.settings.iconField;

		return {
			color: frontmatter[colorField] ?? null,
			icon: frontmatter[iconField] ?? null,
		};
	}

	/**
	 * Invalidate a specific file's cache entry
	 */
	invalidate(filePath: string): void {
		this.cache.delete(filePath);
	}

	/**
	 * Clear the entire cache
	 */
	clear(): void {
		this.cache.clear();
	}
}

// ============================================================================
// Style Applicator
// ============================================================================

/**
 * Handles applying and removing styles from DOM elements
 */
class StyleApplicator {
	private plugin: FrontmatterDecoratorPlugin;
	private styledElements: WeakSet<HTMLElement> = new WeakSet();
	private notebookNavigator: any = null;
	private nnChecked = false;

	constructor(plugin: FrontmatterDecoratorPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Get Notebook Navigator plugin instance
	 */
	private getNotebookNavigator(): any {
		if (this.nnChecked) {
			return this.notebookNavigator;
		}

		this.nnChecked = true;
		// Access plugins via type assertion (not in official typings)
		const plugins = (this.plugin.app as any).plugins?.plugins;
		const nn = plugins?.["notebook-navigator"];
		if (nn) {
			this.notebookNavigator = nn;
			console.log("Frontmatter Decorator: Found Notebook Navigator, using its icon provider");
		}
		return this.notebookNavigator;
	}

	/**
	 * Apply color and icon to an element based on file path
	 */
	applyStyle(element: HTMLElement, filePath: string): void {
		const style = this.plugin.styleCache.getStyle(filePath);

		// Apply color
		if (style.color) {
			element.style.color = style.color;
			element.dataset.frontmatterColor = style.color;
		}

		// Apply icon
		if (style.icon) {
			this.applyIcon(element, style.icon);
		}

		if (style.color || style.icon) {
			this.styledElements.add(element);
		}
	}

	/**
	 * Remove applied styles from an element
	 */
	removeStyle(element: HTMLElement): void {
		element.style.color = "";
		delete element.dataset.frontmatterColor;

		// Remove icon container if we added one
		const iconContainer = element.querySelector(".frontmatter-icon");
		if (iconContainer) {
			iconContainer.remove();
		}

		this.styledElements.delete(element);
	}

	/**
	 * Apply an icon to an element
	 */
	private applyIcon(element: HTMLElement, iconId: string): void {
		// Check if icon container already exists
		let iconContainer = element.querySelector(
			".frontmatter-icon"
		) as HTMLElement | null;

		if (!iconContainer) {
			iconContainer = document.createElement("span");
			iconContainer.classList.add("frontmatter-icon");
			element.insertBefore(iconContainer, element.firstChild);
		}

		// Clear existing icon
		iconContainer.empty();

		// Try to use Notebook Navigator's icon provider first
		const nn = this.getNotebookNavigator();
		if (nn) {
			const success = this.applyIconWithNotebookNavigator(iconContainer, iconId, nn);
			if (success) {
				return;
			}
		}

		// Fallback to native Obsidian setIcon for Lucide icons
		const normalizedIcon = this.normalizeLucideIcon(iconId);
		if (normalizedIcon) {
			setIcon(iconContainer, normalizedIcon);
		}
	}

	/**
	 * Try to apply icon using Notebook Navigator's icon provider
	 */
	private applyIconWithNotebookNavigator(container: HTMLElement, iconId: string, nn: any): boolean {
		try {
			// Normalize the icon ID for Notebook Navigator
			const normalizedIconId = this.normalizeIconIdForNN(iconId);

			// Use externalIconController.iconService.renderIcon (the correct method)
			if (nn.externalIconController?.iconService) {
				const iconService = nn.externalIconController.iconService;

				if (typeof iconService.renderIcon === "function") {
					iconService.renderIcon(container, normalizedIconId);
					if (container.childNodes.length > 0) {
						return true;
					}
				}
			}

			return false;
		} catch (error) {
			console.warn("Frontmatter Decorator: Could not use Notebook Navigator icon provider", error);
			return false;
		}
	}

	/**
	 * Normalize icon ID for Notebook Navigator's icon service
	 * Handles stripping redundant prefixes like 'ph-' from Phosphor icons
	 */
	private normalizeIconIdForNN(iconId: string): string {
		if (!iconId) return iconId;

		// Phosphor icons: strip 'ph-' prefix if present
		// e.g., 'phosphor:ph-bridge' -> 'phosphor:bridge'
		if (iconId.startsWith("phosphor:ph-")) {
			return "phosphor:" + iconId.slice(12);
		}

		// Simple Icons: strip 'si-' prefix if present
		// e.g., 'simple-icons:si-github' -> 'simple-icons:github'
		if (iconId.startsWith("simple-icons:si-")) {
			return "simple-icons:" + iconId.slice(16);
		}

		return iconId;
	}

	/**
	 * Normalize Lucide icon ID to Obsidian's expected format
	 */
	private normalizeLucideIcon(iconId: string): string | null {
		if (!iconId) return null;

		// Already in lucide format (lucide-xxx)
		if (iconId.startsWith("lucide-")) {
			return iconId;
		}

		// Skip external icon formats - these need Notebook Navigator
		if (iconId.includes(":")) {
			return null;
		}

		// Assume it's a Lucide icon without prefix - add the prefix
		return `lucide-${iconId}`;
	}
}

// ============================================================================
// DOM Observers
// ============================================================================

/**
 * Base class for DOM observers
 */
abstract class DOMObserver {
	protected plugin: FrontmatterDecoratorPlugin;
	protected observer: MutationObserver | null = null;

	constructor(plugin: FrontmatterDecoratorPlugin) {
		this.plugin = plugin;
	}

	abstract start(): void;
	abstract stop(): void;
	abstract refresh(): void;
}

/**
 * Observer for the File Explorer
 */
class FileExplorerObserver extends DOMObserver {
	start(): void {
		// Initial styling
		this.refresh();

		// Watch for DOM changes (virtual scrolling creates/destroys elements)
		this.observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === "childList") {
					mutation.addedNodes.forEach((node) => {
						if (node instanceof HTMLElement) {
							this.styleFileExplorerItem(node);
						}
					});
				}
			}
		});

		// Find the file explorer container
		const fileExplorer = document.querySelector(".nav-files-container");
		if (fileExplorer) {
			this.observer.observe(fileExplorer, {
				childList: true,
				subtree: true,
			});
		}
	}

	stop(): void {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
	}

	refresh(): void {
		// Find all file items in the explorer
		const fileItems = document.querySelectorAll(
			".nav-file-title, .tree-item-self"
		);
		fileItems.forEach((item) => {
			if (item instanceof HTMLElement) {
				this.styleFileExplorerItem(item);
			}
		});
	}

	private styleFileExplorerItem(element: HTMLElement): void {
		// Check if this is a file item or contains file items
		if (
			element.classList.contains("nav-file-title") ||
			element.classList.contains("tree-item-self")
		) {
			const filePath = element.dataset.path;
			if (filePath && filePath.endsWith(".md")) {
				// Find the text element to style
				const textEl =
					element.querySelector(".nav-file-title-content") ||
					element.querySelector(".tree-item-inner") ||
					element;
				if (textEl instanceof HTMLElement) {
					this.plugin.styleApplicator.applyStyle(textEl, filePath);
				}
			}
		}

		// Also check child elements
		const childFileItems = element.querySelectorAll(
			".nav-file-title, .tree-item-self"
		);
		childFileItems.forEach((child) => {
			if (child instanceof HTMLElement) {
				const filePath = child.dataset.path;
				if (filePath && filePath.endsWith(".md")) {
					const textEl =
						child.querySelector(".nav-file-title-content") ||
						child.querySelector(".tree-item-inner") ||
						child;
					if (textEl instanceof HTMLElement) {
						this.plugin.styleApplicator.applyStyle(textEl, filePath);
					}
				}
			}
		});
	}
}

/**
 * Observer for tab headers
 */
class TabHeaderObserver extends DOMObserver {
	private isRefreshing = false;

	start(): void {
		this.refresh();

		// Watch for tab changes
		this.plugin.registerEvent(
			this.plugin.app.workspace.on("layout-change", () => {
				this.refresh();
			})
		);

		this.plugin.registerEvent(
			this.plugin.app.workspace.on("active-leaf-change", () => {
				// Small delay to let Obsidian finish updating the tab
				setTimeout(() => this.refresh(), 50);
			})
		);

		// Watch for file opens (new tabs)
		this.plugin.registerEvent(
			this.plugin.app.workspace.on("file-open", () => {
				// Delay to let tab render
				setTimeout(() => this.refresh(), 100);
			})
		);

		// Also observe DOM changes for tabs (but guard against our own changes)
		this.observer = new MutationObserver(() => {
			if (!this.isRefreshing) {
				this.refresh();
			}
		});

		const tabContainers = document.querySelectorAll(".workspace-tab-header-container");
		tabContainers.forEach((container) => {
			this.observer?.observe(container, {
				childList: true,
				subtree: true,
			});
		});
	}

	stop(): void {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
	}

	refresh(): void {
		// Guard against recursive calls
		if (this.isRefreshing) return;
		this.isRefreshing = true;

		try {
			// Style only markdown note tabs (not sidebar tabs like Files, Search)
			const tabHeaders = document.querySelectorAll('.workspace-tab-header[data-type="markdown"]');
			tabHeaders.forEach((tab) => {
				if (tab instanceof HTMLElement) {
					this.styleTabHeader(tab);
				}
			});
		} finally {
			this.isRefreshing = false;
		}
	}

	private styleTabHeader(tabElement: HTMLElement): void {
		// Get the file name from aria-label attribute
		const ariaLabel = tabElement.getAttribute("aria-label");
		if (!ariaLabel) return;

		const titleEl = tabElement.querySelector(".workspace-tab-header-inner-title");
		if (!(titleEl instanceof HTMLElement)) return;

		// Find the file by basename
		const files = this.plugin.app.vault.getMarkdownFiles();
		const file = files.find((f) => f.basename === ariaLabel);

		if (!file) return;

		// Get the expected style for this file
		const style = this.plugin.styleCache.getStyle(file.path);

		// Check if icon container exists (might have been removed by Obsidian)
		const hasIconContainer = titleEl.querySelector(".frontmatter-icon") !== null;
		const needsIcon = style.icon !== null;

		// Skip only if fully styled (data attribute matches AND icon state is correct)
		if (titleEl.dataset.frontmatterStyledFor === ariaLabel) {
			// If we need an icon but don't have one, re-apply
			if (needsIcon && !hasIconContainer) {
				// Icon was removed, need to re-apply
			} else {
				return;
			}
		}

		titleEl.dataset.frontmatterStyledFor = ariaLabel;
		this.plugin.styleApplicator.applyStyle(titleEl, file.path);
	}
}

/**
 * Observer for the Quick Switcher and Suggester
 */
class SuggesterObserver extends DOMObserver {
	start(): void {
		// Watch for suggestion popups
		this.observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === "childList") {
					mutation.addedNodes.forEach((node) => {
						if (node instanceof HTMLElement) {
							this.checkForSuggestions(node);
						}
					});
				}
			}
		});

		this.observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}

	stop(): void {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
	}

	refresh(): void {
		// Check for any existing suggestion containers
		const suggestionContainers = document.querySelectorAll(
			".suggestion-container, .prompt-results, .prompt"
		);
		suggestionContainers.forEach((container) => {
			if (container instanceof HTMLElement) {
				this.styleSuggestions(container);
			}
		});
	}

	private checkForSuggestions(element: HTMLElement): void {
		// Check if this is a suggestion container or prompt
		if (
			element.classList.contains("suggestion-container") ||
			element.classList.contains("prompt-results") ||
			element.classList.contains("prompt") ||
			element.classList.contains("suggestion") ||
			element.classList.contains("suggestion-item")
		) {
			this.styleSuggestions(element);
		}

		// Check for suggestion containers within the element
		const containers = element.querySelectorAll(
			".suggestion-container, .prompt-results, .prompt"
		);
		containers.forEach((container) => {
			if (container instanceof HTMLElement) {
				this.styleSuggestions(container);
			}
		});

		// Also check for individual suggestion items
		const suggestions = element.querySelectorAll(".suggestion-item");
		suggestions.forEach((suggestion) => {
			if (suggestion instanceof HTMLElement) {
				this.styleSuggestionItem(suggestion);
			}
		});
	}

	private styleSuggestions(container: HTMLElement): void {
		const suggestions = container.querySelectorAll(".suggestion-item");
		suggestions.forEach((suggestion) => {
			if (suggestion instanceof HTMLElement) {
				this.styleSuggestionItem(suggestion);
			}
		});
	}

	private styleSuggestionItem(suggestion: HTMLElement): void {
		// Skip if already styled
		if (suggestion.dataset.frontmatterStyled === "true") {
			return;
		}

		// Find the title element - this is where we'll apply styles
		const titleEl = suggestion.querySelector(".suggestion-title") as HTMLElement | null;
		if (!titleEl) return;

		let filePath: string | null = null;

		// Try data-path attribute first (most reliable if present)
		if (suggestion.dataset.path) {
			filePath = suggestion.dataset.path;
		}
		// Built-in Quick Switcher: .suggestion-title contains the path directly
		// e.g., "_/Task List" or "Projects/Other/Books To Read"
		else if (titleEl.textContent) {
			const titleText = titleEl.textContent.trim();

			// The title often IS the path (without .md extension)
			let possiblePath = titleText;
			if (!possiblePath.endsWith(".md")) {
				possiblePath = possiblePath + ".md";
			}

			// Verify this file exists
			const file = this.plugin.app.vault.getAbstractFileByPath(possiblePath);
			if (file instanceof TFile) {
				filePath = file.path;
			} else {
				// Try to find by basename if full path didn't work
				const files = this.plugin.app.vault.getMarkdownFiles();
				const matchingFile = files.find(
					(f) => f.basename === titleText || f.path === possiblePath
				);
				if (matchingFile) {
					filePath = matchingFile.path;
				}
			}
		}

		if (filePath) {
			// Mark as styled to avoid duplicate processing
			suggestion.dataset.frontmatterStyled = "true";

			// Apply full styling (color + icon) to the title element
			this.plugin.styleApplicator.applyStyle(titleEl, filePath);
		}
	}
}

/**
 * Observer for the Backlinks pane
 */
class BacklinksObserver extends DOMObserver {
	start(): void {
		this.refresh();

		// Watch for layout changes (backlinks pane might be opened)
		this.plugin.registerEvent(
			this.plugin.app.workspace.on("layout-change", () => {
				this.refresh();
			})
		);

		// Watch for backlinks pane changes
		this.observer = new MutationObserver(() => {
			this.refresh();
		});

		// Try to observe any backlink panes
		this.observeBacklinkPanes();
	}

	private observeBacklinkPanes(): void {
		// Backlinks can appear in multiple locations
		const backlinkPanes = document.querySelectorAll(
			".backlink-pane, [data-type='backlink'], .workspace-leaf-content[data-type='backlink']"
		);
		backlinkPanes.forEach((pane) => {
			this.observer?.observe(pane, {
				childList: true,
				subtree: true,
			});
		});
	}

	stop(): void {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
	}

	refresh(): void {
		// Re-observe in case new panes appeared
		if (this.observer) {
			this.observer.disconnect();
			this.observeBacklinkPanes();
		}

		// Find backlink items - try multiple selectors
		const backlinkItems = document.querySelectorAll(
			".backlink-pane .tree-item-self, " +
			".backlink-pane .search-result-file-title, " +
			"[data-type='backlink'] .tree-item-self, " +
			"[data-type='backlink'] .search-result-file-title, " +
			".backlink-pane .tree-item-inner"
		);

		backlinkItems.forEach((item) => {
			if (item instanceof HTMLElement) {
				this.styleBacklinkItem(item);
			}
		});
	}

	private styleBacklinkItem(element: HTMLElement): void {
		// Skip if already styled
		if (element.dataset.frontmatterStyled === "true") {
			return;
		}

		let filePath: string | null = null;

		// Try data-path attribute
		if (element.dataset.path) {
			filePath = element.dataset.path;
		}
		// Try to get from parent element
		else {
			const parent = element.closest("[data-path]");
			if (parent instanceof HTMLElement && parent.dataset.path) {
				filePath = parent.dataset.path;
			}
		}
		// Try to get from text content
		if (!filePath) {
			const text = element.textContent?.trim();
			if (text) {
				filePath = this.resolveFilePath(text);
			}
		}

		if (filePath) {
			element.dataset.frontmatterStyled = "true";
			this.plugin.styleApplicator.applyStyle(element, filePath);
		}
	}

	private resolveFilePath(text: string): string | null {
		// Try to find by path or basename
		if (!text.endsWith(".md")) {
			text = text + ".md";
		}

		const file = this.plugin.app.vault.getAbstractFileByPath(text);
		if (file instanceof TFile) {
			return file.path;
		}

		// Try to find by basename
		const files = this.plugin.app.vault.getMarkdownFiles();
		const basename = text.replace(/\.md$/, "");
		const matchingFile = files.find((f) => f.basename === basename);
		if (matchingFile) {
			return matchingFile.path;
		}

		return null;
	}
}

/**
 * Observer for Obsidian Bases (database views)
 */
class BasesObserver extends DOMObserver {
	start(): void {
		this.refresh();

		// Watch for Bases view changes
		this.plugin.registerEvent(
			this.plugin.app.workspace.on("layout-change", () => {
				this.refresh();
			})
		);

		this.plugin.registerEvent(
			this.plugin.app.workspace.on("active-leaf-change", () => {
				setTimeout(() => this.refresh(), 100);
			})
		);

		// Observe DOM changes in workspace for Bases views
		this.observer = new MutationObserver(() => {
			this.refresh();
		});

		// Bases views can appear in any leaf
		const workspace = document.querySelector(".workspace");
		if (workspace) {
			this.observer.observe(workspace, {
				childList: true,
				subtree: true,
			});
		}
	}

	stop(): void {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
	}

	refresh(): void {
		// Bases uses various elements for file references
		// Look for file links within Bases views
		const basesViews = document.querySelectorAll('[data-type="bases"], .bases-view');

		basesViews.forEach((view) => {
			if (view instanceof HTMLElement) {
				this.styleBasesView(view);
			}
		});

		// Also check for Bases table cells with file references
		const basesFileLinks = document.querySelectorAll(
			".bases-cell-file, .bases-file-link, .bases-row .internal-link"
		);
		basesFileLinks.forEach((link) => {
			if (link instanceof HTMLElement) {
				this.styleBasesLink(link);
			}
		});
	}

	private styleBasesView(view: HTMLElement): void {
		// Find all file references within the Bases view
		const fileLinks = view.querySelectorAll(
			".internal-link, [data-path], .tree-item-self"
		);
		fileLinks.forEach((link) => {
			if (link instanceof HTMLElement) {
				this.styleBasesLink(link);
			}
		});
	}

	private styleBasesLink(element: HTMLElement): void {
		// Skip if already styled
		if (element.dataset.frontmatterStyled === "true") {
			return;
		}

		let filePath: string | null = null;

		// Try data-path attribute
		if (element.dataset.path) {
			filePath = element.dataset.path;
		}
		// Try href attribute
		else if (element.getAttribute("href")) {
			const href = element.getAttribute("href");
			if (href) {
				filePath = this.resolveFilePath(href);
			}
		}
		// Try text content as file name
		else if (element.textContent) {
			const text = element.textContent.trim();
			filePath = this.resolveFilePath(text);
		}

		if (filePath) {
			element.dataset.frontmatterStyled = "true";
			this.plugin.styleApplicator.applyStyle(element, filePath);
		}
	}

	private resolveFilePath(linkText: string): string | null {
		// Clean up the link text
		let cleaned = linkText.replace(/^\[\[|\]\]$/g, "");
		cleaned = cleaned.split("|")[0]; // Remove alias
		cleaned = cleaned.split("#")[0]; // Remove heading anchor

		// Try to find the file
		if (!cleaned.endsWith(".md")) {
			cleaned = cleaned + ".md";
		}

		const file = this.plugin.app.vault.getAbstractFileByPath(cleaned);
		if (file instanceof TFile) {
			return file.path;
		}

		// Try metadataCache lookup
		const resolved = this.plugin.app.metadataCache.getFirstLinkpathDest(
			linkText.replace(/^\[\[|\]\]$/g, "").split("|")[0].split("#")[0],
			""
		);
		if (resolved instanceof TFile) {
			return resolved.path;
		}

		return null;
	}
}

/**
 * Observer for editor internal links
 */
class EditorLinksObserver extends DOMObserver {
	start(): void {
		this.refresh();

		// Refresh on active leaf change
		this.plugin.registerEvent(
			this.plugin.app.workspace.on("active-leaf-change", () => {
				// Small delay to let the editor render
				setTimeout(() => this.refresh(), 100);
			})
		);

		// Watch for editor content changes
		this.observer = new MutationObserver(() => {
			this.refresh();
		});

		const workspaceLeaves = document.querySelector(".workspace-leaf-content");
		if (workspaceLeaves) {
			this.observer.observe(workspaceLeaves, {
				childList: true,
				subtree: true,
			});
		}
	}

	stop(): void {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
	}

	refresh(): void {
		// Find all internal links in the editor
		const internalLinks = document.querySelectorAll(
			".cm-hmd-internal-link, .internal-link"
		);
		internalLinks.forEach((link) => {
			if (link instanceof HTMLElement) {
				this.styleInternalLink(link);
			}
		});
	}

	private styleInternalLink(linkElement: HTMLElement): void {
		// Extract the link target
		let linkTarget =
			linkElement.dataset.href ||
			linkElement.getAttribute("href") ||
			linkElement.textContent;

		if (!linkTarget) return;

		// Clean up the link target
		linkTarget = linkTarget.replace(/^\[\[|\]\]$/g, ""); // Remove [[ and ]]
		linkTarget = linkTarget.split("|")[0]; // Remove alias
		linkTarget = linkTarget.split("#")[0]; // Remove heading anchor

		// Find the file
		const file = this.plugin.app.metadataCache.getFirstLinkpathDest(
			linkTarget,
			""
		);
		if (file instanceof TFile) {
			const style = this.plugin.styleCache.getStyle(file.path);
			if (style.color) {
				linkElement.style.color = style.color;
			}
		}
	}
}

// ============================================================================
// Main Plugin
// ============================================================================

export default class FrontmatterDecoratorPlugin extends Plugin {
	settings: FrontmatterDecoratorSettings;
	styleCache: FileStyleCache;
	styleApplicator: StyleApplicator;

	private observers: DOMObserver[] = [];

	async onload(): Promise<void> {
		await this.loadSettings();

		// Initialize components
		this.styleCache = new FileStyleCache(this);
		this.styleApplicator = new StyleApplicator(this);

		// Initialize observers based on settings
		this.initializeObservers();

		// Register metadata change handler
		this.registerEvent(
			this.app.metadataCache.on("changed", (file) => {
				if (file instanceof TFile) {
					this.styleCache.invalidate(file.path);
					this.refreshAllObservers();
				}
			})
		);

		// Register file rename handler
		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				if (file instanceof TFile) {
					this.styleCache.invalidate(oldPath);
					this.styleCache.invalidate(file.path);
					this.refreshAllObservers();
				}
			})
		);

		// Register file delete handler
		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (file instanceof TFile) {
					this.styleCache.invalidate(file.path);
				}
			})
		);

		// Add settings tab
		this.addSettingTab(new FrontmatterDecoratorSettingTab(this.app, this));

		// Add command to refresh styles
		this.addCommand({
			id: "refresh-frontmatter-styles",
			name: "Refresh frontmatter styles",
			callback: () => {
				this.styleCache.clear();
				this.refreshAllObservers();
			},
		});

		console.log("Frontmatter Decorator plugin loaded");
	}

	onunload(): void {
		// Stop all observers
		this.observers.forEach((observer) => observer.stop());
		this.observers = [];

		console.log("Frontmatter Decorator plugin unloaded");
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		// Reinitialize observers when settings change
		this.reinitializeObservers();
	}

	private initializeObservers(): void {
		// Wait for layout to be ready
		this.app.workspace.onLayoutReady(() => {
			// Check if metadata cache is already resolved
			if (this.app.metadataCache.resolvedLinks) {
				// Small delay to ensure DOM is fully rendered
				setTimeout(() => this.startObservers(), 500);
			} else {
				// Wait for metadata cache to be fully resolved
				const resolveRef = this.app.metadataCache.on("resolved", () => {
					this.app.metadataCache.offref(resolveRef);
					// Small delay to ensure DOM is fully rendered
					setTimeout(() => this.startObservers(), 500);
				});
			}
		});
	}

	private startObservers(): void {
		if (this.settings.enableFileExplorer) {
			const fileExplorerObserver = new FileExplorerObserver(this);
			fileExplorerObserver.start();
			this.observers.push(fileExplorerObserver);
		}

		if (this.settings.enableTabHeader) {
			const tabHeaderObserver = new TabHeaderObserver(this);
			tabHeaderObserver.start();
			this.observers.push(tabHeaderObserver);
		}

		if (this.settings.enableQuickSwitcher || this.settings.enableSuggester) {
			const suggesterObserver = new SuggesterObserver(this);
			suggesterObserver.start();
			this.observers.push(suggesterObserver);
		}

		if (this.settings.enableBacklinks) {
			const backlinksObserver = new BacklinksObserver(this);
			backlinksObserver.start();
			this.observers.push(backlinksObserver);
		}

		if (this.settings.enableBases) {
			const basesObserver = new BasesObserver(this);
			basesObserver.start();
			this.observers.push(basesObserver);
		}

		if (this.settings.enableEditorLinks) {
			const editorLinksObserver = new EditorLinksObserver(this);
			editorLinksObserver.start();
			this.observers.push(editorLinksObserver);
		}

		// Initial refresh to apply styles
		this.refreshAllObservers();
		console.log("Frontmatter Decorator: Observers started");
	}

	private reinitializeObservers(): void {
		// Stop existing observers
		this.observers.forEach((observer) => observer.stop());
		this.observers = [];

		// Clear cache
		this.styleCache.clear();

		// Start new observers
		this.initializeObservers();
	}

	private refreshAllObservers(): void {
		this.observers.forEach((observer) => observer.refresh());
	}
}

// ============================================================================
// Settings Tab
// ============================================================================

class FrontmatterDecoratorSettingTab extends PluginSettingTab {
	plugin: FrontmatterDecoratorPlugin;

	constructor(app: App, plugin: FrontmatterDecoratorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Frontmatter Decorator Settings" });

		// Frontmatter field settings
		containerEl.createEl("h3", { text: "Frontmatter Fields" });

		new Setting(containerEl)
			.setName("Color field")
			.setDesc("The frontmatter field name to use for colors")
			.addText((text) =>
				text
					.setPlaceholder("color")
					.setValue(this.plugin.settings.colorField)
					.onChange(async (value) => {
						this.plugin.settings.colorField = value || "color";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Icon field")
			.setDesc("The frontmatter field name to use for icons")
			.addText((text) =>
				text
					.setPlaceholder("icon")
					.setValue(this.plugin.settings.iconField)
					.onChange(async (value) => {
						this.plugin.settings.iconField = value || "icon";
						await this.plugin.saveSettings();
					})
			);

		// Enable/disable settings
		containerEl.createEl("h3", { text: "Enabled Locations" });

		new Setting(containerEl)
			.setName("File Explorer")
			.setDesc("Apply styles to files in the File Explorer")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableFileExplorer)
					.onChange(async (value) => {
						this.plugin.settings.enableFileExplorer = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Tab Headers")
			.setDesc("Apply styles to tab headers")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableTabHeader)
					.onChange(async (value) => {
						this.plugin.settings.enableTabHeader = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Quick Switcher")
			.setDesc("Apply styles in the Quick Switcher (Ctrl/Cmd+O)")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableQuickSwitcher)
					.onChange(async (value) => {
						this.plugin.settings.enableQuickSwitcher = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Link Suggester")
			.setDesc("Apply styles in the link suggester when typing [[")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableSuggester)
					.onChange(async (value) => {
						this.plugin.settings.enableSuggester = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Backlinks Pane")
			.setDesc("Apply styles in the Backlinks pane")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableBacklinks)
					.onChange(async (value) => {
						this.plugin.settings.enableBacklinks = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Bases")
			.setDesc("Apply styles to file references in Obsidian Bases views")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableBases)
					.onChange(async (value) => {
						this.plugin.settings.enableBases = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Editor Links")
			.setDesc("Apply styles to internal links in the editor")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableEditorLinks)
					.onChange(async (value) => {
						this.plugin.settings.enableEditorLinks = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
