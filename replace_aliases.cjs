const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      let c = fs.readFileSync(p, 'utf8');
      let r = c.replace(/['"]@\//g, match => match[0] + '@educ/');
      if (c !== r) {
        fs.writeFileSync(p, r);
        console.log('Updated ' + p);
      }
    }
  });
}

walk('core_educacion/apps/web/src');
