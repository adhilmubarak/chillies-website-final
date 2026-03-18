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
  
  content = content.replace(/bg-stone-100/g, 'bg-stone-100');
  content = content.replace(/border-stone-200/g, 'border-stone-200');
  
  fs.writeFileSync(file, content, 'utf8');
});
console.log("Done fixing stone-800.");
