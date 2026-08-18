export function getSeedPositions(bracketSize: number) {
  const seedPositions: number[] = [];
  if (bracketSize >= 2) seedPositions.push(0, bracketSize - 1);
  if (bracketSize >= 4) seedPositions.push(Math.floor(bracketSize / 2) - 1, Math.floor(bracketSize / 2));
  if (bracketSize >= 8) {
    const q1 = Math.floor(bracketSize / 4);
    const q3 = Math.floor((3 * bracketSize) / 4);
    seedPositions.push(q1 - 1, q1, q3 - 1, q3);
  }
  // Fill remaining index sequence
  for (let i = 0; i < bracketSize; i++) {
    if (!seedPositions.includes(i)) {
      seedPositions.push(i);
    }
  }
  return seedPositions;
}
console.log(getSeedPositions(16));
