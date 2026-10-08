const fs = require('fs');
const files = [
  'D:\\\\Webs\\\\ship-cutter\\\\client\\\\src\\\\pages\\\\PlaceholderPage.jsx',
  'D:\\\\Webs\\\\ship-cutter\\\\client\\\\src\\\\components\\\\layout\\\\DashboardLayout.jsx',
  'D:\\\\Webs\\\\ship-cutter\\\\client\\\\src\\\\components\\\\layout\\\\Sidebar.jsx'
];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\`\"/g, '"');
  
  // also fix the backticks in classNames that should be dynamic strings!
  // like: className={`fixed ... ${...}`}
  content = content.replace(/className=\"\`/g, 'className={`');
  content = content.replace(/\`\" \}/g, '`}');
  content = content.replace(/\`\"\}/g, '`}');
  
  fs.writeFileSync(file, content);
}
