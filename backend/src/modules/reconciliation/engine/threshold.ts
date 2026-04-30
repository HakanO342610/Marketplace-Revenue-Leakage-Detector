export function getDynamicThreshold(grossAmount: number): number {
  if (grossAmount < 1000) {
    return 5;
  }
  if (grossAmount <= 10000) {
    return grossAmount * 0.01;
  }
  return grossAmount * 0.005;
}
