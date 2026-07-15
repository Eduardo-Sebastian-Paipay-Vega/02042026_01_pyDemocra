import fs from 'fs';

const acePath = 'd:/espelo/ong/src/app/services/ace/ace.service.test.ts';
let ace = fs.readFileSync(acePath, 'utf8');

// Replace all occurrences of rpc mock with nothing, then we'll add it back to the first test
ace = ace.replace(/vi\.mocked\(supabase\.rpc\)\.mockResolvedValueOnce\(\{ data: "tenant-xyz", error: null \}\);\n/g, '');

// Re-add to the first test only
ace = ace.replace(
  /const res = await listAccessLinks\(\{ type: "onboarding", isActive: true \}\);/,
  'vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: "tenant-xyz", error: null });\n      const res = await listAccessLinks({ type: "onboarding", isActive: true });'
);

// Fix the assertions back to true for validate and complete
ace = ace.replace(
  /expect\(res\.valid\)\.toBe\(false\);/,
  'expect(res.valid).toBe(true);'
);
ace = ace.replace(
  /expect\(res\.success\)\.toBe\(false\);/,
  'expect(res.success).toBe(true);'
);

fs.writeFileSync(acePath, ace);
console.log("Fixed ace.service.test.ts cache issue");
