export function log(event: string, data?: Record<string, unknown>): void {
  if (data) {
    console.log(`[GymTimer] ${event}`, data);
  } else {
    console.log(`[GymTimer] ${event}`);
  }
}
