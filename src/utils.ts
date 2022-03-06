export function secondsToString(time: number): string {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor((time % 3600) % 60);
  const str: string[] = [];
  if (hours > 0) str.push(hours < 10 ? `0${hours}` : hours.toString());
  str.push(minutes < 10 ? `0${minutes}` : minutes.toString());
  str.push(seconds < 10 ? `0${seconds}` : seconds.toString());
  return str.join(':');
}

export function inRange(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}