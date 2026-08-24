import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { DataTable, type Column } from '@/core/components/shared/DataTable';
import { FilterBar } from '@/core/components/shared/FilterBar';
import { PageHeader } from '@/core/components/shared/PageHeader';
import { GradientButton } from '@/core/components/ui/gradient-button';
import { ModalShell } from '@/core/components/ui/modal-shell';
import { OutlineButton } from '@/core/components/ui/outline-button';
import { StatusDot } from '@/core/components/ui/status-dot';
import { useCategoriaFinancieraDetail } from "../modules/resources/hooks/useCategoriaFinancieraDetail";
import { useCategoriasFinancieras } from "../modules/resources/hooks/useCategoriasFinancieras";
import { useComprobantesFinancieros } from "../modules/resources/hooks/useComprobantesFinancieros";
import { useCuentaFinancieraDetail } from "../modules/resources/hooks/useCuentaFinancieraDetail";
import { useCuentasFinancieras } from "../modules/resources/hooks/useCuentasFinancieras";
import { useReportesFinancieros } from "../modules/resources/hooks/useReportesFinancieros";
import { useTransaccionFinancieraDetail } from "../modules/resources/hooks/useTransaccionFinancieraDetail";
import { useTransaccionesFinancieras } from "../modules/resources/hooks/useTransaccionesFinancieras";
import type { FinancialApprovalKind, FinancialCategoryKind } from "../modules/resources/types";
import { useApadrinamientos } from "../services/recursos/apadrinamientos.service";

const PAGE_SIZE = 20;

type FinanceView = "accounts" | "categories" | "transactions" | "reports" | "sponsorships";

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
      <p className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{message}</p>
      <button type="button" className="rounded-md px-2 py-1 text-[11px] hover:bg-[var(--t-hover)]" style={{ color: "var(--t-text-secondary)" }} onClick={onRetry}>Reintentar</button>
    </div>
  );
}

function SelectField({ value, onChange, options, disabled = false }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; disabled?: boolean; }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="h-9 rounded-xl px-3 text-[12px] outline-none disabled:cursor-not-allowed disabled:opacity-70" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }}>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}>
      <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>{label}</p>
      <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{value || "-"}</p>
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
      <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>{label}</p>
      <p className="mt-1 text-[20px]" style={{ color: "var(--t-text)" }}>{value}</p>
    </div>
  );
}

function formatMoney(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2 }).format(value);
}

function formatNumber(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(value);
}

const accountColumns: Column<any>[] = [
  { key: "name", label: "Cuenta", render: (item) => <div><div style={{ color: "var(--t-text)" }}>{item.name}</div><div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>{item.typeLabel}</div></div> },
  { key: "currency", label: "Moneda", render: (item) => <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{item.currency}</span> },
  { key: "balance", label: "Saldo", render: (item) => <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{formatMoney(item.balance)}</span> },
  { key: "status", label: "Estado", render: (item) => <StatusDot variant={item.statusVariant}>{item.activeLabel}</StatusDot> },
];

const categoryColumns: Column<any>[] = [
  { key: "name", label: "Categoria", render: (item) => <span style={{ color: "var(--t-text)" }}>{item.name}</span> },
  { key: "type", label: "Tipo", render: (item) => <StatusDot variant="info">{item.typeLabel}</StatusDot> },
  { key: "trace", label: "Trazabilidad", render: (item) => <div className="text-[12px]" style={{ color: "var(--t-text-dim)" }}><div>{item.transactionCount} transacciones</div><div>Ultima: {item.lastTransactionAt}</div></div> },
];

const transactionColumns: Column<any>[] = [
  { key: "account", label: "Cuenta / Categoria", render: (item) => <div><div style={{ color: "var(--t-text)" }}>{item.accountName}</div><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>{item.categoryName}</div></div> },
  { key: "type", label: "Tipo", render: (item) => <StatusDot variant={item.statusVariant}>{item.typeName}</StatusDot> },
  { key: "approval", label: "Aprobacion", render: (item) => <div><StatusDot variant={item.approvalVariant}>{item.approvalStateName}</StatusDot><div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>{item.approvalKind === "not-required" ? "No aplica" : item.approvalRequestedAt}</div></div> },
  { key: "amount", label: "Monto", render: (item) => <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{formatMoney(item.amount)}</span> },
  { key: "date", label: "Fecha", render: (item) => <span className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>{item.date}</span> },
  { key: "project", label: "Proyecto", render: (item) => <span className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>{item.projectName}</span> },
];

const reportColumns: Column<any>[] = [
  { key: "date", label: "Fecha", render: (item) => <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{item.date}</span> },
  { key: "account", label: "Cuenta", render: (item) => <span style={{ color: "var(--t-text)" }}>{item.accountName}</span> },
  { key: "category", label: "Categoria", render: (item) => <span className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>{item.categoryName}</span> },
  { key: "type", label: "Tipo", render: (item) => <StatusDot variant={item.statusVariant}>{item.typeName}</StatusDot> },
  { key: "amount", label: "Monto", render: (item) => <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{formatMoney(item.amount)}</span> },
];

