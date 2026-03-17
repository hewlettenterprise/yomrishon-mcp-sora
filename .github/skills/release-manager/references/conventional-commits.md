# Conventional Commits Reference

Full spec: https://www.conventionalcommits.org/en/v1.0.0/

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types & Version Impact

| Type | Description | Version Bump |
|---|---|---|
| `feat` | A new feature | **minor** |
| `fix` | A bug fix | **patch** |
| `feat!` or `fix!` | Breaking change (exclamation) | **major** |
| `BREAKING CHANGE:` | In the footer/body | **major** |
| `docs` | Documentation only | none |
| `chore` | Build process, tooling, deps | none |
| `refactor` | Code change, no feature/fix | none |
| `test` | Adding or fixing tests | none |
| `perf` | Performance improvement | none |
| `ci` | CI/CD configuration | none |
| `style` | Formatting, whitespace | none |
| `revert` | Reverts a prior commit | none |

## Scope (Optional)

Scope narrows what part of the codebase was changed. For this project, useful scopes include:

```
feat(tools): add remix-video tool
fix(polling): handle timeout on slow generations
chore(deps): bump @modelcontextprotocol/sdk to 1.13.0
```

## Breaking Changes

Two ways to mark a breaking change (both trigger a **major** bump):

**Option 1 — Exclamation mark:**
```
feat!: rename create-video options to config
```

**Option 2 — Footer:**
```
feat: rename create-video options to config

BREAKING CHANGE: the `options` parameter in create-video is now named `config`
```

## Real Examples for This Project

```bash
# New tool → minor bump (1.1.0 → 1.2.0)
feat: add list-characters tool

# Bug fix → patch bump (1.1.0 → 1.1.1)
fix: prevent duplicate polling requests on network retry

# Update docs → no release
docs: update README with new tool examples

# Dependency update → no release
chore: update typescript to 5.9.0

# Breaking rename → major bump (1.1.0 → 2.0.0)
feat!: rename SORA_API_KEY to OPENAI_API_KEY
```
