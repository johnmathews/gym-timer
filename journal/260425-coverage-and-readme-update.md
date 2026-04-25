# Add test coverage thresholds and update README

## What changed

### Test coverage
- Configured vitest coverage with v8 provider in `vite.config.ts`
- Set 85% thresholds for statements, branches, functions, and lines
- Added `test:coverage` npm script
- Excluded `src/lib/index.ts` (empty placeholder) from coverage scope
- Wrote 18 new tests covering:
  - `warmAudioContext` (suspended/running context, unlock flag reset)
  - `startKeepAlive` / `stopKeepAlive` (silent oscillator, duplicate prevention, cleanup)
  - `playPauseSound` / `playResumeSound` compressor and suspend branches
  - `resumeAudioContext` suspended context path
  - Timer edge cases: addRep/removeRep/skipBackward when finished

### Coverage results
- Statements: 97.03%, Branches: 89.60%, Functions: 94%, Lines: 98.28%
- All above the 85% threshold

### README
- Renamed title from "Gym Timer" to "Timer" (matches package.json name)
- Rewrote description to reflect current features (intervals, presets, audio, phases)
- Added Lint section
- Added Presets section documenting `presets.yml` and Docker volume mount for runtime override
- Added volumes mount to Docker Compose example
- Fixed YAML indentation in Docker Compose example (1-space to 2-space)
