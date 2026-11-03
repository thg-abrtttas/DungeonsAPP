import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateLong(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function rollDice(formula: string): { total: number; rolls: number[]; formula: string } {
  // Simple dice parser: supports NdM, NdM+X, NdM-X
  const match = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) {
    return { total: 0, rolls: [], formula };
  }

  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }

  const total = rolls.reduce((a, b) => a + b, 0) + modifier;
  return { total, rolls, formula };
}

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function advantageRoll(sides: number = 20): { roll: number; advantage: boolean; rolls: [number, number] } {
  const r1 = rollDie(sides);
  const r2 = rollDie(sides);
  return {
    roll: Math.max(r1, r2),
    advantage: true,
    rolls: [r1, r2],
  };
}

export function disadvantageRoll(sides: number = 20): { roll: number; disadvantage: boolean; rolls: [number, number] } {
  const r1 = rollDie(sides);
  const r2 = rollDie(sides);
  return {
    roll: Math.min(r1, r2),
    disadvantage: true,
    rolls: [r1, r2],
  };
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getContrastColor(hex: string): '#000000' | '#ffffff' {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100] as const;
export type DiceType = typeof DICE_TYPES[number];

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function generateId(): string {
  return crypto.randomUUID();
}