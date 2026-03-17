---
name: release-manager
description: 'Automate and manage releases for this project using release-please. Use when: bumping version, cutting a release, publishing a new version, shipping a feature, preparing a changelog, releasing a fix, or pumping a new version. Covers commit conventions, release-please workflow, and Docker image publishing.'
argument-hint: 'e.g. "bump patch", "release new feature", "what version should I use for this fix?"'
---

# Release Manager

Automates versioning, changelog generation, and Docker image publishing via [release-please](https://github.com/googleapis/release-please) + GitHub Actions.

## Release Pipeline

```
Conventional Commit → push to main
        ↓
release-please opens/updates "Release PR"
        ↓
Merge Release PR → vX.Y.Z tag created
        ↓
docker-publish.yml triggers → Docker Hub image pushed
```

## How to Pump a New Version

### Step 1 — Write a Conventional Commit

The commit message **type** determines which version number is bumped.

| Commit prefix | What it does | Version bump |
|---|---|---|
| `feat: ...` | New capability or tool | **minor** (1.1.0 → 1.2.0) |
| `fix: ...` | Bug fix | **patch** (1.1.0 → 1.1.1) |
| `feat!: ...` or `BREAKING CHANGE:` in body | Breaking API change | **major** (1.1.0 → 2.0.0) |
| `chore:`, `docs:`, `refactor:`, `test:` | Housekeeping | no release |

**Examples:**
```
feat: add list-characters tool
fix: handle polling timeout on slow generations
feat!: rename create-video options parameter to config
chore: update dependencies
```

See [Conventional Commits reference](./references/conventional-commits.md) for the full spec.

### Step 2 — Push to `main`

```bash
git add .
git commit -m "feat: your message here"
git push origin main
```

### Step 3 — Wait for the Release PR

After the push, the `Release Please` workflow (`.github/workflows/release-please.yml`) automatically:
- Bumps the version in `package.json`
- Updates `CHANGELOG.md`
- Opens (or updates) a PR titled **"chore(main): release X.Y.Z"**

Multiple `feat:` and `fix:` commits accumulate in the same Release PR until you decide to ship.

### Step 4 — Merge the Release PR

When you're ready to release:
1. Review the Release PR on GitHub
2. Merge it
3. release-please creates the `vX.Y.Z` git tag
4. The `Build and Push to Docker Hub` workflow triggers and publishes the image with tags:
   - `1.2.0`, `1.2`, `sha-<commit>`

## Checking the Current Version

```bash
node -e "console.log(require('./package.json').version)"
# or
cat package.json | grep '"version"'
```

## Workflow Files

| File | Purpose |
|---|---|
| `.github/workflows/release-please.yml` | Runs on every push to `main`; manages Release PRs and tags |
| `.github/workflows/docker-publish.yml` | Runs on `v*` tags; builds and pushes Docker image to Docker Hub |

## Required GitHub Secrets

| Secret | Used by | How to set |
|---|---|---|
| `DOCKERHUB_USERNAME` | docker-publish.yml | GitHub repo → Settings → Secrets |
| `DOCKERHUB_TOKEN` | docker-publish.yml | Docker Hub → Account Settings → Security → Access Tokens |
| `GITHUB_TOKEN` | release-please.yml | Built-in, no setup needed |

## Troubleshooting

**Release PR not created after push:**
- Check the `Release Please` workflow run in the GitHub Actions tab for errors
- Ensure the commit message follows Conventional Commits format (non-`chore` prefix required)

**Docker image not published after merging Release PR:**
- Confirm the `vX.Y.Z` tag was created on the repo (GitHub → Tags)
- Check the `Build and Push to Docker Hub` workflow run

**Wrong version bump:**
- See [./references/conventional-commits.md](./references/conventional-commits.md) for correct prefixes
