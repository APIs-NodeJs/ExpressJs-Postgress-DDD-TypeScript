// scripts/cleanup.js
const fs = require('fs');
const path = require('path');

console.log('🧹 Starting codebase cleanup...\n');

// Files to delete (dead code)
const filesToDelete = [
  'src/core/infrastructure/messaging/EventPublisher.ts',
  'src/shared/utils/DateUtils.ts',
  'src/shared/utils/StringUtils.ts',
  'src/shared/utils/ValidationUtils.ts',
  'src/shared/errors/ErrorFactory.ts',
];

// Directories to check for unused files
const dirsToCheck = ['src/modules', 'src/core', 'src/shared'];

let deletedCount = 0;
let errorCount = 0;

// Delete specified files
filesToDelete.forEach(file => {
  const filePath = path.join(process.cwd(), file);

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Deleted: ${file}`);
      deletedCount++;
    } catch (error) {
      console.error(`❌ Failed to delete ${file}:`, error.message);
      errorCount++;
    }
  } else {
    console.log(`⏭️  Skipped (not found): ${file}`);
  }
});

console.log('\n📊 Cleanup Summary:');
console.log(`   Files deleted: ${deletedCount}`);
console.log(`   Errors: ${errorCount}`);
console.log(
  `   Status: ${errorCount === 0 ? '✅ Success' : '⚠️  Completed with errors'}\n`
);

// Check for potential dead code
console.log('🔍 Checking for potential unused exports...\n');

function findTsFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (
        stat.isDirectory() &&
        !item.includes('node_modules') &&
        !item.includes('dist')
      ) {
        traverse(fullPath);
      } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    });
  }

  traverse(dir);
  return files;
}

// Find all TypeScript files
const allFiles = dirsToCheck.flatMap(dir => findTsFiles(path.join(process.cwd(), dir)));

// Simple unused export detection
const potentialUnused = [];

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const exports =
    content.match(/export (class|interface|function|const|enum|type) \w+/g) || [];

  exports.forEach(exportStatement => {
    const name = exportStatement.split(' ').pop();
    let usageCount = 0;

    allFiles.forEach(searchFile => {
      if (searchFile !== file) {
        const searchContent = fs.readFileSync(searchFile, 'utf-8');
        // Simple check - count occurrences (not perfect but helpful)
        const regex = new RegExp(`\\b${name}\\b`, 'g');
        const matches = searchContent.match(regex);
        if (matches) {
          usageCount += matches.length;
        }
      }
    });

    if (usageCount === 0) {
      potentialUnused.push({
        file: file.replace(process.cwd(), ''),
        export: name,
      });
    }
  });
});

if (potentialUnused.length > 0) {
  console.log('⚠️  Potentially unused exports found:');
  potentialUnused.slice(0, 10).forEach(item => {
    console.log(`   ${item.file}: ${item.export}`);
  });

  if (potentialUnused.length > 10) {
    console.log(`   ... and ${potentialUnused.length - 10} more`);
  }
} else {
  console.log('✅ No obviously unused exports detected');
}

console.log('\n✨ Cleanup complete!\n');
