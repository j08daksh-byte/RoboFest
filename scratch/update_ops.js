const fs = require('fs');
const file = 'D:\\\\Webs\\\\ship-cutter\\\\client\\\\src\\\\pages\\\\OperationsLivePage.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<TwinProvider state={twinState}>',
  '<TwinProvider state={twinState} assetBaseUrl="/twin-assets">'
);

fs.writeFileSync(file, content);
console.log('OperationsLivePage.jsx updated');
