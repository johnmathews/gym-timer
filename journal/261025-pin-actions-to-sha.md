# GitHub Actions Pinned to Commit SHAs

**Date:** 2026-10-25

## Summary

Every `uses:` in `.github/workflows/docker.yml` (8 references, 7 distinct actions) now names a full 40-character commit SHA instead of a mutable tag, with the release tag as a trailing comment. `.github/dependabot.yml` is new and enables the `github-actions` ecosystem, weekly.

## Decision

The home server auto-deploys this image: What's Up Docker recreates the `timer` container within about a minute of a new `:latest` on ghcr (home-server `documentation/wud.md`). The `build-and-push` job holds a token with `packages: write` and ran `docker/login-action` and `docker/build-push-action` by major tag. A tag can be moved by whoever controls the action's repository (the tj-actions/changed-files compromise in 2025 did exactly that), so a hijacked tag would have published a malicious image that deploys itself. A commit SHA cannot be moved.

Nothing was upgraded. Each major tag was resolved to the commit it pointed at on 2026-10-25, and the comment names the most specific release tag on that commit:

- `actions/checkout` v4 → v4.4.0 (`11d5960a3267`)
- `actions/setup-node` v4 → v4.4.0 (`49933ea5288c`)
- `docker/build-push-action` v6 → v6.19.2 (`10e90e3645ea`)
- `docker/login-action` v3 → v3.7.0 (`c94ce9fb4685`)
- `docker/metadata-action` v5 → v5.10.0 (`c299e40c6544`)
- `docker/setup-buildx-action` v3 → v3.12.0 (`8d2750c68a42`)
- `docker/setup-qemu-action` v3 → v3.7.0 (`c7c53464625b`)

## Keeping the pins current

Dependabot's `github-actions` ecosystem understands SHA pins: it opens a pull request that replaces the SHA and rewrites the version comment together. Those pull requests are the only routine way the pins change; review them like any other dependency bump, since merging one publishes a new `:latest`.
