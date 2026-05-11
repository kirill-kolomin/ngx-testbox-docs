# Agent Information: ngx-testbox-docs

## Project Overview
This is the **documentation website** for ngx-testbox, built with [Docusaurus](https://docusaurus.io/) v3. It hosts the user-facing guides, API references, and tutorials.

## Workspace Layout
- **Documentation pages:** `docs/` (Markdown + MDX files; these are the primary content)
- **Docusaurus config:** `docusaurus.config.ts`
- **Sidebar config:** `sidebars.ts`
- **Static assets:** `static/`
- **Custom pages/components:** `src/`
- **Build output:** `build/`

## Technology Stack
- Docusaurus **3.8.1**
- React **19**
- TypeScript **~5.6.2**
- Node **>= 18.0**

## Key Commands
Run these from **this directory** (`ngx-testbox-docs/`):

```bash
# Install dependencies
npm install
# or
yarn

# Start local dev server (opens browser, live reload)
npm start
# or
yarn start

# Build static site (outputs to build/)
npm run build
# or
yarn build

# Type-check the TS files
npm run typecheck

# Serve the built static site locally
npm run serve
```

## Content Conventions
- Docs use **Markdown** with optional **MDX** (JSX in Markdown).
- Front matter (`---`) is required for sidebar positioning and labels:
  ```yaml
  ---
  sidebar_position: 2
  ---
  ```
- Code blocks should specify the language for syntax highlighting:
  ```markdown
  ```typescript
  const x = 1;
  ```
  ```
- Internal links should be relative to the `docs/` directory.
- Use admonitions (`:::note`, `:::tip`, `:::danger`) for callouts.

## When Modifying Documentation
1. After editing, run `npm start` and verify the page renders correctly in the browser.
2. Run `npm run build` to confirm the site builds without broken links or MDX errors.
3. If you add a new top-level doc, register it in `sidebars.ts` if it is not auto-generated.
4. If you add API documentation that references library code, ensure the code snippets are valid TypeScript — users will copy-paste them.
5. The deployed homepage URL is `https://kirill-kolomin.github.io/ngx-testbox-docs/` (configured in the library's `package.json` homepage field and Docusaurus config).

## Relationship to the Library
- The library source lives in the **parent directory** (`../projects/ngx-testbox/`). This lib is defined as a submodule of the main project.
- Do **not** import library source directly into the docs site.
- Code examples in docs should be static snippets, not live imports.
