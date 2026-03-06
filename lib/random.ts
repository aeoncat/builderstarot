export function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function deterministicIndex(seed: string, max: number) {
  return hashString(seed) % max;
}
