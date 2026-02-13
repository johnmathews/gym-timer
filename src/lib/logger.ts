export function log(event: string, data?: Record<string, unknown>): void {
  if (data) {
    console.log(`[Timer] ${event}`, data);
  } else {
    console.log(`[Timer] ${event}`);
  }
}
