/**
 * Mock reutilizable de un query builder de supabase-js. La forma del
 * resultado resuelto depende de si se llamo .single()/.maybeSingle() en la
 * cadena (fila unica) o no (lista) — igual que el comportamiento real, para
 * poder usar el mismo helper sin importar que metodos encadene cada llamada.
 */
export function createChainableResult({ single, list } = {}) {
  let calledSingle = false;
  const builder = {
    select: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    upsert: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    in: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    order: jest.fn(() => builder),
    single: jest.fn(() => {
      calledSingle = true;
      return builder;
    }),
    maybeSingle: jest.fn(() => {
      calledSingle = true;
      return builder;
    }),
    then: (resolve, reject) =>
      Promise.resolve(calledSingle ? single ?? { data: null, error: null } : list ?? { data: [], error: null }).then(
        resolve,
        reject
      ),
  };
  return builder;
}

/**
 * Crea un serviceClient.from() mock cuyo comportamiento depende del nombre
 * de la tabla consultada. `tableResults` es un mapa tabla -> { single, list }
 * (ver createChainableResult) o una funcion (tabla) => { single, list } para
 * casos donde el resultado deba variar segun el numero de llamada.
 */
export function createServiceClientMock(tableResults = {}) {
  const from = jest.fn((tableName) => {
    const config =
      typeof tableResults === "function" ? tableResults(tableName) : tableResults[tableName];
    return createChainableResult(config || {});
  });

  return { from };
}
