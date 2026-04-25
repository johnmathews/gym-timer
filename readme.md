# Timer

A workout interval timer web app with configurable work/rest durations, rep counts, and preset workouts. Features audio cues (bells, chimes, countdown dings, fanfare), color-coded phases, keyboard shortcuts, and wake lock support.

Built with SvelteKit as a static site, designed for touch interfaces and optimized for mobile/iOS.

## Setup

Requires Node.js 22+.

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

## Lint

```sh
npm run lint
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

## Presets

Workout presets are defined in `presets.yml` (name, work seconds, rest seconds, reps). Defaults are compiled into the JS bundle at build time.

At runtime, the app fetches `/presets.yml` from the server. In Docker, mount a directory containing your custom `presets.yml` to `/config/` to override the defaults without rebuilding:

```sh
docker run -d -p 8080:80 -v /path/to/config:/config ghcr.io/johnmathews/gym-timer:latest
```

Edit the file on the host and reload the page to pick up changes.

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
    volumes:
      - /path/to/config:/config  # optional: custom presets.yml
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
