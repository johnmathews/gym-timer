export interface Preset {
  name: string;
  work: number; // seconds
  rest: number; // seconds
  reps: number;
}

export const PRESETS: Preset[] = [
  { name: "EMOM", work: 40, rest: 20, reps: 10 },
  { name: "30/30", work: 30, rest: 30, reps: 6 },
  { name: "Endurance", work: 60, rest: 30, reps: 5 },
  { name: "Long Sets", work: 120, rest: 60, reps: 3 },
  { name: "Stretch", work: 30, rest: 5, reps: 6 },
];
