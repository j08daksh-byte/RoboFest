const fs = require('fs');
const file = 'D:\\\\Webs\\\\ship-cutter\\\\client\\\\package.json';
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
pkg.scripts.postinstall = "node -e \"require('fs').cpSync('node_modules/@titan/digital-twin/public', 'public/twin-assets', {recursive: true})\"";
fs.writeFileSync(file, JSON.stringify(pkg, null, 2));
console.log('Senior package.json updated with postinstall script');
