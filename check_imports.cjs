const fs = require('fs');
const path = require('path');

function checkImports() {
  const srcDir = './src';
  const missingFiles = [];
  
  // Get all TypeScript/JavaScript files
  function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        arrayOfFiles.push(fullPath);
      }
    });
    return arrayOfFiles;
  }
  
  const allFiles = getAllFiles(srcDir);
  
  allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const importRegex = /import.*from\s+['"]@\/components\/([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // Check if file exists
      let filePath = path.join(srcDir, 'components', importPath);
      
      // Try different extensions
      const extensions = ['.tsx', '.ts', '.jsx', '.js'];
      let exists = false;
      
      for (const ext of extensions) {
        if (fs.existsSync(filePath + ext)) {
          exists = true;
          break;
        }
      }
      
      // Try as directory with index
      if (!exists && fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        for (const ext of extensions) {
          const indexPath = path.join(filePath, 'index' + ext);
          if (fs.existsSync(indexPath)) {
            exists = true;
            break;
          }
        }
      }
      
      if (!exists) {
        missingFiles.push({
          importedBy: path.relative(srcDir, file),
          missingComponent: importPath
        });
      }
    }
  });
  
  if (missingFiles.length > 0) {
    console.log('Missing components:');
    missingFiles.forEach(item => {
      console.log(`${item.missingComponent} (imported by ${item.importedBy})`);
    });
  } else {
    console.log('All components found!');
  }
}

checkImports();
