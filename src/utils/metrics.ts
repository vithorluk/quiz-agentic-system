export function mean(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}

export function sum(numbers: number[]): number {
  return numbers.reduce((total, num) => total + num, 0);
}

export function groupBy<T>(array: T[], key: keyof T): Array<{ key: any; values: T[] }> {
  const groups = new Map<any, T[]>();

  for (const item of array) {
    const groupKey = item[key];
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(item);
  }

  return Array.from(groups.entries()).map(([k, values]) => ({ key: k, values }));
}
