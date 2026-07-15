import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modulesDir = path.join(__dirname, 'ong', 'src', 'app', 'modules');
const modules = fs.readdirSync(modulesDir);

let generatedCount = 0;

for (const module of modules) {
  const hooksDir = path.join(modulesDir, module, 'hooks');
  if (!fs.existsSync(hooksDir)) continue;

  const files = fs.readdirSync(hooksDir).filter(f => f.startsWith('use') && f.endsWith('.ts') && !f.endsWith('.test.ts'));

  for (const file of files) {
    const filePath = path.join(hooksDir, file);
    const testPath = path.join(hooksDir, file.replace('.ts', '.test.ts'));
    
    if (fs.existsSync(testPath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Find the service import (e.g. from "../../../services/gobernanza/audit.service")
    // Usually it's the only import that is not React or types.
    const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+\/services\/[^'"]+)['"]/g;
    let match;
    let serviceFunctions = [];
    let servicePath = '';
    
    while ((match = importRegex.exec(content)) !== null) {
      serviceFunctions.push(...match[1].split(',').map(s => s.trim()));
      servicePath = match[2];
    }

    if (serviceFunctions.length === 0) {
      // Maybe it imports from a local service or something else
      const localServiceRegex = /import\s+\{([^}]+)\}\s+from\s+['"](\.\.\/[^'"]+Service|[^'"]+Service)['"]/i;
      const localMatch = localServiceRegex.exec(content);
      if (localMatch) {
         serviceFunctions.push(...localMatch[1].split(',').map(s => s.trim()));
         servicePath = localMatch[2];
      } else {
        // Find any import that is not react, types or icons
        const anyServiceRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
        let anyMatch;
        while ((anyMatch = anyServiceRegex.exec(content)) !== null) {
           if (!anyMatch[2].includes('react') && !anyMatch[2].includes('lucide') && !anyMatch[2].includes('types')) {
               serviceFunctions.push(...anyMatch[1].split(',').map(s => s.trim()));
               servicePath = anyMatch[2];
           }
        }
      }
    }

    // Default main function to mock
    let mainFunction = serviceFunctions[0] || 'mockFunction';
    
    const hookName = file.replace('.ts', '');

    const testContent = `import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

${servicePath ? `vi.mock("${servicePath}");` : ''}
${servicePath ? `import { ${serviceFunctions.join(", ")} } from "${servicePath}";` : ''}
import { ${hookName} } from "./${hookName}";

describe("${module}/hooks/${hookName}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inicia en estado de carga", () => {
    ${servicePath ? `vi.mocked(${mainFunction}).mockImplementation(() => new Promise(() => {}));` : ''}
    const { result } = renderHook(() => ${hookName}({} as any));
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("maneja resolucion exitosa", async () => {
    const mockData = { test: true } as any;
    ${servicePath ? `vi.mocked(${mainFunction}).mockResolvedValue(mockData);` : ''}

    const { result, unmount } = renderHook(() => ${hookName}({} as any));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    ${servicePath ? `expect(${mainFunction}).toHaveBeenCalled();` : ''}
    
    unmount();
  });

  it("maneja error en la resolucion", async () => {
    ${servicePath ? `vi.mocked(${mainFunction}).mockRejectedValue(new Error("Error de prueba"));` : ''}

    const { result, unmount } = renderHook(() => ${hookName}({} as any));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Error de prueba");
    
    unmount();
  });

  it("activa reloadToken al llamar a refresh", async () => {
    ${servicePath ? `vi.mocked(${mainFunction}).mockResolvedValue({} as any);` : ''}
    const { result } = renderHook(() => ${hookName}({} as any));
    
    await act(async () => {
      result.current.refresh();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    
    // Debería haberse llamado dos veces (al montar y al hacer refresh)
    ${servicePath ? `expect(${mainFunction}).toHaveBeenCalledTimes(2);` : ''}
  });
});
`;

    fs.writeFileSync(testPath, testContent);
    generatedCount++;
    console.log("Generated test for " + file);
  }
}

console.log("\\nDone! Generated " + generatedCount + " test files.");
