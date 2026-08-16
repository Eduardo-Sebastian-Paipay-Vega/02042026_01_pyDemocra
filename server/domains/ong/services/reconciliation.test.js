import {
  parseOfxStatement,
  parseCsvStatement,
  reconcileBankTransactions,
} from "./bank-reconciliation.js";

describe("Modulo M07: Conciliacion Bancaria OFX/CSV (server/services/bank-reconciliation.js)", () => {
  const ofxSample = `
  <OFX>
    <BANKTRANLIST>
      <STMTTRN>
        <TRNTYPE>CREDIT</TRNTYPE>
        <DTPOSTED>20260728</DTPOSTED>
        <TRNAMT>150.00</TRNAMT>
        <FITID>TX100987</FITID>
        <MEMO>Donacion Juan Perez</MEMO>
      </STMTTRN>
    </BANKTRANLIST>
  </OFX>`;

  const csvSample = `Fecha,Monto,Codigo,Descripcion
2026-07-28,250.00,TX200456,Donacion Empresa SAC
2026-07-28,50.00,TX200457,Donacion Anonima`;

  test("parsea extracto bancario en formato OFX correctamente", () => {
    const txs = parseOfxStatement(ofxSample);
    expect(txs.length).toBe(1);
    expect(txs[0].amount).toBe(150.0);
    expect(txs[0].operationCode).toBe("TX100987");
  });

  test("parsea extracto bancario en formato CSV correctamente", () => {
    const txs = parseCsvStatement(csvSample);
    expect(txs.length).toBe(2);
    expect(txs[0].amount).toBe(250.0);
    expect(txs[0].operationCode).toBe("TX200456");
  });

  test("concilia transacciones del banco contra comprobantes del sistema", () => {
    const bankTxs = [
      { amount: 150.0, operationCode: "TX100987", description: "Donacion Juan Perez" },
      { amount: 50.0, operationCode: "TX999999", description: "No registrada" },
    ];

    const systemVouchers = [
      { amount: 150.0, operationCode: "TX100987", donor: "Juan Perez" },
    ];

    const result = reconcileBankTransactions(bankTxs, systemVouchers);

    expect(result.matchedCount).toBe(1);
    expect(result.unmatchedBankCount).toBe(1);
    expect(result.matchRatePercentage).toBe(50);
  });
});
