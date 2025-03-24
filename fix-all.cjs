const fs = require('fs').promises;
const path = require('path');

async function fixAllSyntax(directory) {
  const files = await getFiles(directory);
  let fixedCount = 0;

  for (const file of files) {
    if (file.endsWith('.js')) {
      let content = await fs.readFile(file, 'utf8');
      const original = content;

      // Fix common syntax errors
      content = content
        // Fix console.log with missing quotes/parentheses
        .replace(/console\.log\(([^"]+?):\s*\)/g, 'console.log("$1")')
        // Fix malformed object literals
        .replace(/{,\s*/g, '{')
        .replace(/},/g, '}')
        // Fix MongoDB $push syntax
        .replace(/'\$push:\s*{/g, '$push: {')
        // Fix Socket.io room names
        .replace(/league:/g, '`league:${leagueId}`')
        // Fix empty objects
        .replace(/{\s*}/g, '{}')
        // Fix missing commas in objects
        .replace(/(\w+:\s*[^,\n}]+)(\n\s*\w+:)/g, '$1,$2');

      if (content !== original) {
        await fs.writeFile(file, content, 'utf8');
        console.log(`Fixed: ${file}`);
        fixedCount++;
      }
    }
  }
  console.log(`Total files fixed: ${fixedCount}`);
}

async function getFiles(dir) {
  try {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    }));
    return Array.prototype.concat(...files);
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
    return [];
  }
}

// Run fixes on server and client
Promise.all([
  fixAllSyntax(path.join(__dirname, 'server/src')),
  fixAllSyntax(path.join(__dirname, 'client/src'))
])
  .then(() => console.log('Syntax fixing complete'))
  .catch(err => console.error('Error during fixing:', err));