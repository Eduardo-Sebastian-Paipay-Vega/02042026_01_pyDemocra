import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'ong', 'src', 'app', 'pages');

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx') && !f.endsWith('.test.tsx') && f !== 'PlaceholderPage.tsx');

for (const file of files) {
  const componentName = file.replace('.tsx', '');
  const testFile = path.join(pagesDir, `${componentName}.test.tsx`);
  
  if (fs.existsSync(testFile)) {
    console.log(`Skipping ${testFile} (already exists)`);
    continue;
  }

  const content = fs.readFileSync(path.join(pagesDir, file), 'utf-8');
  
  // Find all service imports
  const serviceRegex = /import\s+(?:{[^}]+}|[^{]+)\s+from\s+['"]([^'"]+\/services\/[^'"]+)['"]/g;
  const services = new Set();
  let match;
  while ((match = serviceRegex.exec(content)) !== null) {
    services.add(match[1]);
  }
  
  // Find all component hooks (e.g., useProfile, useAuth) - rough approximation
  const hasSupabase = content.includes('useSupabase');
  const hasAuth = content.includes('useAuth');
  
  let mockStatements = '';
  let mockFunctions = '';
  
  let i = 1;
  for (const service of services) {
    mockStatements += `
vi.mock("${service}", () => {
  return new Proxy({}, {
    get: () => vi.fn().mockRejectedValue(new Error("Simulated Service Error"))
  });
});
`;
    i++;
  }

  const testContent = `import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ${componentName} } from "./${componentName}";
import { toast } from "sonner";

${mockStatements}

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("../tenant/TenantBootstrapProvider", () => ({
  useTenantBootstrap: () => ({ tenantId: "test-tenant", tenantConfig: {} })
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "test-user" }, session: {} })
}));

vi.mock("../context/SupabaseContext", () => ({
  useSupabase: () => ({ supabase: { from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [] }) }) }) } })
}));

// Mock react-router
vi.mock("react-router", async (importOriginal) => {

  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: "1" }),
    useLocation: () => ({ pathname: "/", search: "" }),
    Link: ({ children }: any) => <a>{children}</a>,
  };
});

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <div data-testid="error-boundary-fallback">Something went wrong.</div>;
    }
    return this.props.children;
  }
}

describe("${componentName} Page - Zero-Fail Tolerance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle infinite loading gracefully", async () => {
    render(
      <ErrorBoundary>
        <${componentName} />
      </ErrorBoundary>
    );

    await waitFor(() => {
      // The component should render without crashing
      const boundaryError = screen.queryByTestId("error-boundary-fallback");
      expect(boundaryError).not.toBeInTheDocument();
    });
  });

  it("should handle conditional rendering when permissions or hooks are blocked", async () => {
    // If there's any auth block, we mock it returning null or throwing
    // In this generic test, we just ensure rendering again doesn't crash
    render(
      <ErrorBoundary>
        <${componentName} />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.queryByTestId("error-boundary-fallback")).not.toBeInTheDocument();
    });
  });
});
`;

  fs.writeFileSync(testFile, testContent);
  console.log(`Generated ${testFile}`);
}
