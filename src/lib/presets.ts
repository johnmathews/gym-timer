export interface Preset {
  work: number; // seconds
  rest: number; // seconds
  reps: number;
}

export const PRESETS: Preset[] = [
  { work: 60, rest: 0, reps: 10 },
  { work: 30, rest: 15, reps: 10 },
];
