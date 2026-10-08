const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Create src/lib/prisma.ts
const prismaTsContent = `import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
`;

fs.writeFileSync(path.join(__dirname, '../src/lib/prisma.ts'), prismaTsContent);

// 2. Find all files with "new PrismaClient()"
const grepCommand = 'git grep -l "new PrismaClient()" src';
let files = [];
try {
  files = execSync(grepCommand).toString().trim().split('\n');
} catch (e) {
  console.log('No files found or git grep failed');
  process.exit(1);
}

// 3. Replace in each file
files.forEach(file => {
  if (!file || file === 'src/lib/prisma.ts') return;
  const filePath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace: import { PrismaClient } from '@prisma/client';
  // With: import { prisma } from '@/lib/prisma';
  content = content.replace(/import\s+{\s*PrismaClient\s*}\s+from\s+['"]@prisma\/client['"];?/g, "import { prisma } from '@/lib/prisma';");
  
  // Replace: const prisma = new PrismaClient();
  // With: // const prisma = new PrismaClient(); (removed because we import prisma directly)
  content = content.replace(/const\s+prisma\s*=\s*new\s+PrismaClient\(\)\s*;/g, "");
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
console.log('Done!');
