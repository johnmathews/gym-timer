export interface Preset {
  name: string;
  work: number; // seconds
  rest: number; // seconds
  reps: number;
}

export const PRESETS: Preset[] = [
  { name: "EMOM", work: 60, rest: 0, reps: 10 },
  { name: "30/30", work: 30, rest: 30, reps: 6 },
  { name: "Endurance", work: 90, rest: 30, reps: 5 },
  { name: "2-1-3", work: 120, rest: 60, reps: 3 },
  { name: "Stretch", work: 30, rest: 10, reps: 3 },
];
