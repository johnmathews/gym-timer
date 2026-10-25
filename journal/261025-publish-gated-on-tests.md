# Image Publish Waits for the Tests

**Date:** 2026-10-25

## Summary

`build-and-push` in `.github/workflows/docker.yml` now has `needs: test`. Until now it ran in parallel with `test`, so a commit that failed lint, the unit tests or Playwright still pushed `:latest` to ghcr.io.

## Decision

The home server now auto-deploys this image. A What's Up Docker sidecar on the infra VM polls ghcr every minute and recreates the `timer` container when the `:latest` digest changes; see `documentation/wud.md` in the home-server repo. With that in place, an image on ghcr is a production deploy, so publishing waits for the tests. The trade-off is a slower path from push to deploy: the build now starts after the test job instead of beside it.
