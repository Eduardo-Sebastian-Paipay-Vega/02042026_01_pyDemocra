import { assertTenantScope, applyTenantScope } from "./tenant-scope.js";

describe("assertTenantScope", () => {
  test("devuelve el tenantId normalizado si es un UUID v4-like valido", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(assertTenantScope(id)).toBe(id);
  });

  test("recorta espacios alrededor de un UUID valido", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(assertTenantScope(`  ${id}  `)).toBe(id);
  });

  test("lanza con errorCode TEN-003 si no es un UUID valido", () => {
    expect(() => assertTenantScope("no-es-un-uuid")).toThrow();
    try {
      assertTenantScope("no-es-un-uuid", "mi-contexto");
    } catch (err) {
      expect(err.errorCode).toBe("TEN-003");
      expect(err.errorType).toBe("tenant");
      expect(err.message).toMatch(/mi-contexto/);
    }
  });

  test("lanza para null/undefined/string vacio", () => {
    expect(() => assertTenantScope(null)).toThrow();
    expect(() => assertTenantScope(undefined)).toThrow();
    expect(() => assertTenantScope("")).toThrow();
  });

  test("usa 'tenant-scope' como contexto por defecto en el mensaje", () => {
    try {
      assertTenantScope("invalido");
    } catch (err) {
      expect(err.message).toMatch(/tenant-scope/);
    }
  });
});

describe("applyTenantScope", () => {
  test("llama .eq con la columna por defecto 'tenant_id' y el tenantId validado", () => {
    const id = "22222222-2222-4222-8222-222222222222";
    const queryBuilder = { eq: jest.fn(() => "resultado-encadenado") };

    const result = applyTenantScope(queryBuilder, id);

    expect(queryBuilder.eq).toHaveBeenCalledWith("tenant_id", id);
    expect(result).toBe("resultado-encadenado");
  });

  test("permite una columna personalizada", () => {
    const id = "33333333-3333-4333-8333-333333333333";
    const queryBuilder = { eq: jest.fn(() => queryBuilder) };

    applyTenantScope(queryBuilder, id, "id");

    expect(queryBuilder.eq).toHaveBeenCalledWith("id", id);
  });

  test("propaga el error de assertTenantScope si el tenantId es invalido", () => {
    const queryBuilder = { eq: jest.fn() };
    expect(() => applyTenantScope(queryBuilder, "invalido")).toThrow();
    expect(queryBuilder.eq).not.toHaveBeenCalled();
  });
});
