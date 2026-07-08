import fs from 'fs';
import path from 'path';

const placeholders = [
  'PembelianVendor',
  'StokOpname',
  'StafShift',
  'DiskonPajak',
  'ManajemenMeja'
];

for (const name of placeholders) {
  const content = `export function ${name}() {
  return <div className="p-4 text-slate-400">Placeholder for ${name}</div>;
}
`;
  fs.writeFileSync(path.join('resources/js/Components/Placeholder', `${name}.tsx`), content);
}
console.log('Placeholders created.');
