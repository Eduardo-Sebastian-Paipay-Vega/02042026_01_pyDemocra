const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Remove scripts
delete pkg.scripts['dev:educacion'];
delete pkg.scripts['build:educacion'];

// Update dev:all
pkg.scripts['dev:all'] = 'concurrently --kill-others-on-fail --names "API,WEB" -c "bgBlue.bold,bgGreen.bold" "npm:dev:api" "npm:dev:web"';

// Remove NestJS dependencies
const nestDeps = [
  '@nestjs/cli',
  '@nestjs/common',
  '@nestjs/core',
  '@nestjs/platform-express',
  '@nestjs/schematics',
  'class-transformer',
  'class-validator',
  'reflect-metadata',
  'rxjs'
];

nestDeps.forEach(dep => {
  if (pkg.dependencies && pkg.dependencies[dep]) {
    delete pkg.dependencies[dep];
  }
  if (pkg.devDependencies && pkg.devDependencies[dep]) {
    delete pkg.devDependencies[dep];
  }
});

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('package.json updated');
