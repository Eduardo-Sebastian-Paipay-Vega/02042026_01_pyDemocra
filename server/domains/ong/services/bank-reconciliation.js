/**
 * Motor de Conciliación Bancaria y Parser de Extractos OFX / CSV (Módulo M07 / RF-045).
 */

/**
 * Parsea un archivo de extracto bancario en formato estándar OFX (Open Financial Exchange).
 *
 * @param {string} ofxText - Contenido del archivo OFX.
 * @returns {Array<Object>} Lista de transacciones bancarias extraídas.
 */
export function parseOfxStatement(ofxText) {
  if (!ofxText || typeof ofxText !== "string") {
    return [];
  }

  const transactions = [];
  const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = trnRegex.exec(ofxText)) !== null) {
    const block = match[1];

    const fitidMatch = block.match(/<FITID>([^\r\n<]+)/i);
    const amountMatch = block.match(/<TRNAMT>([^\r\n<]+)/i);
    const memoMatch = block.match(/<MEMO>([^\r\n<]+)/i) || block.match(/<NAME>([^\r\n<]+)/i);
    const dateMatch = block.match(/<DTPOSTED>([^\r\n<]+)/i);

    if (amountMatch) {
      transactions.push({
        operationCode: fitidMatch ? fitidMatch[1].trim() : `OFX-${Date.now()}-${transactions.length}`,
        amount: parseFloat(amountMatch[1].trim()),
        description: memoMatch ? memoMatch[1].trim() : "Transaccion Bancaria OFX",
        date: dateMatch ? dateMatch[1].trim().substring(0, 8) : new Date().toISOString().substring(0, 10),
        raw: block,
      });
    }
  }

  return transactions;
}

/**
 * Parsea un archivo de extracto bancario en formato CSV (Commas/Semicolons Separated).
 *
 * @param {string} csvText - Contenido del archivo CSV.
 * @returns {Array<Object>} Lista de transacciones bancarias extraídas.
 */
export function parseCsvStatement(csvText) {
  if (!csvText || typeof csvText !== "string") {
    return [];
  }

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const transactions = [];
  // Saltar línea de cabecera si existe
  const startIndex = lines[0].toLowerCase().includes("monto") || lines[0].toLowerCase().includes("amount") ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const columns = line.includes(";") ? line.split(";") : line.split(",");

    if (columns.length >= 3) {
      const date = columns[0].trim().replace(/"/g, "");
      const amountStr = columns[1].trim().replace(/"/g, "").replace(/,/g, ".");
      const amount = parseFloat(amountStr);
      const operationCode = columns[2] ? columns[2].trim().replace(/"/g, "") : `CSV-${i}`;
      const description = columns[3] ? columns[3].trim().replace(/"/g, "") : "Movimiento Bancario CSV";

      if (!isNaN(amount)) {
        transactions.push({
          date,
          amount,
          operationCode,
          description,
        });
      }
    }
  }

  return transactions;
}

/**
 * Cruza y concilia transacciones bancarias contra comprobantes registrados en la BD.
 *
 * @param {Array<Object>} bankTransactions - Lista de transacciones del banco.
 * @param {Array<Object>} recordedVouchers - Lista de comprobantes registrados en el sistema.
 * @returns {Object} Resultado de la conciliación bancaria.
 */
export function reconcileBankTransactions(bankTransactions = [], recordedVouchers = []) {
  const matched = [];
  const unmatchedBank = [];
  const unmatchedSystem = [...recordedVouchers];

  for (const bTx of bankTransactions) {
    const foundIndex = unmatchedSystem.findIndex((voucher) => {
      const sameAmount = Math.abs(Number(voucher.amount) - Number(bTx.amount)) < 0.01;
      const sameOpCode = voucher.operationCode && bTx.operationCode &&
        String(voucher.operationCode).trim().toLowerCase() === String(bTx.operationCode).trim().toLowerCase();
      return sameAmount || sameOpCode;
    });

    if (foundIndex !== -1) {
      const systemVoucher = unmatchedSystem.splice(foundIndex, 1)[0];
      matched.push({
        bankTransaction: bTx,
        systemVoucher,
        status: "CONCILIADO",
      });
    } else {
      unmatchedBank.push(bTx);
    }
  }

  const matchRatePercentage = bankTransactions.length > 0
    ? Math.round((matched.length / bankTransactions.length) * 100 * 100) / 100
    : 100;

  return {
    totalBankTransactions: bankTransactions.length,
    totalSystemVouchers: recordedVouchers.length,
    matchedCount: matched.length,
    unmatchedBankCount: unmatchedBank.length,
    unmatchedSystemCount: unmatchedSystem.length,
    matchRatePercentage,
    matched,
    unmatchedBank,
    unmatchedSystem,
    reconciledAt: new Date().toISOString(),
  };
}
