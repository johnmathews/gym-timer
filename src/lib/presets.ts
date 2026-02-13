export interface Preset {
  name: string;
  work: number;   // seconds
  rest: number;   // seconds
  reps: number;
}

export const PRESETS: Preset[] = [
  { name: "Tabata",           work: 20,  rest: 10,  reps: 8 },
  { name: "EMOM",             work: 40,  rest: 20,  reps: 10 },
  { name: "30/30",            work: 30,  rest: 30,  reps: 6 },
  { name: "Quick Burn",       work: 45,  rest: 15,  reps: 5 },
  { name: "Endurance",        work: 60,  rest: 30,  reps: 5 },
  { name: "Sprint Intervals", work: 15,  rest: 45,  reps: 8 },
  { name: "Long Sets",        work: 120, rest: 60,  reps: 3 },
  { name: "Stretch",          work: 30,  rest: 5,   reps: 6 },
];
