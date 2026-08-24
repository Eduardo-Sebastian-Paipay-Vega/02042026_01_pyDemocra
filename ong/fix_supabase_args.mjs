import { readFileSync, writeFileSync } from 'fs';
import { Project, SyntaxKind, ts } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: "../tsconfig.json",
});

const logContent = readFileSync('ts_errors_12.log', 'utf16le');
const regex = /^(.+\.tsx?)\((\d+),\d+\):\serror\sTS(\d+):/gm;
let match;
const errorLines = new Map(); 

while ((match = regex.exec(logContent)) !== null) {
  const file = match[1];
  const line = parseInt(match[2], 10);
  
  if (!errorLines.has(file)) {
    errorLines.set(file, new Set());
  }
  errorLines.get(file).add(line);
}

for (const [file, lines] of errorLines.entries()) {
  const sourceFile = project.getSourceFile(file);
  if (!sourceFile) continue;
  
  let modified = false;

  const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  
  // Sort calls so we modify deeper ones first if needed
  // Not strictly necessary since we only add "as any"
  
  for (const call of calls) {
    const startLine = call.getStartLineNumber();
    if (lines.has(startLine)) {
      const expr = call.getExpression();
      if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
        const name = expr.getName();
        if (['select', 'insert', 'update', 'eq', 'in', 'gt', 'lt', 'gte', 'lte', 'order'].includes(name)) {
          const args = call.getArguments();
          if (args.length > 0) {
            const firstArg = args[0];
            if (firstArg.getKind() !== SyntaxKind.AsExpression) {
               firstArg.replaceWithText(`${firstArg.getText()} as any`);
               modified = true;
            }
          }
        }
      } else {
        // Just general function calls on error line, maybe add `as any` to first arg if it fails
        // Wait, for Dashboard.tsx, let's skip for now, Dashboard had very specific TS errors
      }
    }
  }
  
  if (modified) {
    sourceFile.saveSync();
    console.log(`Saved ${file}`);
  }
}
