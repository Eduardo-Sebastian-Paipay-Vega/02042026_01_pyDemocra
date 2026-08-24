/**
 * Fix test imports: replace `import { screen, ... } from '@testing-library/react'`
 * by splitting into two imports - one for render/act from testing-library and
 * another specifically for screen/fireEvent/waitFor from @testing-library/react.
 *
 * Actually the real fix: @testing-library/react v14+ DOES export screen.
 * The issue is the tsconfig types. Let's check what's needed and add
 * `import '@testing-library/jest-dom'` plus fix the screen import source.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

const TEST_FILES = [
  'ong/src/app/components/shared/__tests__/DataTable.test.tsx',
  'ong/src/app/components/ui/__tests__/button.test.tsx',
  'ong/src/app/components/ui/__tests__/modal-shell.test.tsx',
  'ong/src/app/pages/AccessControl.test.tsx',
  'ong/src/app/pages/Activities.test.tsx',
  'ong/src/app/pages/AdmissionDocuments.test.tsx',
  'ong/src/app/pages/AdmissionInterviews.test.tsx',
  'ong/src/app/pages/AdmissionOnboarding.test.tsx',
  'ong/src/app/pages/AdmissionRequests.test.tsx',
  'ong/src/app/pages/Approvals.test.tsx',
  'ong/src/app/pages/Areas.test.tsx',
  'ong/src/app/pages/Attendance.test.tsx',
  'ong/src/app/pages/AuditLog.test.tsx',
  'ong/src/app/pages/Beneficiaries.test.tsx',
  'ong/src/app/pages/Catalogs.test.tsx',
  'ong/src/app/pages/Courses.test.tsx',
  'ong/src/app/pages/Dashboard.test.tsx',
  'ong/src/app/pages/Evidence.test.tsx',
  'ong/src/app/pages/Finance.test.tsx',
  'ong/src/app/pages/GlobalSearch.test.tsx',
  'ong/src/app/pages/Hours.test.tsx',
  'ong/src/app/pages/HoursApproval.test.tsx',
  'ong/src/app/pages/IdCards.test.tsx',
  'ong/src/app/pages/Inventory.test.tsx',
  'ong/src/app/pages/landing/create-tenant.test.tsx',
  'ong/src/app/pages/Login.test.tsx',
  'ong/src/app/pages/MedicalRecords.test.tsx',
  'ong/src/app/pages/NotificationHistory.test.tsx',
  'ong/src/app/pages/NotificationTemplates.test.tsx',
  'ong/src/app/pages/ProjectActivities.test.tsx',
  'ong/src/app/pages/ProjectAssignments.test.tsx',
  'ong/src/app/pages/Projects.test.tsx',
  'ong/src/app/pages/Roles.test.tsx',
  'ong/src/app/pages/Security.test.tsx',
  'ong/src/app/pages/SensitiveAccess.test.tsx',
  'ong/src/app/pages/SoftDelete.test.tsx',
  'ong/src/app/pages/SystemUsers.test.tsx',
  'ong/src/app/pages/Tasks.test.tsx',
  'ong/src/app/pages/Volunteers.test.tsx',
];

let fixed = 0;
for (const relPath of TEST_FILES) {
  try {
    let content = readFileSync(relPath, 'utf8');
    const original = content;

    // Pattern: import { screen, fireEvent, waitFor, ... } from '@testing-library/react'
    // Replace with: import { render, act } from '@testing-library/react'  (only keep render/act)
    // And add: import { screen, fireEvent, waitFor } from '@testing-library/dom'
    
    // Actually the simpler fix: these ARE exported from @testing-library/react v14+
    // The issue is likely the TypeScript version or the type declarations.
    // Best fix: add a type reference or use direct imports.
    
    // Fix: replace import with explicit re-export pattern
    // Replace: import { screen, fireEvent, waitFor, render } from '@testing-library/react'
    // With: import { render } from '@testing-library/react'; import { screen, fireEvent, waitFor } from '@testing-library/dom';
    
    const testingLibRegex = /import\s*\{([^}]+)\}\s*from\s*['"]@testing-library\/react['"]/g;
    
    content = content.replace(testingLibRegex, (match, imports) => {
      const importList = imports.split(',').map(i => i.trim()).filter(Boolean);
      
      // screen, fireEvent, waitFor should come from @testing-library/dom (re-exported but better typed there)
      const domExports = ['screen', 'fireEvent', 'waitFor', 'within', 'getByText', 'queryByText'];
      
      const reactImports = importList.filter(i => !domExports.includes(i));
      const domImports = importList.filter(i => domExports.includes(i));
      
      let result = '';
      if (reactImports.length > 0) {
        result += `import { ${reactImports.join(', ')} } from '@testing-library/react'`;
      }
      if (domImports.length > 0) {
        if (result) result += '\n';
        result += `import { ${domImports.join(', ')} } from '@testing-library/dom'`;
      }
      if (!result) result = match; // fallback
      return result;
    });

    // Add jest-dom import if not present
    if (!content.includes('@testing-library/jest-dom')) {
      content = `import '@testing-library/jest-dom';\n` + content;
    }

    if (content !== original) {
      writeFileSync(relPath, content, 'utf8');
      console.log(`Fixed: ${relPath}`);
      fixed++;
    }
  } catch (e) {
    console.warn(`Skipping ${relPath}: ${e.message}`);
  }
}

console.log(`\nTotal fixed: ${fixed} files`);
