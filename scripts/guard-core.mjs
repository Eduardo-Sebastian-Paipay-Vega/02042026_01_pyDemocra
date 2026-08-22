import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';

// Zonas protegidas del Core
const PROTECTED_ZONES = [
  'server/core/',
  'src/core/',
  'server/routes/'
];

// Requisitos
const REQUIRED_FLAG = '[CORE-UPDATE]';
const AUDIT_DIR = 'changes/';

function main() {
  const commitMsgFile = process.argv[2];
  if (!commitMsgFile) {
    console.error("No commit message file provided.");
    process.exit(0);
  }

  // 1. Obtener archivos en stage
  let stagedFiles = [];
  try {
    const diffOutput = execSync('git diff --cached --name-only').toString();
    stagedFiles = diffOutput.split('\n').filter(Boolean);
  } catch (error) {
    console.error("Error running git diff", error);
    process.exit(1);
  }

  // 2. Verificar si hay archivos protegidos modificados
  const modifiedProtectedFiles = stagedFiles.filter(file => 
    PROTECTED_ZONES.some(zone => file.startsWith(zone))
  );

  if (modifiedProtectedFiles.length === 0) {
    // Ningún archivo del core modificado, permitir commit
    process.exit(0);
  }

  console.log('\x1b[33m%s\x1b[0m', '🛡️  CORE GUARDIAN: Cambios en el Core detectados.');

  // 3. Verificar el mensaje del commit
  const commitMessage = readFileSync(commitMsgFile, 'utf8');
  if (!commitMessage.includes(REQUIRED_FLAG)) {
    console.error('\x1b[31m%s\x1b[0m', '⛔ ERROR: Intento de modificación al Core sin el flag requerido.');
    console.error(`\x1b[31mEstás modificando archivos protegidos:\x1b[0m\n  ${modifiedProtectedFiles.join('\n  ')}`);
    console.error(`\x1b[33mPara proceder, debes incluir la etiqueta \x1b[1m${REQUIRED_FLAG}\x1b[0m\x1b[33m en tu mensaje de commit.\x1b[0m`);
    process.exit(1);
  }

  // 4. Verificar existencia de auditoría
  // Chequeamos si algún archivo en changes/ está en stage
  const hasAuditInStage = stagedFiles.some(file => file.startsWith(AUDIT_DIR));
  
  if (!hasAuditInStage) {
    console.error('\x1b[31m%s\x1b[0m', `⛔ ERROR: Modificaciones al Core exigen un archivo de auditoría.`);
    console.error(`\x1b[33mDebes incluir un archivo de registro en \x1b[1m${AUDIT_DIR}\x1b[0m\x1b[33m documentando este cambio.\x1b[0m`);
    console.error(`Revisa la documentación (AGENTS.md) sobre "Auditoría de cambios y versionado".`);
    process.exit(1);
  }

  console.log('\x1b[32m%s\x1b[0m', '✅ CORE GUARDIAN: Validación superada (Flag y Auditoría confirmados).');
  process.exit(0);
}

main();
