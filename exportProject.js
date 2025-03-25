const fs = require('fs').promises;
const path = require('path');
const ignore = require('ignore');

// Load and parse .gitignore
async function loadGitignore(rootDir) {
  const ig = ignore();
  try {
    const gitignoreContent = await fs.readFile(path.join(rootDir, '.gitignore'), 'utf8');
    ig.add(gitignoreContent);
  } catch (err) {
    console.log('No .gitignore found, using defaults.');
  }
  ig.add(['node_modules', '.git', '*.log', 'dist', 'build', 'package-lock.json', 'exportProject.js']);
  return ig;
}

// Process a file and return content with line numbers
async function processFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n').map((line, index) => ({
      lineNumber: index + 1, // 1-based like VS Code
      text: line
    }));
    return { filePath, lines };
  } catch (err) {
    console.error(`Error reading ${filePath}: ${err.message}`);
    return { filePath, lines: [] };
  }
}

// Traverse directory recursively
async function traverseDirectory(dir, rootDir, ig, results = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(rootDir, fullPath);

    // Explicitly skip node_modules directory
    if (entry.isDirectory() && entry.name === 'node_modules') {
      console.log(`Skipping directory: ${fullPath}`);
      continue;
    }

    // Skip if ignored by .gitignore or defaults
    if (ig.ignores(relativePath)) {
      console.log(`Ignoring: ${relativePath}`);
      continue;
    }

    if (entry.isDirectory()) {
      await traverseDirectory(fullPath, rootDir, ig, results);
    } else if (entry.isFile()) {
      const fileData = await processFile(fullPath);
      results.push(fileData);
    }
  }
  return results;
}

// Generate output for a specific category (client or server) including root files
function generateOutput(rootDir, files, category) {
  // Include root files (no subdir) or files in the specified category
  const filteredFiles = files.filter(f => {
    const relPath = path.relative(rootDir, f.filePath);
    const isRootFile = !relPath.includes(path.sep); // Root files have no path separator
    const isCategoryFile = relPath.startsWith(`${category}${path.sep}`);
    return isRootFile || isCategoryFile;
  });

  if (filteredFiles.length === 0) return `${category} (with root) has no files.\n`;

  let output = `=== ${category} + Root Structure ===\n`;
  output += `${path.basename(rootDir)}/\n`;
  const structure = filteredFiles.map(f => `  ${path.relative(rootDir, f.filePath)}`).sort();
  output += structure.join('\n') + '\n\n';

  output += `=== ${category} + Root Contents ===\n`;
  for (const file of filteredFiles) {
    output += `\n--- ${path.relative(rootDir, file.filePath)} ---\n`;
    for (const { lineNumber, text } of file.lines) {
      output += `${lineNumber}: ${text}\n`;
    }
  }
  return output;
}

// Export the project
async function exportProject() {
  const rootDir = process.cwd(); // e.g., C:\Users\garre\Documents\top-chef-fantasy
  const ig = await loadGitignore(rootDir);
  const files = await traverseDirectory(rootDir, rootDir, ig);

  // Generate client + root output
  const clientOutput = generateOutput(rootDir, files, 'client');
  const clientOutputFile = path.join(rootDir, 'project_export_client.txt');
  await fs.writeFile(clientOutputFile, clientOutput);
  console.log(`Client + root files exported to ${clientOutputFile}`);

  // Generate server + root output
  const serverOutput = generateOutput(rootDir, files, 'server');
  const serverOutputFile = path.join(rootDir, 'project_export_server.txt');
  await fs.writeFile(serverOutputFile, serverOutput);
  console.log(`Server + root files exported to ${serverOutputFile}`);
}

// Run it
exportProject().catch(err => console.error('Error:', err));