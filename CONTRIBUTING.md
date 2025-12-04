# Contributing to Frontmatter Decorator

Thank you for your interest in contributing!

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18+)
- [uv](https://docs.astral.sh/uv/) - Fast Python package manager
- [prek](https://github.com/j178/prek) - Pre-commit hook manager
- [rumdl](https://github.com/rvben/rumdl) - Markdown linter

### Installing prerequisites

```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install prek
cargo install prek
# or download from https://github.com/j178/prek/releases

# Install rumdl
cargo install rumdl
# or: pip install rumdl
# or: brew install rumdl
```

## Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/cam-barts/obsidian-frontmatter-decorator.git
   cd obsidian-frontmatter-decorator
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   This will also set up pre-commit hooks via prek.

3. Start development build (watch mode):

   ```bash
   npm run dev
   ```

4. Symlink or copy the plugin to your Obsidian vault:

   ```bash
   ln -s /path/to/obsidian-frontmatter-decorator /path/to/vault/.obsidian/plugins/frontmatter-decorator
   ```

5. Reload Obsidian to test changes.

## Making Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/). All commit messages are validated by [Commitizen](https://commitizen-tools.github.io/commitizen/).

### Using the commit wizard

For guided commit messages, run:

```bash
npm run commit
# or directly:
uvx cz
```

### Commit message format

```text
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat` - New feature (triggers minor version bump)
- `fix` - Bug fix (triggers patch version bump)
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding/updating tests
- `build` - Build system changes
- `ci` - CI/CD changes
- `chore` - Other changes

**Breaking changes:** Add `!` after type/scope (e.g., `feat!:` or `feat(api)!:`) to trigger a major version bump.

## Pre-commit Hooks

The following checks run automatically on commit:

- **ESLint** - TypeScript/JavaScript linting
- **rumdl** - Markdown linting
- **cz check** - Commit message validation
- **trailing-whitespace** - Remove trailing whitespace
- **end-of-file-fixer** - Ensure files end with newline
- **check-yaml** - Validate YAML files
- **check-json** - Validate JSON files

To run hooks manually:

```bash
prek run --all-files
```

## Code Style

- Use TypeScript
- Follow existing code patterns
- Run `npm run lint:fix` before committing

## Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes
4. Commit using conventional commits
5. Push to your fork
6. Open a Pull Request

## Questions?

Open an issue on GitHub if you have questions or run into problems.
