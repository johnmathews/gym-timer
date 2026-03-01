export interface Preset {
  name: string;
  work: number; // seconds
  rest: number; // seconds
  reps: number;
}

export const PRESETS: Preset[] = [
  { name: "EMOM6", work: 60, rest: 0, reps: 6 },
  { name: "EMOM10", work: 60, rest: 0, reps: 10 },
];
