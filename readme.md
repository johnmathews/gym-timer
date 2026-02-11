# Gym Timer

A simple gym workout timer web app. Slide to set a duration (up to 5 minutes), start the countdown, and get an audio + visual alert when time's up.

Built with SvelteKit as a static site, designed for touch interfaces and optimized for mobile/iOS.

## Setup

Requires Node.js 20+.

```sh
npm install
```

## Development

```sh
npm run dev
```

## Build

Produces static output in `build/`.

```sh
npm run build
```

## Tests

```sh
# Unit tests
npm run test:unit

# E2E tests (Playwright)
npm run test:e2e

# All tests
npm test
```

## Deployment

The app is packaged as a Docker image (nginx serving the static build) and published to GHCR on every push to `main`.

### Pull the image

```sh
docker pull ghcr.io/johnmathews/gym-timer:latest
```

Or pin to a specific version:

```sh
docker pull ghcr.io/johnmathews/gym-timer:1.0.0
```

### Run with Docker

```sh
docker run -d -p 8080:80 ghcr.io/johnmathews/gym-timer:latest
```

The app will be available at `http://localhost:8080`.

### Run with Docker Compose

```yaml
# docker-compose.yml
services:
  gym-timer:
    image: ghcr.io/johnmathews/gym-timer:latest
    ports:
      - "8080:80"
    restart: unless-stopped
```

```sh
docker compose up -d
```

### Build locally

```sh
docker build -t gym-timer .
docker run -d -p 8080:80 gym-timer
```

### Releasing a new version

Push a semver tag to trigger a versioned image build:

```sh
git tag v1.0.0
git push origin v1.0.0
```

This publishes the image tagged as `1.0.0`, `1.0`, `1`, and `latest`.
