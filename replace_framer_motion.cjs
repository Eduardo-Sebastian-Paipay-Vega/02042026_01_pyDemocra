const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx') || p.endsWith('.js') || p.endsWith('.jsx')) {
      let c = fs.readFileSync(p, 'utf8');
      let r = c.replace(/['"]framer-motion['"]/g, "'motion/react'");
      if (c !== r) {
        fs.writeFileSync(p, r);
        console.log('Updated ' + p);
      }
    }
  });
}

walk('src');
walk('ong/src');
walk('core_educacion/apps/web/src');
