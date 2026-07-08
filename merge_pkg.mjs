import fs from 'fs';
import path from 'path';

const backendPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const frontendPkg = JSON.parse(fs.readFileSync('../restoku-refactored/package.json', 'utf8'));

// Merge dependencies
backendPkg.dependencies = {
  ...backendPkg.dependencies,
  ...frontendPkg.dependencies
};

// Merge devDependencies
backendPkg.devDependencies = {
  ...backendPkg.devDependencies,
  ...frontendPkg.devDependencies
};

// Also copy any scripts like "build" if needed, but Laravel has its own
// Write back
fs.writeFileSync('package.json', JSON.stringify(backendPkg, null, 4));
console.log('package.json merged successfully');
