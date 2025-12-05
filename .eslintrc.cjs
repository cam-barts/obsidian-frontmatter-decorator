module.exports = {
	root: true,
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint", "obsidianmd"],
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
	],
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: "module",
		project: "./tsconfig.json",
	},
	env: {
		browser: true,
		node: true,
		es2020: true,
	},
	rules: {
		"no-unused-vars": "off",
		"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
		"@typescript-eslint/no-explicit-any": ["error", { fixToUnknown: true }],
		"@typescript-eslint/no-unnecessary-type-assertion": "error",
		"@typescript-eslint/explicit-function-return-type": "off",
		"@typescript-eslint/no-non-null-assertion": "off",
	},
	ignorePatterns: ["main.js", "node_modules/", "*.mjs"],
};
