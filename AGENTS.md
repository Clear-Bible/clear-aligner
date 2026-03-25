# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

ClearAligner is a cross-platform Electron desktop application for creating and editing alignments between Biblical source texts (Greek/Hebrew) and translations. Built with Electron 27, React 18, Redux Toolkit, TypeORM + Better-SQLite3, and Material-UI v5.

## Common Commands

```bash
# Development (full Electron app - yarn start will NOT work)
yarn dev-electron

# Build
yarn build:mac          # macOS
yarn build:win          # Windows (Docker)
yarn build:linux        # Linux (Docker)
yarn build:mac:fast     # macOS (skip DB recreation if exists)

# Tests
yarn test-ui            # React/UI tests (craco test, *.ui.test.tsx)
yarn test-electron      # Electron main process tests (jest, *.main.test.ts)

# Lint & format
yarn lint               # ESLint (--max-warnings 0)
yarn prettier           # Prettier

# Database recreation
sql/scripts/create-db.sh        # Rebuild template/user/default project SQLite files
sql/scripts/create-db.sh --no-remove  # Only create if missing

# Storybook
yarn storybook          # Dev server on port 6006
```

## Environment Setup

Copy `.env.template` to `.env` and fill in:
- `CA_AWS_ENDPOINT` - API endpoint
- `CA_AWS_COGNITO_USER_POOL_ID` / `CA_AWS_COGNITO_USER_POOL_CLIENT_ID` - Auth
- `CA_AWS_COGNITO_PERMANENT_PASSWORD_CREATION_URL` - Password creation URL

These are injected at build time via `.cracorc.ts` using `webpack.DefinePlugin`.

## Architecture

### Electron Process Model

- **Main process**: `src/electron/main.ts` — creates window, registers IPC handlers via `setUpIpcMain()`
- **Preload/bridge**: `src/electron/database-renderer.ts` — exposes DB API to renderer via `contextBridge.exposeInMainWorld()`
- **Renderer**: React app loaded from `localhost:3000` (dev) or `ui/index.html` (prod)
- **IPC channel prefix**: `clear-aligner` (defined in `database-shared.ts`)

All database access flows through IPC: React component → `useDatabase()` hook → `window.databaseApi.*` → `ipcRenderer.invoke()` → main process repository → TypeORM → SQLite.

### Database Layer (src/electron/repositories/)

Three SQLite database files:
1. **clear-aligner-user.sqlite** — user preferences, project metadata (`userRepository.ts`)
2. **clear-aligner-template.sqlite** — template for new projects
3. **clear-aligner-{projectId}.sqlite** — per-project data: links, corpora, words, journal entries (`projectRepository.ts`)

Migrations live in `src/electron/typeorm-migrations/{project,user}/`. `baseRepository.ts` manages DataSource instances and runs migrations on init.

### React Application

- **Entry**: `src/index.tsx` → `App.tsx` → `AppLayout.tsx`
- **Routing**: Hash-based (`createHashRouter`) with routes: `/projects`, `/alignment`, `/concordance`
- **Global state**: `AppContext` (React context) holds projectState, preferences, containers, userStatus, features
- **tsconfig baseUrl is `src`** — imports are relative to src (e.g., `import from 'features/...'`)

### Redux Store (src/app/)

```
store = {
  app:               AppReducer,
  alignment:         UndoableAlignmentReducer,  // redux-undo, 10-step limit
  textSegmentHover:  TextSegmentHoverReducer,
}
```

Slices are in `src/state/`. The alignment slice manages the in-progress link being edited and supports undo/redo.

### Key Domain Model (src/structs/index.ts)

- **BCVWP** (Book-Chapter-Verse-Word-Part): Universal reference format for text positions, parsed from strings like "40003016005" (Matthew 3:16, word 5). See `src/features/bcvwp/BCVWPSupport.ts`.
- **Word**: A token in a corpus, identified by BCVWP. Has text, gloss, lemma, normalizedText, position.
- **Corpus**: A body of text (e.g., SBLGNT, ESV). Has a `side` (sources/targets), words organized by verse and book.
- **CorpusContainer**: Groups multiple corpora for the same side. Used as `sources` and `targets` containers.
- **RepositoryLink**: An alignment link mapping source word references to target word references. Has metadata (origin, status, notes).
- **EditedLink**: Extends RepositoryLink with `suggestedSources`/`suggestedTargets` for AI-assisted alignment.
- **LinkStatus**: `created | approved | rejected | needsReview`

### Feature Components (src/features/)

Major features: `alignmentEditor` (main editing UI), `concordanceView` (word search/analysis), `projects` (project management), `bcvwp` (Bible reference parsing), `textSegment` (word selection), `linkBuilder` (link creation), `editor` (core text display).

### API Layer

- `src/api/utils.ts`: Generic request handler, supports dev mode (direct fetch) and prod (AWS Amplify)
- `src/server/amplifySetup.ts`: AWS Cognito authentication setup
- Feature-specific API modules in `src/api/{alignments,projects}/`

## Test Conventions

- **UI tests**: `*.ui.test.tsx` files, colocated with components, use Testing Library. Run via `yarn test-ui` (craco/jest).
- **Electron tests**: `*.main.test.ts` files, use `@kayahr/jest-electron-runner/main`. Run via `yarn test-electron`.
- Mock modules in `src/__tests__/mockModules/` (mockElectron, mockAmplifySetup, usehooks).

## Build Notes

- Build output: `ui/` (React), `app/` (TypeScript → JS for Electron main process)
- craco wraps CRA (`BUILD_PATH=ui craco build`)
- TypeORM decorators require `emitDecoratorMetadata` and `experimentalDecorators` (enabled in tsconfig)
- TSV corpus data files in `src/tsv/` are bundled with builds
- Database files in `sql/` are created by `sql/scripts/create-db.sh` (requires Python3)
