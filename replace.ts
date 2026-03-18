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

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace colors
  content = content.replace(/brand-/g, 'brand-');
  content = content.replace(/white/g, 'white');
  content = content.replace(/stone-50/g, 'stone-50');
  content = content.replace(/stone-800/g, 'stone-800');
  content = content.replace(/stone-600/g, 'stone-600');
  content = content.replace(/stone-700/g, 'stone-700');
  content = content.replace(/stone-800/g, 'stone-800');
  content = content.replace(/text-stone-900/g, 'text-stone-50');
  content = content.replace(/bg-white\/5/g, 'bg-stone-50/5');
  content = content.replace(/bg-white\/10/g, 'bg-stone-50/10');
  content = content.replace(/border-white\/5/g, 'border-stone-50/5');
  content = content.replace(/border-white\/10/g, 'border-stone-50/10');
  content = content.replace(/border-white\/20/g, 'border-stone-50/20');
  
  fs.writeFileSync(file, content, 'utf8');
});
console.log("Done replacing colors.");
