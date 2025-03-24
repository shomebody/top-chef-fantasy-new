const fs = require('fs').promises;
const path = require('path');

// List of files to fix with their specific corrections
const filesToFix = [
  {
    path: 'src/components/ui/Button.jsx',
    regex: /className=\{[^"]*?\}/g,
    replacement: 'className="px-4 py-2 bg-primary-600 text-white rounded-lg"'
  },
  {
    path: 'src/components/ui/Card.jsx',
    regex: /className=\{[^"]*?dark[^"]*?\}/g,
    replacement: 'className="bg-white dark:bg-gray-800 p-4 rounded-lg"'
  },
  {
    path: 'src/components/ui/Input.jsx',
    regex: /className=\{[^"]*?px[^"]*?\}/g,
    replacement: 'className="w-full px-3 py-2 border rounded-lg focus:outline-none"'
  },
  {
    path: 'src/components/ui/Logo.jsx',
    regex: /className=\{[^"]*?text[^"]*?\}/g,
    replacement: 'className="font-display text-primary-600 dark:text-primary-400"'
  },
  {
    path: 'src/layouts/MainLayout.jsx',
    regex: /className=\{?[^"]*?\b[^"]*?\}/g,
    replacement: 'className="bg-white dark:bg-gray-800 border-r border-gray-200"'
  },
  {
    path: 'src/pages/ChefRoster.jsx',
    regex: /className=\{[^"]*?font[^"]*?\}/g,
    replacement: 'className="text-xs font-medium px-2 py-1 rounded-full"'
  },
  {
    path: 'src/pages/LeagueDetail.jsx',
    regex: /className=\{[^"]*?px[^"]*?\}/g,
    replacement: 'className="inline-block px-3 py-1 text-xs font-medium rounded"'
  },
  {
    path: 'src/pages/Schedule.jsx',
    regex: /className=\{[^"]*?px[^"]*?\}/g,
    replacement: 'className="text-xs px-2 py-0.5 rounded-full"'
  },
  {
    path: 'src/pages/Settings.jsx',
    regex: /className=\{[^"]*?py[^"]*?\}/g,
    replacement: 'className="px-4 py-2 border-b-2"'
  },
  {
    path: 'src/services/api.js',
    regex: /\(error\)\s*=>\s*\{/g,
    replacement: '(error) => {\n    console.error(\'API Error:\', error);\n    throw error;\n'
  }
];

async function fixSpecificFiles() {
  const baseDir = path.join(__dirname, 'client');
  let fixedCount = 0;

  for (const fileInfo of filesToFix) {
    const filePath = path.join(baseDir, fileInfo.path);
    try {
      let content = await fs.readFile(filePath, 'utf8');
      const original = content;

      // Apply the specific fix
      content = content.replace(fileInfo.regex, fileInfo.replacement);

      if (content !== original) {
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`Fixed: ${filePath}`);
        fixedCount++;
      }
    } catch (err) {
      console.error(`Error processing ${filePath}:`, err);
    }
  }

  console.log(`Total files fixed: ${fixedCount}`);
}

fixSpecificFiles()
  .then(() => console.log('Fixing complete'))
  .catch(err => console.error('Error during fixing:', err));