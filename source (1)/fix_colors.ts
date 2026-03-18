import fs from 'fs';
import path from 'path';

const walk = (dir: string): string[] => {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = walk('./');

const colorMap: Record<string, string> = {
  'stone-950': 'white',
  'stone-900': 'stone-50',
  'stone-800': 'stone-200',
  'stone-700': 'stone-300',
  'stone-600': 'stone-400',
  'stone-500': 'stone-500',
  'stone-400': 'stone-600',
  'stone-300': 'stone-700',
  'stone-200': 'stone-800',
  'stone-100': 'stone-900',
  'stone-50': 'stone-950',
  'text-white': 'text-stone-900',
  'bg-white': 'bg-stone-900',
  'border-white': 'border-stone-900',
};

// Wait, the previous script already messed up some colors.
// Let's see what the current state is.
// stone-950 -> white (already done)
// stone-900 -> stone-50 (already done)
// stone-800 -> stone-200 -> stone-800 (so it's currently stone-800, needs to be stone-200)
// stone-400 -> stone-600 (already done)
// stone-300 -> stone-700 (already done)
// stone-200 -> stone-800 -> stone-200 (so it's currently stone-200? Wait, no. The first script did:
// 1. stone-800 -> stone-200
// 2. stone-400 -> stone-600
// 3. stone-300 -> stone-700
// 4. stone-200 -> stone-800 (this changed original stone-200 AND the newly created stone-200 to stone-800)
// So right now, there are NO stone-200s. All original stone-800 and stone-200 are now stone-800.
// This is bad because we lost the distinction between 800 and 200.

// Let's restore from git if possible, or just manually fix the common ones.