export function Finance() {
  const [view, setView] = useState<FinanceView>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") === "sponsorships" ? "sponsorships" : "accounts";
  });
  const [accountsSearch, setAccountsSearch] = useState("");
  const [accountsState, setAccountsState] = useState<"all" | "active" | "inactive">("all");
  const [accountsPage, setAccountsPage] = useState(1);
  const [categoriesSearch, setCategoriesSearch] = useState("");
  const [categoriesType, setCategoriesType] = useState<FinancialCategoryKind | "all">("all");
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [transactionsSearch, setTransactionsSearch] = useState("");
  const [transactionsAccount, setTransactionsAccount] = useState("all");
  const [transactionsCategory, setTransactionsCategory] = useState("all");
  const [transactionsType, setTransactionsType] = useState("all");
  const [transactionsProject, setTransactionsProject] = useState("all");
  const [transactionsApproval, setTransactionsApproval] = useState<FinancialApprovalKind | "all">("all");
  const [transactionsDateFrom, setTransactionsDateFrom] = useState("");
  const [transactionsDateTo, setTransactionsDateTo] = useState("");
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [reportsSearch, setReportsSearch] = useState("");
  const [reportsAccount, setReportsAccount] = useState("all");
  const [reportsCategory, setReportsCategory] = useState("all");
  const [reportsType, setReportsType] = useState("all");
  const [reportsProject, setReportsProject] = useState("all");
  const [reportsApproval, setReportsApproval] = useState<FinancialApprovalKind | "all">("all");
  const [reportsDateFrom, setReportsDateFrom] = useState("");
  const [reportsDateTo, setReportsDateTo] = useState("");
  const [reportsPage, setReportsPage] = useState(1);

  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [accountForm, setAccountForm] = useState({ name: "", typeCode: "", currency: "PEN", balance: "0", active: true });
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountDetailId, setAccountDetailId] = useState<string | null>(null);
  const [accountRemoveTarget, setAccountRemoveTarget] = useState<any | null>(null);

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", type: "ingreso" });
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categoryDetailId, setCategoryDetailId] = useState<string | null>(null);
  const [categoryRemoveTarget, setCategoryRemoveTarget] = useState<any | null>(null);

  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [transactionForm, setTransactionForm] = useState({ accountId: "all", categoryId: "all", typeCode: "ingreso", amount: "", transactionDate: "", description: "", projectId: "all" });
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [transactionDetailId, setTransactionDetailId] = useState<string | null>(null);
  const [transactionRemoveTarget, setTransactionRemoveTarget] = useState<any | null>(null);
  const [approvalResolutionOpen, setApprovalResolutionOpen] = useState(false);
  const [approvalResolutionMode, setApprovalResolutionMode] = useState<"approve" | "reject">("approve");
  const [approvalResolutionTarget, setApprovalResolutionTarget] = useState<any | null>(null);
  const [approvalResolutionComment, setApprovalResolutionComment] = useState("");
  const [approvalResolutionError, setApprovalResolutionError] = useState<string | null>(null);

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptForm, setReceiptForm] = useState({ routeInput: "", fileType: "", file: null as File | null });
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const [sponsorshipSearch, setSponsorshipSearch] = useState("");
  const [sponsorshipFormOpen, setSponsorshipFormOpen] = useState(false);
  const [sponsorshipForm, setSponsorshipForm] = useState({ donor_name: "", donor_email: "", gateway_name: "stripe", subscription_frequency: "monthly", amount: "100" });
  const [sponsorshipError, setSponsorshipError] = useState<string | null>(null);

  const sponsorships = useApadrinamientos(sponsorshipSearch);

  const accounts = useCuentasFinancieras({ searchTerm: accountsSearch, state: accountsState, page: accountsPage, pageSize: PAGE_SIZE });
  const categories = useCategoriasFinancieras({ searchTerm: categoriesSearch, state: "all", type: categoriesType, page: categoriesPage, pageSize: PAGE_SIZE });
  const transactions = useTransaccionesFinancieras({ searchTerm: transactionsSearch, accountId: transactionsAccount, categoryId: transactionsCategory, typeCode: transactionsType, projectId: transactionsProject, approvalKind: transactionsApproval, dateFrom: transactionsDateFrom || null, dateTo: transactionsDateTo || null, includeDeleted: false, page: transactionsPage, pageSize: PAGE_SIZE });
  const reports = useReportesFinancieros({ searchTerm: reportsSearch, accountId: reportsAccount, categoryId: reportsCategory, typeCode: reportsType, projectId: reportsProject, approvalKind: reportsApproval, dateFrom: reportsDateFrom || null, dateTo: reportsDateTo || null, page: reportsPage, pageSize: PAGE_SIZE });
  const accountDetail = useCuentaFinancieraDetail(accountDetailId);
  const categoryDetail = useCategoriaFinancieraDetail(categoryDetailId);
  const transactionDetail = useTransaccionFinancieraDetail(transactionDetailId);
  const receipts = useComprobantesFinancieros(transactionDetailId);

  const transactionAccountOptions = useMemo(() => [{ value: "all", label: "Cuenta: Todas" }, ...transactions.accountOptions], [transactions.accountOptions]);
  const transactionCategoryOptions = useMemo(() => [{ value: "all", label: "Categoria: Todas" }, ...transactions.categoryOptions], [transactions.categoryOptions]);
  const transactionTypeOptions = useMemo(() => [{ value: "all", label: "Tipo: Todos" }, ...transactions.typeOptions.map((item) => ({ value: item.value, label: item.label }))], [transactions.typeOptions]);
  const transactionProjectOptions = useMemo(() => [{ value: "all", label: "Proyecto: Todos" }, ...transactions.projectOptions], [transactions.projectOptions]);
  const transactionApprovalOptions = useMemo(() => [{ value: "all", label: "Aprobacion: Todas" }, ...transactions.approvalOptions], [transactions.approvalOptions]);

  function openApprovalResolution(target: any, mode: "approve" | "reject") {
    if (!target || target.approvalKind === "not-required") {
      toast.error("Solo los egresos requieren aprobacion financiera.");
      return;
    }

    setApprovalResolutionTarget(target);
    setApprovalResolutionMode(mode);
    setApprovalResolutionComment(target.approvalComment ?? "");
    setApprovalResolutionError(null);
    setApprovalResolutionOpen(true);
  }

  function downloadCsv(content: string, fileName: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  function printPdf() {
    const rows = reports.rows as Array<{ date: string; accountName: string; categoryName: string; typeName: string; amount: number | null }>;
    const totals = reports.totals;
    const formatAmt = (v: number | null) =>
      v === null || Number.isNaN(v) ? "-" : new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2 }).format(v);

    const tableRows = rows
      .map(
        (r) =>
          `<tr><td>${r.date}</td><td>${r.accountName}</td><td>${r.categoryName}</td><td>${r.typeName}</td><td style="text-align:right">${formatAmt(r.amount)}</td></tr>`
      )
      .join("");

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Reporte financiero</title>
<style>
  body{font-family:sans-serif;font-size:12px;color:#111;padding:24px}
  h1{font-size:16px;margin-bottom:4px}p{color:#555;margin-bottom:16px}
  table{width:100%;border-collapse:collapse}
  th,td{border:1px solid #ddd;padding:6px 10px;text-align:left}
  th{background:#f4f4f4;font-weight:600}
  tfoot td{font-weight:600;background:#f9f9f9}
  @media print{button{display:none}}
</style></head><body>
<h1>Reporte financiero</h1>
<p>Generado el ${new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}</p>
<table>
  <thead><tr><th>Fecha</th><th>Cuenta</th><th>Categoria</th><th>Tipo</th><th>Monto</th></tr></thead>
  <tbody>${tableRows}</tbody>
  <tfoot>
    <tr><td colspan="4">Ingresos</td><td style="text-align:right">${formatAmt(totals.totalIncome)}</td></tr>
    <tr><td colspan="4">Egresos</td><td style="text-align:right">${formatAmt(totals.totalExpense)}</td></tr>
    <tr><td colspan="4">Neto</td><td style="text-align:right">${formatAmt(totals.net)}</td></tr>
  </tfoot>
</table>
</body></html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Recursos - Finanzas" description="Administra cuentas, categorías, transacciones, aprobaciones y comprobantes financieros del tenant." action={{ label: "Refrescar", onClick: () => { accounts.refresh(); categories.refresh(); transactions.refresh(); reports.refresh(); } }} />
      <div className="flex flex-wrap gap-2">
        {view === "accounts" ? <GradientButton size="sm" onClick={() => setView("accounts")}>Cuentas</GradientButton> : <OutlineButton size="sm" onClick={() => setView("accounts")}>Cuentas</OutlineButton>}
        {view === "categories" ? <GradientButton size="sm" onClick={() => setView("categories")}>Categorías</GradientButton> : <OutlineButton size="sm" onClick={() => setView("categories")}>Categorías</OutlineButton>}
        {view === "transactions" ? <GradientButton size="sm" onClick={() => setView("transactions")}>Transacciones</GradientButton> : <OutlineButton size="sm" onClick={() => setView("transactions")}>Transacciones</OutlineButton>}
        {view === "reports" ? <GradientButton size="sm" onClick={() => setView("reports")}>Reportes</GradientButton> : <OutlineButton size="sm" onClick={() => setView("reports")}>Reportes</OutlineButton>}
        {view === "sponsorships" ? <GradientButton size="sm" onClick={() => setView("sponsorships")}>Apadrinamientos & Pasarelas</GradientButton> : <OutlineButton size="sm" onClick={() => setView("sponsorships")}>Apadrinamientos & Pasarelas</OutlineButton>}
      </div>

      {view === "accounts" && (
        <>
          <FilterBar
            searchPlaceholder="Buscar cuenta..."
            searchValue={accountsSearch}
            onSearchChange={(value) => { setAccountsSearch(value); setAccountsPage(1); }}
            filters={[
              { label: "Todas", value: "all", active: accountsState === "all" },
              { label: "Activas", value: "active", active: accountsState === "active" },
              { label: "Inactivas", value: "inactive", active: accountsState === "inactive" },
            ]}
            onFilterClick={(value) => { setAccountsState(value as "all" | "active" | "inactive"); setAccountsPage(1); }}
          />
          {accounts.error && <ErrorBlock message={accounts.error} onRetry={accounts.refresh} />}
          {accounts.warnings.length > 0 && <ErrorBlock message={accounts.warnings.join(" ")} onRetry={accounts.refresh} />}
          <DataTable columns={accountColumns} data={accounts.rows} loading={accounts.loading} emptyMessage="No se encontraron cuentas." actions={[
            { label: "Ver detalle", onClick: (row) => setAccountDetailId(row.id) },
            { label: "Editar", onClick: (row) => { setEditingAccount(row); setAccountForm({ name: row.name, typeCode: row.typeCode, currency: row.currency, balance: String(row.balance), active: row.active }); setAccountError(null); setAccountFormOpen(true); } },
            { label: "Inactivar", onClick: (row) => setAccountRemoveTarget(row), variant: "destructive" },
          ]} />
          <div className="flex justify-between rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>{(accounts.total === 0 ? 0 : (accountsPage - 1) * PAGE_SIZE + 1)}-{Math.min(accounts.total, accountsPage * PAGE_SIZE)} de {accounts.total}</p>
            <div className="flex gap-2">
              <OutlineButton size="sm" onClick={() => setAccountsPage((current) => current - 1)} disabled={accountsPage <= 1}>Anterior</OutlineButton>
              <OutlineButton size="sm" onClick={() => setAccountsPage((current) => current + 1)} disabled={accountsPage * PAGE_SIZE >= accounts.total}>Siguiente</OutlineButton>
            </div>
          </div>
          <GradientButton size="sm" onClick={() => { setEditingAccount(null); setAccountForm({ name: "", typeCode: accounts.accountTypeOptions[0]?.value ?? "", currency: accounts.currencyOptions[0]?.value ?? "PEN", balance: "0", active: true }); setAccountError(null); setAccountFormOpen(true); }}>Nueva cuenta</GradientButton>
        </>
      )}

      {view === "categories" && (
        <>
          <FilterBar
            searchPlaceholder="Buscar categoria..."
            searchValue={categoriesSearch}
            onSearchChange={(value) => { setCategoriesSearch(value); setCategoriesPage(1); }}
            filters={[
              { label: "Todas", value: "all", active: categoriesType === "all" },
              { label: "Ingreso", value: "ingreso", active: categoriesType === "ingreso" },
              { label: "Egreso", value: "egreso", active: categoriesType === "egreso" },
            ]}
            onFilterClick={(value) => { setCategoriesType(value as FinancialCategoryKind | "all"); setCategoriesPage(1); }}
          />
          {categories.error && <ErrorBlock message={categories.error} onRetry={categories.refresh} />}
          <DataTable columns={categoryColumns} data={categories.rows} loading={categories.loading} emptyMessage="No se encontraron categorias." actions={[
            { label: "Ver detalle", onClick: (row) => setCategoryDetailId(row.id) },
            { label: "Editar", onClick: (row) => { setEditingCategory(row); setCategoryForm({ name: row.name, type: row.typeKind === "egreso" ? "egreso" : "ingreso" }); setCategoryError(null); setCategoryFormOpen(true); } },
            { label: "Eliminar", onClick: (row) => setCategoryRemoveTarget(row), variant: "destructive" },
          ]} />
          <div className="flex justify-between rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>{(categories.total === 0 ? 0 : (categoriesPage - 1) * PAGE_SIZE + 1)}-{Math.min(categories.total, categoriesPage * PAGE_SIZE)} de {categories.total}</p>
            <div className="flex gap-2">
              <OutlineButton size="sm" onClick={() => setCategoriesPage((current) => current - 1)} disabled={categoriesPage <= 1}>Anterior</OutlineButton>
              <OutlineButton size="sm" onClick={() => setCategoriesPage((current) => current + 1)} disabled={categoriesPage * PAGE_SIZE >= categories.total}>Siguiente</OutlineButton>
            </div>
          </div>
          <GradientButton size="sm" onClick={() => { setEditingCategory(null); setCategoryForm({ name: "", type: "ingreso" }); setCategoryError(null); setCategoryFormOpen(true); }}>Nueva categoria</GradientButton>
        </>
      )}

      {view === "transactions" && (
        <>
          <FilterBar searchPlaceholder="Buscar transaccion..." searchValue={transactionsSearch} onSearchChange={(value) => { setTransactionsSearch(value); setTransactionsPage(1); }} filters={[]} />
          <div className="flex flex-wrap gap-2">
            <SelectField value={transactionsAccount} onChange={(value) => { setTransactionsAccount(value); setTransactionsPage(1); }} options={transactionAccountOptions} />
            <SelectField value={transactionsCategory} onChange={(value) => { setTransactionsCategory(value); setTransactionsPage(1); }} options={transactionCategoryOptions} />
            <SelectField value={transactionsType} onChange={(value) => { setTransactionsType(value); setTransactionsPage(1); }} options={transactionTypeOptions} />
            <SelectField value={transactionsProject} onChange={(value) => { setTransactionsProject(value); setTransactionsPage(1); }} options={transactionProjectOptions} />
            <SelectField value={transactionsApproval} onChange={(value) => { setTransactionsApproval(value as FinancialApprovalKind | "all"); setTransactionsPage(1); }} options={transactionApprovalOptions} />
            <input type="date" value={transactionsDateFrom} onChange={(event) => { setTransactionsDateFrom(event.target.value); setTransactionsPage(1); }} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            <input type="date" value={transactionsDateTo} onChange={(event) => { setTransactionsDateTo(event.target.value); setTransactionsPage(1); }} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          </div>
          {transactions.error && <ErrorBlock message={transactions.error} onRetry={transactions.refresh} />}
          {transactions.warnings.length > 0 && <ErrorBlock message={transactions.warnings.join(" ")} onRetry={transactions.refresh} />}
          <DataTable columns={transactionColumns} data={transactions.rows} loading={transactions.loading} emptyMessage="No se encontraron transacciones." actions={[
            { label: "Ver detalle", onClick: (row) => setTransactionDetailId(row.id) },
            { label: "Editar", onClick: (row) => { setEditingTransaction(row); setTransactionForm({ accountId: row.accountId, categoryId: row.categoryId, typeCode: row.typeCode, amount: String(row.amount), transactionDate: row.rawDate, description: row.description, projectId: row.projectId ?? "all" }); setTransactionError(null); setTransactionFormOpen(true); } },
            { label: "Aprobar", onClick: (row) => openApprovalResolution(row, "approve") },
            { label: "Rechazar", onClick: (row) => openApprovalResolution(row, "reject"), variant: "destructive" },
            { label: "Eliminar", onClick: (row) => setTransactionRemoveTarget(row), variant: "destructive" },
          ]} />
          <div className="flex justify-between rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>{(transactions.total === 0 ? 0 : (transactionsPage - 1) * PAGE_SIZE + 1)}-{Math.min(transactions.total, transactionsPage * PAGE_SIZE)} de {transactions.total}</p>
            <div className="flex gap-2">
              <OutlineButton size="sm" onClick={() => setTransactionsPage((current) => current - 1)} disabled={transactionsPage <= 1}>Anterior</OutlineButton>
              <OutlineButton size="sm" onClick={() => setTransactionsPage((current) => current + 1)} disabled={transactionsPage * PAGE_SIZE >= transactions.total}>Siguiente</OutlineButton>
            </div>
          </div>
          <GradientButton size="sm" onClick={() => { setEditingTransaction(null); setTransactionForm({ accountId: "all", categoryId: "all", typeCode: "ingreso", amount: "", transactionDate: "", description: "", projectId: "all" }); setTransactionError(null); setTransactionFormOpen(true); }}>Nueva transaccion</GradientButton>
        </>
      )}

      {view === "reports" && (
        <>
          <FilterBar searchPlaceholder="Buscar en reporte..." searchValue={reportsSearch} onSearchChange={(value) => { setReportsSearch(value); setReportsPage(1); }} filters={[]} />
          <div className="flex flex-wrap gap-2">
            <SelectField value={reportsAccount} onChange={(value) => { setReportsAccount(value); setReportsPage(1); }} options={transactionAccountOptions} />
            <SelectField value={reportsCategory} onChange={(value) => { setReportsCategory(value); setReportsPage(1); }} options={transactionCategoryOptions} />
            <SelectField value={reportsType} onChange={(value) => { setReportsType(value); setReportsPage(1); }} options={transactionTypeOptions} />
            <SelectField value={reportsProject} onChange={(value) => { setReportsProject(value); setReportsPage(1); }} options={transactionProjectOptions} />
            <SelectField value={reportsApproval} onChange={(value) => { setReportsApproval(value as FinancialApprovalKind | "all"); setReportsPage(1); }} options={transactionApprovalOptions} />
            <input type="date" value={reportsDateFrom} onChange={(event) => { setReportsDateFrom(event.target.value); setReportsPage(1); }} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            <input type="date" value={reportsDateTo} onChange={(event) => { setReportsDateTo(event.target.value); setReportsPage(1); }} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            <GradientButton size="sm" onClick={async () => { const file = await reports.exportCsv(); if (!file) return; downloadCsv(file.content, file.fileName, file.mimeType); }} disabled={reports.isExporting}>{reports.isExporting ? "Exportando..." : "Exportar CSV"}</GradientButton>
            <OutlineButton size="sm" onClick={printPdf} disabled={reports.loading || reports.rows.length === 0}>Exportar PDF</OutlineButton>
          </div>
          {reports.error && <ErrorBlock message={reports.error} onRetry={reports.refresh} />}
          <div className="grid gap-3 md:grid-cols-4">
            <SummaryField label="Ingresos" value={formatMoney(reports.totals.totalIncome)} />
            <SummaryField label="Egresos" value={formatMoney(reports.totals.totalExpense)} />
            <SummaryField label="Neto" value={formatMoney(reports.totals.net)} />
            <SummaryField label="Transacciones" value={String(reports.totals.transactionCount)} />
          </div>
          <DataTable columns={reportColumns} data={reports.rows} loading={reports.loading} emptyMessage="No hay transacciones para el reporte." />
          <div className="flex justify-between rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>{(reports.total === 0 ? 0 : (reportsPage - 1) * PAGE_SIZE + 1)}-{Math.min(reports.total, reportsPage * PAGE_SIZE)} de {reports.total}</p>
            <div className="flex gap-2">
              <OutlineButton size="sm" onClick={() => setReportsPage((current) => current - 1)} disabled={reportsPage <= 1}>Anterior</OutlineButton>
              <OutlineButton size="sm" onClick={() => setReportsPage((current) => current + 1)} disabled={reportsPage * PAGE_SIZE >= reports.total}>Siguiente</OutlineButton>
            </div>
          </div>
        </>
      )}

      {view === "sponsorships" && (
        <>
          <FilterBar
            searchPlaceholder="Buscar por donante o pasarela..."
            searchValue={sponsorshipSearch}
            onSearchChange={(val) => setSponsorshipSearch(val)}
            filters={[]}
          />
          {sponsorships.error && <ErrorBlock message={sponsorships.error} onRetry={sponsorships.refresh} />}

          <div className="grid gap-3 md:grid-cols-4">
            <SummaryField label="Apadrinamientos Registrados" value={String(sponsorships.subscriptions.length)} />
            <SummaryField label="Recaudación Recurrente Total" value={formatMoney(sponsorships.subscriptions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0))} />
            <SummaryField label="Pasarelas Conectadas" value="Stripe, Culqi, MP" />
            <SummaryField label="Verificación Webhook" value="HMAC-SHA256 Activa" />
          </div>

          <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
            <h3 className="text-[14px] font-medium" style={{ color: "var(--t-text)" }}>Adaptadores de Pago & Webhooks Salientes (M14 / RF-088 - RF-095)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl p-3" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[13px]" style={{ color: "var(--t-text)" }}>Stripe SDK</span>
                  <StatusDot variant="success">Conectado</StatusDot>
                </div>
                <p className="text-[11px] mt-1" style={{ color: "var(--t-text-dim)" }}>Cobro único y suscripciones recurrentes internacionales.</p>
              </div>

              <div className="rounded-xl p-3" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[13px]" style={{ color: "var(--t-text)" }}>Culqi</span>
                  <StatusDot variant="success">Conectado</StatusDot>
                </div>
                <p className="text-[11px] mt-1" style={{ color: "var(--t-text-dim)" }}>Pasarela peruana para tarjetas de crédito/débito locales.</p>
              </div>

              <div className="rounded-xl p-3" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[13px]" style={{ color: "var(--t-text)" }}>MercadoPago</span>
                  <StatusDot variant="success">Conectado</StatusDot>
                </div>
                <p className="text-[11px] mt-1" style={{ color: "var(--t-text-dim)" }}>Checkout transparente y billeteras digitales (Yape/Plin).</p>
              </div>
            </div>
          </div>

          <DataTable
            columns={[
              { key: "donor", label: "Donante", render: (item) => <div><div style={{ color: "var(--t-text)" }}>{item.donor_name}</div><div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>{item.donor_email}</div></div> },
              { key: "gateway", label: "Pasarela", render: (item) => <StatusDot variant="info">{item.gateway_name}</StatusDot> },
              { key: "type", label: "Frecuencia", render: (item) => <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{item.subscription_frequency}</span> },
              { key: "amount", label: "Monto", render: (item) => <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{formatMoney(item.amount)}</span> },
      // @ts-ignore
      // @ts-ignore
              { key: "status", label: "Estado BD", render: (item) => <StatusDot variant={item.status === "active" ? "success" : "neutral"}>{item.status}</StatusDot> },
            ]}
            data={sponsorships.subscriptions}
            loading={sponsorships.loading}
            emptyMessage="No hay registros de apadrinamiento en la base de datos Supabase. Haz clic en 'Nuevo apadrinamiento' para agregar uno."
          />

          <div className="flex gap-2">
            <GradientButton size="sm" onClick={() => { setSponsorshipForm({ donor_name: "", donor_email: "", gateway_name: "stripe", subscription_frequency: "monthly", amount: "100" }); setSponsorshipError(null); setSponsorshipFormOpen(true); }}>
              Nuevo apadrinamiento (BD)
            </GradientButton>
          </div>
        </>
      )}
      <ModalShell open={accountFormOpen} onClose={() => setAccountFormOpen(false)} width="max-w-[760px]">
        <div className="flex items-start justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
          <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>{editingAccount ? "Editar cuenta" : "Nueva cuenta"}</h3>
          <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={() => setAccountFormOpen(false)}>X</button>
        </div>
        <div className="space-y-3 p-4">
          {accountError && <ErrorBlock message={accountError} onRetry={() => setAccountError(null)} />}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input value={accountForm.name} onChange={(event) => setAccountForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre de cuenta" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            <SelectField value={accountForm.typeCode} onChange={(value) => setAccountForm((current) => ({ ...current, typeCode: value }))} options={[{ value: "", label: "Selecciona tipo de cuenta" }, ...accounts.accountTypeOptions]} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SelectField value={accountForm.currency} onChange={(value) => setAccountForm((current) => ({ ...current, currency: value }))} options={accounts.currencyOptions.length ? accounts.currencyOptions : [{ value: "PEN", label: "PEN" }]} />
            <input type="number" value={accountForm.balance} onChange={(event) => setAccountForm((current) => ({ ...current, balance: event.target.value }))} placeholder="Saldo actual" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          </div>
          <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}><input type="checkbox" checked={accountForm.active} onChange={(event) => setAccountForm((current) => ({ ...current, active: event.target.checked }))} />Cuenta activa</label>
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={async () => {
              if (!accountForm.name.trim() || !accountForm.typeCode.trim()) { setAccountError("Nombre y tipo de cuenta son obligatorios."); return; }
              try {
                if (editingAccount) await accounts.update({ accountId: editingAccount.id, name: accountForm.name.trim(), typeCode: accountForm.typeCode.trim(), currency: accountForm.currency, balance: Number(accountForm.balance || 0), active: accountForm.active });
                else await accounts.create({ name: accountForm.name.trim(), typeCode: accountForm.typeCode.trim(), currency: accountForm.currency, balance: Number(accountForm.balance || 0), active: accountForm.active });
                toast.success(editingAccount ? "Cuenta actualizada." : "Cuenta registrada.");
                setAccountFormOpen(false);
              } catch (error) {
                setAccountError(error instanceof Error ? error.message : "No se pudo guardar la cuenta.");
              }
            }} disabled={accounts.isCreating || accounts.isUpdating}>{accounts.isCreating || accounts.isUpdating ? "Guardando..." : "Guardar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setAccountFormOpen(false)} disabled={accounts.isCreating || accounts.isUpdating}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={Boolean(accountDetailId)} onClose={() => setAccountDetailId(null)} width="max-w-[880px]">
        <div className="space-y-3 p-4">
          {accountDetail.loading && <p className="text-[12px]">Cargando detalle...</p>}
          {accountDetail.error && <ErrorBlock message={accountDetail.error} onRetry={accountDetail.refresh} />}
          {accountDetail.detail && (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DetailField label="Cuenta" value={accountDetail.detail.account.name} />
                <DetailField label="Tipo" value={accountDetail.detail.account.typeLabel} />
                <DetailField label="Moneda" value={accountDetail.detail.account.currency} />
                <DetailField label="Saldo" value={formatMoney(accountDetail.detail.account.balance)} />
                <DetailField label="Transacciones" value={String(accountDetail.detail.account.transactionCount)} />
                <DetailField label="Ultima transaccion" value={accountDetail.detail.account.lastTransactionAt} />
              </div>
              <DataTable columns={transactionColumns} data={accountDetail.detail.latestTransactions} emptyMessage="Sin transacciones recientes." />
            </>
          )}
        </div>
      </ModalShell>

      <ModalShell open={Boolean(accountRemoveTarget)} onClose={() => setAccountRemoveTarget(null)} width="max-w-[520px]">
        <div className="space-y-3 p-4">
          <p className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>{accountRemoveTarget ? `Inactivar la cuenta ${accountRemoveTarget.name}?` : "Confirma la inactivacion."}</p>
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={async () => { if (!accountRemoveTarget) return; await accounts.remove(accountRemoveTarget.id); toast.success("Cuenta inactivada."); setAccountRemoveTarget(null); }} disabled={accounts.isRemoving}>{accounts.isRemoving ? "Guardando..." : "Confirmar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setAccountRemoveTarget(null)} disabled={accounts.isRemoving}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={categoryFormOpen} onClose={() => setCategoryFormOpen(false)} width="max-w-[620px]">
        <div className="flex items-start justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
          <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>{editingCategory ? "Editar categoria" : "Nueva categoria"}</h3>
          <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={() => setCategoryFormOpen(false)}>X</button>
        </div>
        <div className="space-y-3 p-4">
          {categoryError && <ErrorBlock message={categoryError} onRetry={() => setCategoryError(null)} />}
          <input value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre de categoria" className="h-9 w-full rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          <SelectField value={categoryForm.type} onChange={(value) => setCategoryForm((current) => ({ ...current, type: value }))} options={[{ value: "ingreso", label: "Ingreso" }, { value: "egreso", label: "Egreso" }]} />
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={async () => {
              if (!categoryForm.name.trim()) { setCategoryError("El nombre de la categoria es obligatorio."); return; }
              try {
                if (editingCategory) await categories.update({ categoryId: editingCategory.id, name: categoryForm.name.trim(), type: categoryForm.type });
                else await categories.create({ name: categoryForm.name.trim(), type: categoryForm.type });
                toast.success(editingCategory ? "Categoria actualizada." : "Categoria registrada.");
                setCategoryFormOpen(false);
              } catch (error) {
                setCategoryError(error instanceof Error ? error.message : "No se pudo guardar la categoria.");
              }
            }} disabled={categories.isCreating || categories.isUpdating}>{categories.isCreating || categories.isUpdating ? "Guardando..." : "Guardar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setCategoryFormOpen(false)} disabled={categories.isCreating || categories.isUpdating}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={Boolean(categoryDetailId)} onClose={() => setCategoryDetailId(null)} width="max-w-[880px]">
        <div className="space-y-3 p-4">
          {categoryDetail.loading && <p className="text-[12px]">Cargando detalle...</p>}
          {categoryDetail.error && <ErrorBlock message={categoryDetail.error} onRetry={categoryDetail.refresh} />}
          {categoryDetail.detail && (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DetailField label="Categoria" value={categoryDetail.detail.category.name} />
                <DetailField label="Tipo" value={categoryDetail.detail.category.typeLabel} />
              </div>
              <DataTable columns={transactionColumns} data={categoryDetail.detail.latestTransactions} emptyMessage="Sin transacciones recientes." />
            </>
          )}
        </div>
      </ModalShell>

      <ModalShell open={Boolean(categoryRemoveTarget)} onClose={() => setCategoryRemoveTarget(null)} width="max-w-[520px]">
        <div className="space-y-3 p-4">
          <p className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>{categoryRemoveTarget ? `Eliminar la categoria ${categoryRemoveTarget.name}?` : "Confirma la eliminacion."}</p>
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={async () => { if (!categoryRemoveTarget) return; await categories.remove(categoryRemoveTarget.id); toast.success("Categoria eliminada."); setCategoryRemoveTarget(null); }} disabled={categories.isRemoving}>{categories.isRemoving ? "Eliminando..." : "Confirmar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setCategoryRemoveTarget(null)} disabled={categories.isRemoving}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>
      <ModalShell open={transactionFormOpen} onClose={() => setTransactionFormOpen(false)} width="max-w-[860px]">
        <div className="flex items-start justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
          <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>{editingTransaction ? "Editar transaccion" : "Nueva transaccion"}</h3>
          <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={() => setTransactionFormOpen(false)}>X</button>
        </div>
        <div className="space-y-3 p-4">
          {transactionError && <ErrorBlock message={transactionError} onRetry={() => setTransactionError(null)} />}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SelectField value={transactionForm.accountId} onChange={(value) => setTransactionForm((current) => ({ ...current, accountId: value }))} options={[{ value: "all", label: "Selecciona cuenta" }, ...transactions.accountOptions]} />
            <SelectField value={transactionForm.categoryId} onChange={(value) => setTransactionForm((current) => ({ ...current, categoryId: value }))} options={[{ value: "all", label: "Selecciona categoria" }, ...transactions.categoryOptions]} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SelectField value={transactionForm.typeCode} onChange={(value) => setTransactionForm((current) => ({ ...current, typeCode: value }))} options={[{ value: "ingreso", label: "Ingreso" }, { value: "egreso", label: "Egreso" }]} />
            <input type="number" min="0.01" step="0.01" value={transactionForm.amount} onChange={(event) => setTransactionForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Monto" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input type="date" value={transactionForm.transactionDate} onChange={(event) => setTransactionForm((current) => ({ ...current, transactionDate: event.target.value }))} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            <SelectField value={transactionForm.projectId} onChange={(value) => setTransactionForm((current) => ({ ...current, projectId: value }))} options={[{ value: "all", label: "Proyecto (opcional)" }, ...transactions.projectOptions]} disabled={!transactions.support.projectLink} />
          </div>
          <textarea value={transactionForm.description} onChange={(event) => setTransactionForm((current) => ({ ...current, description: event.target.value }))} rows={4} placeholder="Descripcion" className="w-full rounded-xl px-3 py-2 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={async () => {
              if (transactionForm.accountId === "all" || transactionForm.categoryId === "all" || !transactionForm.amount) { setTransactionError("Cuenta, categoria y monto son obligatorios."); return; }
              try {
                const payload = { accountId: transactionForm.accountId, categoryId: transactionForm.categoryId, typeCode: transactionForm.typeCode, amount: Number(transactionForm.amount), transactionDate: transactionForm.transactionDate || null, description: transactionForm.description || null, projectId: transactionForm.projectId === "all" ? null : transactionForm.projectId };
                if (editingTransaction) await transactions.update({ transactionId: editingTransaction.id, ...payload });
                else await transactions.create(payload);
                toast.success(editingTransaction ? "Transaccion actualizada." : "Transaccion registrada.");
                setTransactionFormOpen(false);
              } catch (error) {
                setTransactionError(error instanceof Error ? error.message : "No se pudo guardar la transaccion.");
              }
            }} disabled={transactions.isCreating || transactions.isUpdating}>{transactions.isCreating || transactions.isUpdating ? "Guardando..." : "Guardar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setTransactionFormOpen(false)} disabled={transactions.isCreating || transactions.isUpdating}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={Boolean(transactionDetailId)} onClose={() => setTransactionDetailId(null)} width="max-w-[960px]">
        <div className="space-y-3 p-4">
          {transactionDetail.loading && <p className="text-[12px]">Cargando detalle...</p>}
          {transactionDetail.error && <ErrorBlock message={transactionDetail.error} onRetry={transactionDetail.refresh} />}
          {transactionDetail.detail && (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DetailField label="Cuenta" value={transactionDetail.detail.transaction.accountName} />
                <DetailField label="Categoria" value={transactionDetail.detail.transaction.categoryName} />
                <DetailField label="Tipo" value={transactionDetail.detail.transaction.typeName} />
                <DetailField label="Monto" value={formatMoney(transactionDetail.detail.transaction.amount)} />
                <DetailField label="Fecha" value={transactionDetail.detail.transaction.date} />
                <DetailField label="Proyecto" value={transactionDetail.detail.transaction.projectName} />
                <DetailField label="Registrado por" value={transactionDetail.detail.transaction.registeredBy} />
                <DetailField label="Descripcion" value={transactionDetail.detail.transaction.description || "-"} />
                <DetailField label="Estado aprobacion" value={transactionDetail.detail.transaction.approvalStateName} />
                <DetailField label="Solicitado por" value={transactionDetail.detail.transaction.approvalRequestedBy} />
                <DetailField label="Solicitado el" value={transactionDetail.detail.transaction.approvalRequestedAt} />
                <DetailField label="Resuelto por" value={transactionDetail.detail.transaction.approvalResolvedBy} />
                <DetailField label="Resuelto el" value={transactionDetail.detail.transaction.approvalResolvedAt} />
                <DetailField label="Comentario aprobacion" value={transactionDetail.detail.transaction.approvalComment || "-"} />
              </div>
              {transactionDetail.detail.transaction.approvalKind !== "not-required" && (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
                  <StatusDot variant={transactionDetail.detail.transaction.approvalVariant}>{transactionDetail.detail.transaction.approvalStateName}</StatusDot>
                  <OutlineButton size="sm" onClick={() => openApprovalResolution(transactionDetail.detail?.transaction, "approve")} disabled={transactions.isResolving}>Aprobar</OutlineButton>
                  <OutlineButton size="sm" onClick={() => openApprovalResolution(transactionDetail.detail?.transaction, "reject")} disabled={transactions.isResolving}>Rechazar</OutlineButton>
                </div>
              )}
              <div className="rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
                <div className="flex items-center justify-between">
                  <p className="text-[12px]" style={{ color: "var(--t-text)" }}>Comprobantes</p>
                  <OutlineButton size="sm" onClick={() => { setReceiptForm({ routeInput: "", fileType: "", file: null }); setReceiptError(null); setReceiptOpen(true); }}>Adjuntar</OutlineButton>
                </div>
                {receipts.error && <div className="mt-2"><ErrorBlock message={receipts.error} onRetry={receipts.refresh} /></div>}
                {!receipts.loading && receipts.rows.length === 0 && <p className="mt-2 text-[12px]" style={{ color: "var(--t-text-dim)" }}>Sin comprobantes adjuntos.</p>}
                <div className="mt-2 space-y-2">
                  {receipts.rows.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: "var(--t-hover)", border: "1px solid var(--t-border)" }}>
                      <div className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>
                        <div>{item.route}</div>
                        <div style={{ color: "var(--t-text-dim)" }}>{item.fileType} - {item.uploadedAt}</div>
                      </div>
                      <OutlineButton size="sm" onClick={async () => { await receipts.remove(item.id); toast.success("Comprobante eliminado."); }} disabled={receipts.isRemoving}>Quitar</OutlineButton>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ModalShell>

      <ModalShell open={Boolean(transactionRemoveTarget)} onClose={() => setTransactionRemoveTarget(null)} width="max-w-[520px]">
        <div className="space-y-3 p-4">
          <p className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>{transactionRemoveTarget ? `Eliminar definitivamente la transaccion ${transactionRemoveTarget.id}?` : "Confirma la eliminacion definitiva."}</p>
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={async () => { if (!transactionRemoveTarget) return; await transactions.remove({ transactionId: transactionRemoveTarget.id }); toast.success("Transaccion eliminada."); setTransactionRemoveTarget(null); }} disabled={transactions.isRemoving}>{transactions.isRemoving ? "Eliminando..." : "Confirmar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setTransactionRemoveTarget(null)} disabled={transactions.isRemoving}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={approvalResolutionOpen} onClose={() => setApprovalResolutionOpen(false)} width="max-w-[640px]">
        <div className="space-y-3 p-4">
          {approvalResolutionError && <ErrorBlock message={approvalResolutionError} onRetry={() => setApprovalResolutionError(null)} />}
          <div className="rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>Transaccion</p>
            <p className="mt-1 text-[13px]" style={{ color: "var(--t-text)" }}>{approvalResolutionTarget?.accountName ?? "-"} / {approvalResolutionTarget?.categoryName ?? "-"}</p>
            <p className="mt-1 text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{approvalResolutionTarget?.date ?? "-"} · {approvalResolutionTarget ? formatMoney(approvalResolutionTarget.amount) : "-"}</p>
          </div>
          <div className="rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>Accion</p>
            <StatusDot variant={approvalResolutionMode === "approve" ? "success" : "destructive"}>{approvalResolutionMode === "approve" ? "Aprobar egreso" : "Rechazar egreso"}</StatusDot>
          </div>
          <textarea value={approvalResolutionComment} onChange={(event) => setApprovalResolutionComment(event.target.value)} rows={4} placeholder={approvalResolutionMode === "approve" ? "Comentario opcional de aprobacion" : "Motivo del rechazo"} className="w-full rounded-xl px-3 py-2 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={async () => {
              if (!approvalResolutionTarget) return;
              if (approvalResolutionMode === "reject" && !approvalResolutionComment.trim()) { setApprovalResolutionError("El rechazo requiere un comentario."); return; }
              try {
                if (approvalResolutionMode === "approve") await transactions.approve({ transactionId: approvalResolutionTarget.id, comment: approvalResolutionComment.trim() || null });
                else await transactions.reject({ transactionId: approvalResolutionTarget.id, comment: approvalResolutionComment.trim() || null });
                if (transactionDetailId === approvalResolutionTarget.id) transactionDetail.refresh();
                if (accountDetailId) accountDetail.refresh();
                if (categoryDetailId) categoryDetail.refresh();
                toast.success(approvalResolutionMode === "approve" ? "Transaccion aprobada." : "Transaccion rechazada.");
                setApprovalResolutionOpen(false);
              } catch (error) {
                setApprovalResolutionError(error instanceof Error ? error.message : "No se pudo resolver la aprobacion.");
              }
            }} disabled={transactions.isResolving}>{transactions.isResolving ? "Guardando..." : "Confirmar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setApprovalResolutionOpen(false)} disabled={transactions.isResolving}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={receiptOpen} onClose={() => setReceiptOpen(false)} width="max-w-[640px]">
        <div className="space-y-3 p-4">
          {receiptError && <ErrorBlock message={receiptError} onRetry={() => setReceiptError(null)} />}
          <input value={receiptForm.routeInput} onChange={(event) => setReceiptForm((current) => ({ ...current, routeInput: event.target.value }))} placeholder="Ruta o enlace del comprobante" className="h-9 w-full rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input value={receiptForm.fileType} onChange={(event) => setReceiptForm((current) => ({ ...current, fileType: event.target.value }))} placeholder="Tipo de archivo" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            <input type="file" onChange={(event) => setReceiptForm((current) => ({ ...current, file: event.target.files?.[0] ?? null }))} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          </div>
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={async () => {
              if (!transactionDetailId) return;
              try {
                await receipts.create({ transactionId: transactionDetailId, routeInput: receiptForm.routeInput, fileType: receiptForm.fileType || null, file: receiptForm.file });
                toast.success("Comprobante registrado.");
                setReceiptOpen(false);
              } catch (error) {
                setReceiptError(error instanceof Error ? error.message : "No se pudo registrar el comprobante.");
              }
            }} disabled={receipts.isCreating}>{receipts.isCreating ? "Guardando..." : "Guardar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setReceiptOpen(false)} disabled={receipts.isCreating}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={sponsorshipFormOpen} onClose={() => setSponsorshipFormOpen(false)} width="max-w-[640px]">
        <div className="flex items-start justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
          <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>Nuevo apadrinamiento (Supabase DB)</h3>
          <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={() => setSponsorshipFormOpen(false)}>X</button>
        </div>
        <div className="space-y-3 p-4">
          {sponsorshipError && <ErrorBlock message={sponsorshipError} onRetry={() => setSponsorshipError(null)} />}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input value={sponsorshipForm.donor_name} onChange={(e) => setSponsorshipForm((curr) => ({ ...curr, donor_name: e.target.value }))} placeholder="Nombre del donante" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            <input value={sponsorshipForm.donor_email} onChange={(e) => setSponsorshipForm((curr) => ({ ...curr, donor_email: e.target.value }))} placeholder="Correo del donante" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SelectField value={sponsorshipForm.gateway_name} onChange={(val) => setSponsorshipForm((curr) => ({ ...curr, gateway_name: val }))} options={[{ value: "stripe", label: "Stripe SDK" }, { value: "culqi", label: "Culqi" }, { value: "mercadopago", label: "MercadoPago" }]} />
            <SelectField value={sponsorshipForm.subscription_frequency} onChange={(val) => setSponsorshipForm((curr) => ({ ...curr, subscription_frequency: val }))} options={[{ value: "monthly", label: "Mensual" }, { value: "annual", label: "Anual" }, { value: "one_time", label: "Única" }]} />
            <input type="number" value={sponsorshipForm.amount} onChange={(e) => setSponsorshipForm((curr) => ({ ...curr, amount: e.target.value }))} placeholder="Monto (PEN)" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          </div>
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={async () => {
              if (!sponsorshipForm.donor_name.trim() || !sponsorshipForm.donor_email.trim()) { setSponsorshipError("Nombre y correo del donante son obligatorios."); return; }
              try {
                await sponsorships.create({
                  donor_name: sponsorshipForm.donor_name.trim(),
                  donor_email: sponsorshipForm.donor_email.trim(),
                  gateway_name: sponsorshipForm.gateway_name,
                  subscription_frequency: sponsorshipForm.subscription_frequency,
                  amount: Number(sponsorshipForm.amount || 0),
                });
                toast.success("Apadrinamiento registrado en la base de datos.");
                setSponsorshipFormOpen(false);
                sponsorships.refresh();
              } catch (err) {
                setSponsorshipError(err instanceof Error ? err.message : "Error al registrar apadrinamiento.");
              }
            }}>Guardar en BD</GradientButton>
            <OutlineButton size="sm" onClick={() => setSponsorshipFormOpen(false)}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
