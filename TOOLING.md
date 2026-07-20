# Tooling inventory: Cli-Proxy-API-Management-Center

## 1. Repository identity and status

- **Repository:** Cli-Proxy-API-Management-Center
- **Status:** active frontend
- **Git root:** `.`
- **Nested applications:** none; this is the management UI.

## 2. Runtime tools

| Tool | Version | Category | Required | Source | Purpose | Installation | Verification |
|---|---|---|---|---|---|---|---|
| Node.js | unversioned | Runtime | Required | `package.json` | Run Vite and frontend tooling | Install Node.js compatible with package engines | `node --version` |
| npm | unversioned | Runtime | Required | `package.json` | Install JavaScript dependencies | Included with Node.js | `npm --version` |

## 3. Project/build tools

| Tool | Version | Category | Required | Source | Purpose | Installation | Verification |
|---|---|---|---|---|---|---|---|
| Vite | package.json | Project | Required | `package.json` | Bundle the React app | `npm ci` | `npm run build` |
| TypeScript | package.json | Project | Required | `package.json` | Type-check and compile TS/TSX | `npm ci` | `npx tsc --noEmit` |
| React | package.json | Project | Required | `package.json` | UI runtime | `npm ci` | `npm run build` |

## 4. Developer tools

| Tool | Version | Category | Required | Source | Purpose | Installation | Verification |
|---|---|---|---|---|---|---|---|
| ESLint | package.json | Dev | Required | `eslint.config.js` | Lint frontend code | `npm ci` | `npm run lint` |
| Sass | package.json | Dev | Required | `package.json` | Compile SCSS styles | `npm ci` | `npm run build` |

## 5. CI tools

| Tool | Version | Category | Required | Source | Purpose | Installation | Verification |
|---|---|---|---|---|---|---|---|
| GitHub Actions | unversioned | CI | CI-only | `.github/workflows/release.yml` | Build/release frontend | GitHub-hosted | Workflow run |
| CycloneDX npm generator | unversioned | CI | CI-only | `.github/workflows/sbom.yml` | Generate dependency SBOM | Installed by workflow | `test -s management-center-node.cdx.json` |

## 6. Operations/deployment tools

| Tool | Version | Category | Required | Source | Purpose | Installation | Verification |
|---|---|---|---|---|---|---|---|
| Static web server | unknown | Ops | Operator-only | `README.md` | Serve the built `dist/` output | Deployment-specific | Inspect deployed UI |

## 7. Native source manifests

- `package.json` declares scripts and dependencies.
- No tracked Node lockfile was found; `package.json` is the current dependency source.
- `vite.config.ts`, `tsconfig*.json`, and `eslint.config.js` configure the toolchain.

## 8. Standard commands

- `npm install --no-package-lock` — CI dependency install (source: `package.json`).
- `npm run build` — production build (source: `package.json`).
- `npm run lint` — lint (source: `package.json`).

## 9. Missing or unpinned tooling

- Node.js and npm versions are not pinned in a native version file; no tracked lockfile is present.
- Deployment server and hosting installation path are not specified.

## 10. Future adoption notes

Evaluate `mise.toml` for Node.js/npm and frontend tasks. Keep `package.json` and `package-lock.json` authoritative.

## SBOM artifact

`.github/workflows/sbom.yml` uploads `management-center-node.cdx.json` as `management-center-sbom`.
