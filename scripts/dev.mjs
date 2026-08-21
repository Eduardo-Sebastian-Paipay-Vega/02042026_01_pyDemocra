import { spawn } from 'node:child_process';

console.log('Iniciando API y WEB...');

const api = spawn('npm', ['run', 'dev:api'], { stdio: 'inherit', shell: true });
const web = spawn('npm', ['run', 'dev:web'], { stdio: 'inherit', shell: true });

api.on('close', (code) => {
  console.log(`API process exited with code ${code}`);
  web.kill();
  process.exit(code);
});

web.on('close', (code) => {
  console.log(`WEB process exited with code ${code}`);
  api.kill();
  process.exit(code);
});

process.on('SIGINT', () => {
  api.kill('SIGINT');
  web.kill('SIGINT');
  process.exit();
});
