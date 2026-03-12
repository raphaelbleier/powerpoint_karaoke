# GitHub Main Branch Ruleset

This folder contains a ruleset template for protecting `main`.

## Intended protection behavior

- Changes reach `main` only through pull requests
- The `test` GitHub Actions job must pass before merge
- A code owner review is required before merge
- With `.github/CODEOWNERS` set to `@raphaelbleier`, that means the repository owner must approve
- Force pushes to `main` are blocked
- Deletion of `main` is blocked

## How to apply

GitHub branch protection/rulesets cannot be enforced purely from repository files alone.

Apply the settings manually in GitHub:

1. Open `Settings` → `Rules` → `Rulesets`
2. Create a new branch ruleset for `main`
3. Mirror the settings from `main-branch-protection.json`
4. Ensure the required status check is the `test` job from `.github/workflows/docker-publish.yml`
5. Keep the bypass list empty unless you intentionally want exceptions

If GitHub's UI changes, use the JSON file in this folder as the source of truth for the desired protection policy.