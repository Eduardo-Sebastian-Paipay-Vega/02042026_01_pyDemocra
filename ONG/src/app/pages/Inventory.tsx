import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ImageUploadField } from "../components/ui/image-upload-field";
import {
  getAssetsUploadBucket,
  uploadFileToStorage,
} from "../services/shared/storage";
import { DataTable, type Column } from "../components/shared/DataTable";
import { FilterBar } from "../components/shared/FilterBar";
import { PageHeader } from "../components/shared/PageHeader";
import { GradientButton } from "../components/ui/gradient-button";
import { ModalShell } from "../components/ui/modal-shell";
import { OutlineButton } from "../components/ui/outline-button";
import { StatusDot } from "../components/ui/status-dot";
import { useInventarioMovimientos } from "../modules/resources/hooks/useInventarioMovimientos";
import { useItemDetail } from "../modules/resources/hooks/useItemDetail";
import { useItems } from "../modules/resources/hooks/useItems";
import { useKardex } from "../modules/resources/hooks/useKardex";
import { useTransaccionInventarioDetail } from "../modules/resources/hooks/useTransaccionInventarioDetail";
import { useUbicacionDetail } from "../modules/resources/hooks/useUbicacionDetail";
import { useUbicaciones } from "../modules/resources/hooks/useUbicaciones";

const PAGE_SIZE = 20;
type InventoryView = "items" | "locations" | "movements" | "kardex";

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

function formatNumber(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(value);
}

const itemColumns: Column<any>[] = [
  {
    key: "item", label: "Item", render: (item) => (
      <div className="flex items-center gap-3">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-9 w-9 shrink-0 rounded-lg object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-medium" style={{ background: "var(--t-hover)", color: "var(--t-text-dim)" }}>
            {item.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
        )}
        <div><div style={{ color: "var(--t-text)" }}>{item.name}</div><div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>{item.code}</div></div>
      </div>
    )
  },
  { key: "unit", label: "Unidad / Estado", render: (item) => <div className="text-[12px]" style={{ color: "var(--t-text-dim)" }}><div>{item.unitLabel}</div><div>{item.stateLabel}</div></div> },
  { key: "status", label: "Activo", render: (item) => <StatusDot variant={item.statusVariant}>{item.activeLabel}</StatusDot> },
  { key: "stock", label: "Stock", render: (item) => <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{formatNumber(item.derivedStock)}</span> },
];

const locationColumns: Column<any>[] = [
  {
    key: "name", label: "Ubicacion", render: (item) => (
      <div className="flex items-center gap-3">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-9 w-9 shrink-0 rounded-lg object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-medium" style={{ background: "var(--t-hover)", color: "var(--t-text-dim)" }}>
            {item.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
        )}
        <div><div style={{ color: "var(--t-text)" }}>{item.name}</div><div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>{item.code}</div></div>
      </div>
    )
  },
  { key: "country", label: "Pais", render: (item) => <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{item.countryLabel}</span> },
  { key: "address", label: "Direccion", render: (item) => <span className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>{item.address || "-"}</span> },
  { key: "status", label: "Activo", render: (item) => <StatusDot variant={item.statusVariant}>{item.activeLabel}</StatusDot> },
];

const movementColumns: Column<any>[] = [
  { key: "item", label: "Item", render: (item) => <div><div style={{ color: "var(--t-text)" }}>{item.itemName}</div><div className="mt-0.5 text-[11px]" style={{ color: "var(--t-text-dim)" }}>{item.itemId}</div></div> },
  { key: "type", label: "Tipo", render: (item) => <StatusDot variant={item.statusVariant}>{item.typeName}</StatusDot> },
  { key: "quantity", label: "Cantidad", render: (item) => <span className="text-[12px]" style={{ color: "var(--t-text-secondary)" }}>{formatNumber(item.quantity)}</span> },
  { key: "path", label: "Origen / Destino", render: (item) => <div className="text-[12px]" style={{ color: "var(--t-text-dim)" }}><div>Origen: {item.originName}</div><div>Destino: {item.destinationName}</div></div> },
  { key: "trace", label: "Registro", render: (item) => <div className="text-[12px]" style={{ color: "var(--t-text-dim)" }}><div>{item.date}</div><div>{item.registeredBy}</div></div> },
];

export function Inventory() {
  const [view, setView] = useState<InventoryView>("items");
  const [itemsSearch, setItemsSearch] = useState("");
  const [itemsState, setItemsState] = useState<"all" | "active" | "inactive">("all");
  const [itemsPage, setItemsPage] = useState(1);
  const [locationsSearch, setLocationsSearch] = useState("");
  const [locationsPage, setLocationsPage] = useState(1);
  const [movementsSearch, setMovementsSearch] = useState("");
  const [movementsItem, setMovementsItem] = useState("all");
  const [movementsType, setMovementsType] = useState("all");
  const [movementsOrigin, setMovementsOrigin] = useState("all");
  const [movementsDestination, setMovementsDestination] = useState("all");
  const [movementsDateFrom, setMovementsDateFrom] = useState("");
  const [movementsDateTo, setMovementsDateTo] = useState("");
  const [movementsPage, setMovementsPage] = useState(1);
  const [kardexSearch, setKardexSearch] = useState("");
  const [kardexItem, setKardexItem] = useState("all");
  const [kardexLocation, setKardexLocation] = useState("all");
  const [kardexType, setKardexType] = useState("all");
  const [kardexDateFrom, setKardexDateFrom] = useState("");
  const [kardexDateTo, setKardexDateTo] = useState("");
  const [kardexPage, setKardexPage] = useState(1);

  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemForm, setItemForm] = useState({ code: "", name: "", description: "", unitCode: "", stateCode: "", active: true, imageUrl: "", imageFile: null as File | null });
  const [itemError, setItemError] = useState<string | null>(null);
  const [itemDetailId, setItemDetailId] = useState<string | null>(null);
  const [itemRemoveTarget, setItemRemoveTarget] = useState<any | null>(null);

  const [locationFormOpen, setLocationFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any | null>(null);
  const [locationForm, setLocationForm] = useState({ code: "", name: "", address: "", latitude: "", longitude: "", countryCode: "PE", active: true, imageUrl: "", imageFile: null as File | null });
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationDetailId, setLocationDetailId] = useState<string | null>(null);
  const [locationRemoveTarget, setLocationRemoveTarget] = useState<any | null>(null);

  const [movementFormOpen, setMovementFormOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<any | null>(null);
  const [movementForm, setMovementForm] = useState({ itemId: "all", typeId: "all", quantity: "", originId: "all", destinationId: "all", transactionDate: "" });
  const [movementError, setMovementError] = useState<string | null>(null);
  const [movementDetailId, setMovementDetailId] = useState<string | null>(null);
  const [movementRemoveTarget, setMovementRemoveTarget] = useState<any | null>(null);

  const items = useItems({ searchTerm: itemsSearch, state: itemsState, page: itemsPage, pageSize: PAGE_SIZE });
  const locations = useUbicaciones({ searchTerm: locationsSearch, page: locationsPage, pageSize: PAGE_SIZE });
  const movements = useInventarioMovimientos({ searchTerm: movementsSearch, itemId: movementsItem, typeCode: movementsType, typeId: movementsType, originId: movementsOrigin, destinationId: movementsDestination, dateFrom: movementsDateFrom || null, dateTo: movementsDateTo || null, includeDeleted: false, page: movementsPage, pageSize: PAGE_SIZE });
  const kardex = useKardex({ searchTerm: kardexSearch, itemId: kardexItem, locationId: kardexLocation, typeCode: kardexType, typeId: kardexType, dateFrom: kardexDateFrom || null, dateTo: kardexDateTo || null, page: kardexPage, pageSize: PAGE_SIZE });
  const itemDetail = useItemDetail(itemDetailId);
  const locationDetail = useUbicacionDetail(locationDetailId);
  const movementDetail = useTransaccionInventarioDetail(movementDetailId);

  const movementItemOptions = useMemo(() => [{ value: "all", label: "Item: Todos" }, ...movements.itemOptions], [movements.itemOptions]);
  const movementLocationOptions = useMemo(() => [{ value: "all", label: "Ubicacion: Todas" }, ...movements.locationOptions], [movements.locationOptions]);
  const movementTypeOptions = useMemo(() => [{ value: "all", label: "Tipo: Todos" }, ...movements.typeOptions.map((item) => ({ value: String(item.value), label: item.label }))], [movements.typeOptions]);
  const kardexItemOptions = useMemo(() => [{ value: "all", label: "Item: Todos" }, ...kardex.itemOptions], [kardex.itemOptions]);
  const kardexLocationOptions = useMemo(() => [{ value: "all", label: "Ubicacion: Todas" }, ...kardex.locationOptions], [kardex.locationOptions]);
  const kardexTypeOptions = useMemo(() => [{ value: "all", label: "Tipo: Todos" }, ...kardex.typeOptions.map((item) => ({ value: String(item.value), label: item.label }))], [kardex.typeOptions]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Recursos - Inventario" description="Operacion real sobre ong.items, ong.ubicaciones, ong.tipo_transaccion_inventario y ong.transacciones_inventario." action={{ label: "Refrescar", onClick: () => { items.refresh(); locations.refresh(); movements.refresh(); kardex.refresh(); } }} />
      <div className="flex flex-wrap gap-2">
        <GradientButton size="sm" onClick={() => setView("items")}>Items</GradientButton>
        <OutlineButton size="sm" onClick={() => setView("locations")}>Ubicaciones</OutlineButton>
        <OutlineButton size="sm" onClick={() => setView("movements")}>Movimientos</OutlineButton>
        <OutlineButton size="sm" onClick={() => setView("kardex")}>Kardex</OutlineButton>
      </div>

      {view === "items" && (
        <>
          <FilterBar
            searchPlaceholder="Buscar item..."
            searchValue={itemsSearch}
            onSearchChange={(value) => { setItemsSearch(value); setItemsPage(1); }}
            filters={[
              { label: "Todos", value: "all", active: itemsState === "all" },
              { label: "Activos", value: "active", active: itemsState === "active" },
              { label: "Inactivos", value: "inactive", active: itemsState === "inactive" },
            ]}
            onFilterClick={(value) => { setItemsState(value as "all" | "active" | "inactive"); setItemsPage(1); }}
          />
          {items.error && <ErrorBlock message={items.error} onRetry={items.refresh} />}
          <DataTable columns={itemColumns} data={items.rows} loading={items.loading} emptyMessage="No se encontraron items." actions={[
            { label: "Ver detalle", onClick: (row) => setItemDetailId(row.id) },
            { label: "Editar", onClick: (row) => { setEditingItem(row); setItemForm({ code: row.code, name: row.name, description: row.description, unitCode: row.unitCode, stateCode: row.stateCode, active: row.active, imageUrl: row.imageUrl ?? "", imageFile: null }); setItemError(null); setItemFormOpen(true); } },
            { label: "Inactivar", onClick: (row) => setItemRemoveTarget(row), variant: "destructive" },
          ]} />
          <div className="flex justify-between rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>{(items.total === 0 ? 0 : (itemsPage - 1) * PAGE_SIZE + 1)}-{Math.min(items.total, itemsPage * PAGE_SIZE)} de {items.total}</p>
            <div className="flex gap-2">
              <OutlineButton size="sm" onClick={() => setItemsPage((current) => current - 1)} disabled={itemsPage <= 1}>Anterior</OutlineButton>
              <OutlineButton size="sm" onClick={() => setItemsPage((current) => current + 1)} disabled={itemsPage * PAGE_SIZE >= items.total}>Siguiente</OutlineButton>
            </div>
          </div>
          <GradientButton size="sm" onClick={() => { setEditingItem(null); setItemForm({ code: "", name: "", description: "", unitCode: items.unitOptions[0]?.value ?? "", stateCode: items.stateOptions[0]?.value ?? "", active: true, imageUrl: "", imageFile: null }); setItemError(null); setItemFormOpen(true); }}>Nuevo item</GradientButton>
        </>
      )}

      {view === "locations" && (
        <>
          <FilterBar searchPlaceholder="Buscar ubicacion..." searchValue={locationsSearch} onSearchChange={(value) => { setLocationsSearch(value); setLocationsPage(1); }} filters={[]} />
          {locations.error && <ErrorBlock message={locations.error} onRetry={locations.refresh} />}
          <DataTable columns={locationColumns} data={locations.rows} loading={locations.loading} emptyMessage="No se encontraron ubicaciones." actions={[
            { label: "Ver detalle", onClick: (row) => setLocationDetailId(row.id) },
            { label: "Editar", onClick: (row) => { setEditingLocation(row); setLocationForm({ code: row.code, name: row.name, address: row.address, latitude: row.latitude === null ? "" : String(row.latitude), longitude: row.longitude === null ? "" : String(row.longitude), countryCode: row.countryCode, active: row.active, imageUrl: row.imageUrl ?? "", imageFile: null }); setLocationError(null); setLocationFormOpen(true); } },
            { label: "Inactivar", onClick: (row) => setLocationRemoveTarget(row), variant: "destructive" },
          ]} />
          <div className="flex justify-between rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>{(locations.total === 0 ? 0 : (locationsPage - 1) * PAGE_SIZE + 1)}-{Math.min(locations.total, locationsPage * PAGE_SIZE)} de {locations.total}</p>
            <div className="flex gap-2">
              <OutlineButton size="sm" onClick={() => setLocationsPage((current) => current - 1)} disabled={locationsPage <= 1}>Anterior</OutlineButton>
              <OutlineButton size="sm" onClick={() => setLocationsPage((current) => current + 1)} disabled={locationsPage * PAGE_SIZE >= locations.total}>Siguiente</OutlineButton>
            </div>
          </div>
          <GradientButton size="sm" onClick={() => { setEditingLocation(null); setLocationForm({ code: "", name: "", address: "", latitude: "", longitude: "", countryCode: locations.countryOptions[0]?.value ?? "PE", active: true, imageUrl: "", imageFile: null }); setLocationError(null); setLocationFormOpen(true); }}>Nueva ubicacion</GradientButton>
        </>
      )}

      {view === "movements" && (
        <>
          <FilterBar searchPlaceholder="Buscar movimiento..." searchValue={movementsSearch} onSearchChange={(value) => { setMovementsSearch(value); setMovementsPage(1); }} filters={[]} />
          <div className="flex flex-wrap gap-2">
            <SelectField value={movementsItem} onChange={(value) => { setMovementsItem(value); setMovementsPage(1); }} options={movementItemOptions} />
            <SelectField value={movementsType} onChange={(value) => { setMovementsType(value); setMovementsPage(1); }} options={movementTypeOptions} />
            <SelectField value={movementsOrigin} onChange={(value) => { setMovementsOrigin(value); setMovementsPage(1); }} options={movementLocationOptions} />
            <SelectField value={movementsDestination} onChange={(value) => { setMovementsDestination(value); setMovementsPage(1); }} options={movementLocationOptions} />
            <input type="date" value={movementsDateFrom} onChange={(event) => { setMovementsDateFrom(event.target.value); setMovementsPage(1); }} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            <input type="date" value={movementsDateTo} onChange={(event) => { setMovementsDateTo(event.target.value); setMovementsPage(1); }} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          </div>
          {movements.error && <ErrorBlock message={movements.error} onRetry={movements.refresh} />}
          {movements.warnings.length > 0 && <ErrorBlock message={movements.warnings.join(" ")} onRetry={movements.refresh} />}
          <DataTable columns={movementColumns} data={movements.rows} loading={movements.loading} emptyMessage="No se encontraron movimientos." actions={[
            { label: "Ver detalle", onClick: (row) => setMovementDetailId(row.id) },
            { label: "Editar", onClick: (row) => { setEditingMovement(row); setMovementForm({ itemId: row.itemId, typeId: row.typeCode, quantity: String(row.quantity), originId: row.originId ?? "all", destinationId: row.destinationId ?? "all", transactionDate: row.rawDate.slice(0, 10) }); setMovementError(null); setMovementFormOpen(true); } },
            { label: "Eliminar", onClick: (row) => setMovementRemoveTarget(row), variant: "destructive" },
          ]} />
          <div className="flex justify-between rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>{(movements.total === 0 ? 0 : (movementsPage - 1) * PAGE_SIZE + 1)}-{Math.min(movements.total, movementsPage * PAGE_SIZE)} de {movements.total}</p>
            <div className="flex gap-2">
              <OutlineButton size="sm" onClick={() => setMovementsPage((current) => current - 1)} disabled={movementsPage <= 1}>Anterior</OutlineButton>
              <OutlineButton size="sm" onClick={() => setMovementsPage((current) => current + 1)} disabled={movementsPage * PAGE_SIZE >= movements.total}>Siguiente</OutlineButton>
            </div>
          </div>
          <GradientButton size="sm" onClick={() => { setEditingMovement(null); setMovementForm({ itemId: "all", typeId: "all", quantity: "", originId: "all", destinationId: "all", transactionDate: "" }); setMovementError(null); setMovementFormOpen(true); }}>Nuevo movimiento</GradientButton>
        </>
      )}

      {view === "kardex" && (
        <>
          <FilterBar searchPlaceholder="Buscar en kardex..." searchValue={kardexSearch} onSearchChange={(value) => { setKardexSearch(value); setKardexPage(1); }} filters={[]} />
          <div className="flex flex-wrap gap-2">
            <SelectField value={kardexItem} onChange={(value) => { setKardexItem(value); setKardexPage(1); }} options={kardexItemOptions} />
            <SelectField value={kardexLocation} onChange={(value) => { setKardexLocation(value); setKardexPage(1); }} options={kardexLocationOptions} />
            <SelectField value={kardexType} onChange={(value) => { setKardexType(value); setKardexPage(1); }} options={kardexTypeOptions} />
            <input type="date" value={kardexDateFrom} onChange={(event) => { setKardexDateFrom(event.target.value); setKardexPage(1); }} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            <input type="date" value={kardexDateTo} onChange={(event) => { setKardexDateTo(event.target.value); setKardexPage(1); }} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          </div>
          {kardex.error && <ErrorBlock message={kardex.error} onRetry={kardex.refresh} />}
          <DataTable columns={movementColumns} data={kardex.rows} loading={kardex.loading} emptyMessage="No hay movimientos para el kardex." />
          <div className="flex justify-between rounded-2xl px-4 py-3" style={{ background: "var(--t-surface)", border: "1px solid var(--t-border)" }}>
            <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>{(kardex.total === 0 ? 0 : (kardexPage - 1) * PAGE_SIZE + 1)}-{Math.min(kardex.total, kardexPage * PAGE_SIZE)} de {kardex.total}</p>
            <div className="flex gap-2">
              <OutlineButton size="sm" onClick={() => setKardexPage((current) => current - 1)} disabled={kardexPage <= 1}>Anterior</OutlineButton>
              <OutlineButton size="sm" onClick={() => setKardexPage((current) => current + 1)} disabled={kardexPage * PAGE_SIZE >= kardex.total}>Siguiente</OutlineButton>
            </div>
          </div>
        </>
      )}
      <ModalShell open={itemFormOpen} onClose={() => setItemFormOpen(false)} width="max-w-[860px]">
        <div className="flex items-start justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
          <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>{editingItem ? "Editar item" : "Nuevo item"}</h3>
          <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={() => setItemFormOpen(false)}>X</button>
        </div>
        <div className="space-y-3 p-4">
          {itemError && <ErrorBlock message={itemError} onRetry={() => setItemError(null)} />}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input value={itemForm.code} onChange={(event) => setItemForm((current) => ({ ...current, code: event.target.value }))} placeholder="Código (ej: INV-001, auto si vacío)" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            <input value={itemForm.name} onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SelectField value={itemForm.unitCode} onChange={(value) => setItemForm((current) => ({ ...current, unitCode: value }))} options={items.unitOptions.length ? items.unitOptions : [{ value: "", label: "Sin unidades" }]} />
            <SelectField value={itemForm.stateCode} onChange={(value) => setItemForm((current) => ({ ...current, stateCode: value }))} options={items.stateOptions.length ? items.stateOptions : [{ value: "", label: "Sin estados" }]} />
          </div>
          <textarea value={itemForm.description} onChange={(event) => setItemForm((current) => ({ ...current, description: event.target.value }))} rows={4} placeholder="Descripcion" className="w-full rounded-xl px-3 py-2 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}><input type="checkbox" checked={itemForm.active} onChange={(event) => setItemForm((current) => ({ ...current, active: event.target.checked }))} />Item activo</label>
          <ImageUploadField
            label="Imagen del item (opcional)"
            existingUrl={itemForm.imageUrl || null}
            previewFile={itemForm.imageFile}
            onFileSelect={(file) => setItemForm((current) => ({ ...current, imageFile: file }))}
            onClear={() => setItemForm((current) => ({ ...current, imageFile: null, imageUrl: "" }))}
          />
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={async () => {
              if (!itemForm.name.trim() || !itemForm.unitCode || !itemForm.stateCode) { setItemError("Nombre, unidad y estado son obligatorios. El código se auto-genera si lo dejas vacío."); return; }
              try {
                let resolvedImageUrl: string | null = itemForm.imageUrl || null;
                if (itemForm.imageFile) {
                  const upload = await uploadFileToStorage({ ...getAssetsUploadBucket(), file: itemForm.imageFile, pathSegments: ["items", itemForm.code.trim() || "item"] });
                  resolvedImageUrl = upload.publicUrl ?? upload.route;
                }
                const payload = { code: itemForm.code.trim(), name: itemForm.name.trim(), description: itemForm.description || null, unitCode: itemForm.unitCode, stateCode: itemForm.stateCode, active: itemForm.active, imageUrl: resolvedImageUrl };
                if (editingItem) await items.update({ itemId: editingItem.id, ...payload });
                else await items.create(payload);
                toast.success(editingItem ? "Item actualizado." : "Item registrado.");
                setItemFormOpen(false);
              } catch (error) {
                setItemError(error instanceof Error ? error.message : "No se pudo guardar el item.");
              }
            }} disabled={items.isCreating || items.isUpdating}>{items.isCreating || items.isUpdating ? "Guardando..." : "Guardar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setItemFormOpen(false)} disabled={items.isCreating || items.isUpdating}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={Boolean(itemDetailId)} onClose={() => setItemDetailId(null)} width="max-w-[920px]">
        <div className="space-y-3 p-4">
          {itemDetail.loading && <p className="text-[12px]">Cargando detalle...</p>}
          {itemDetail.error && <ErrorBlock message={itemDetail.error} onRetry={itemDetail.refresh} />}
          {itemDetail.detail && (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DetailField label="Item" value={itemDetail.detail.item.name} />
                <DetailField label="Codigo" value={itemDetail.detail.item.code} />
                <DetailField label="Unidad" value={itemDetail.detail.item.unitLabel} />
                <DetailField label="Estado" value={itemDetail.detail.item.stateLabel} />
                <DetailField label="Stock derivado" value={formatNumber(itemDetail.detail.item.derivedStock)} />
                <DetailField label="Descripcion" value={itemDetail.detail.item.description || "-"} />
              </div>
              <DataTable columns={movementColumns} data={itemDetail.detail.latestMovements} emptyMessage="Sin movimientos recientes." />
            </>
          )}
        </div>
      </ModalShell>

      <ModalShell open={Boolean(itemRemoveTarget)} onClose={() => setItemRemoveTarget(null)} width="max-w-[520px]">
        <div className="space-y-3 p-4">
          <p className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>{itemRemoveTarget ? `Inactivar el item ${itemRemoveTarget.name}?` : "Confirma la inactivacion."}</p>
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={async () => { if (!itemRemoveTarget) return; await items.remove(itemRemoveTarget.id); toast.success("Item inactivado."); setItemRemoveTarget(null); }} disabled={items.isRemoving}>{items.isRemoving ? "Guardando..." : "Confirmar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setItemRemoveTarget(null)} disabled={items.isRemoving}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={locationFormOpen} onClose={() => setLocationFormOpen(false)} width="max-w-[860px]">
        <div className="flex items-start justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
          <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>{editingLocation ? "Editar ubicacion" : "Nueva ubicacion"}</h3>
          <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={() => setLocationFormOpen(false)}>X</button>
        </div>
        <div className="space-y-3 p-4">
          {locationError && <ErrorBlock message={locationError} onRetry={() => setLocationError(null)} />}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input value={locationForm.code} onChange={(event) => setLocationForm((current) => ({ ...current, code: event.target.value }))} placeholder="Codigo" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            <input value={locationForm.name} onChange={(event) => setLocationForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SelectField value={locationForm.countryCode} onChange={(value) => setLocationForm((current) => ({ ...current, countryCode: value }))} options={locations.countryOptions.length ? locations.countryOptions : [{ value: "PE", label: "PE" }]} />
            <input value={locationForm.latitude} onChange={(event) => setLocationForm((current) => ({ ...current, latitude: event.target.value }))} placeholder="Latitud" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            <input value={locationForm.longitude} onChange={(event) => setLocationForm((current) => ({ ...current, longitude: event.target.value }))} placeholder="Longitud" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          </div>
          <textarea value={locationForm.address} onChange={(event) => setLocationForm((current) => ({ ...current, address: event.target.value }))} rows={3} placeholder="Direccion" className="w-full rounded-xl px-3 py-2 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--t-text-secondary)" }}><input type="checkbox" checked={locationForm.active} onChange={(event) => setLocationForm((current) => ({ ...current, active: event.target.checked }))} />Ubicacion activa</label>
          <ImageUploadField
            label="Imagen de la ubicacion (opcional)"
            existingUrl={locationForm.imageUrl || null}
            previewFile={locationForm.imageFile}
            onFileSelect={(file) => setLocationForm((current) => ({ ...current, imageFile: file }))}
            onClear={() => setLocationForm((current) => ({ ...current, imageFile: null, imageUrl: "" }))}
          />
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={async () => {
              if (!locationForm.code.trim() || !locationForm.name.trim()) { setLocationError("Codigo y nombre son obligatorios."); return; }
              try {
                let resolvedImageUrl: string | null = locationForm.imageUrl || null;
                if (locationForm.imageFile) {
                  const upload = await uploadFileToStorage({ ...getAssetsUploadBucket(), file: locationForm.imageFile, pathSegments: ["ubicaciones", locationForm.code.trim() || "ubicacion"] });
                  resolvedImageUrl = upload.publicUrl ?? upload.route;
                }
                const payload = { code: locationForm.code.trim(), name: locationForm.name.trim(), address: locationForm.address || null, countryCode: locationForm.countryCode || null, latitude: locationForm.latitude ? Number(locationForm.latitude) : null, longitude: locationForm.longitude ? Number(locationForm.longitude) : null, active: locationForm.active, imageUrl: resolvedImageUrl };
                if (editingLocation) await locations.update({ locationId: editingLocation.id, ...payload });
                else await locations.create(payload);
                toast.success(editingLocation ? "Ubicacion actualizada." : "Ubicacion registrada.");
                setLocationFormOpen(false);
              } catch (error) {
                setLocationError(error instanceof Error ? error.message : "No se pudo guardar la ubicacion.");
              }
            }} disabled={locations.isCreating || locations.isUpdating}>{locations.isCreating || locations.isUpdating ? "Guardando..." : "Guardar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setLocationFormOpen(false)} disabled={locations.isCreating || locations.isUpdating}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={Boolean(locationDetailId)} onClose={() => setLocationDetailId(null)} width="max-w-[920px]">
        <div className="space-y-3 p-4">
          {locationDetail.loading && <p className="text-[12px]">Cargando detalle...</p>}
          {locationDetail.error && <ErrorBlock message={locationDetail.error} onRetry={locationDetail.refresh} />}
          {locationDetail.detail && (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DetailField label="Ubicacion" value={locationDetail.detail.location.name} />
                <DetailField label="Codigo" value={locationDetail.detail.location.code} />
                <DetailField label="Pais" value={locationDetail.detail.location.countryLabel} />
                <DetailField label="Direccion" value={locationDetail.detail.location.address || "-"} />
              </div>
              <DataTable columns={movementColumns} data={locationDetail.detail.latestMovements} emptyMessage="Sin movimientos recientes." />
            </>
          )}
        </div>
      </ModalShell>

      <ModalShell open={Boolean(locationRemoveTarget)} onClose={() => setLocationRemoveTarget(null)} width="max-w-[520px]">
        <div className="space-y-3 p-4">
          <p className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>{locationRemoveTarget ? `Inactivar la ubicacion ${locationRemoveTarget.name}?` : "Confirma la inactivacion."}</p>
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={async () => { if (!locationRemoveTarget) return; await locations.remove(locationRemoveTarget.id); toast.success("Ubicacion inactivada."); setLocationRemoveTarget(null); }} disabled={locations.isRemoving}>{locations.isRemoving ? "Guardando..." : "Confirmar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setLocationRemoveTarget(null)} disabled={locations.isRemoving}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={movementFormOpen} onClose={() => setMovementFormOpen(false)} width="max-w-[860px]">
        <div className="flex items-start justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--t-border)" }}>
          <h3 className="text-[14px]" style={{ color: "var(--t-text)" }}>{editingMovement ? "Editar movimiento" : "Nuevo movimiento"}</h3>
          <button type="button" className="rounded-md px-2 py-1 text-[12px]" onClick={() => setMovementFormOpen(false)}>X</button>
        </div>
        <div className="space-y-3 p-4">
          {movementError && <ErrorBlock message={movementError} onRetry={() => setMovementError(null)} />}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SelectField value={movementForm.itemId} onChange={(value) => setMovementForm((current) => ({ ...current, itemId: value }))} options={movementItemOptions} />
            <SelectField value={movementForm.typeId} onChange={(value) => setMovementForm((current) => ({ ...current, typeId: value }))} options={movementTypeOptions} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input type="number" min="0.01" step="0.01" value={movementForm.quantity} onChange={(event) => setMovementForm((current) => ({ ...current, quantity: event.target.value }))} placeholder="Cantidad" className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
            <input type="date" value={movementForm.transactionDate} onChange={(event) => setMovementForm((current) => ({ ...current, transactionDate: event.target.value }))} className="h-9 rounded-xl px-3 text-[12px] outline-none" style={{ border: "1px solid var(--t-border)", background: "var(--t-input-bg)", color: "var(--t-text-secondary)" }} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SelectField value={movementForm.originId} onChange={(value) => setMovementForm((current) => ({ ...current, originId: value }))} options={movementLocationOptions} />
            <SelectField value={movementForm.destinationId} onChange={(value) => setMovementForm((current) => ({ ...current, destinationId: value }))} options={movementLocationOptions} />
          </div>
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={async () => {
              if (movementForm.itemId === "all" || movementForm.typeId === "all" || !movementForm.quantity) { setMovementError("Item, tipo y cantidad son obligatorios."); return; }
              try {
                const payload = { itemId: movementForm.itemId, typeCode: movementForm.typeId, quantity: Number(movementForm.quantity), originId: movementForm.originId === "all" ? null : movementForm.originId, destinationId: movementForm.destinationId === "all" ? null : movementForm.destinationId, transactionDate: movementForm.transactionDate || null };
                if (editingMovement) await movements.update({ movementId: editingMovement.id, ...payload });
                else await movements.create(payload);
                toast.success(editingMovement ? "Movimiento actualizado." : "Movimiento registrado.");
                setMovementFormOpen(false);
              } catch (error) {
                setMovementError(error instanceof Error ? error.message : "No se pudo guardar el movimiento.");
              }
            }} disabled={movements.isCreating || movements.isUpdating}>{movements.isCreating || movements.isUpdating ? "Guardando..." : "Guardar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setMovementFormOpen(false)} disabled={movements.isCreating || movements.isUpdating}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={Boolean(movementDetailId)} onClose={() => setMovementDetailId(null)} width="max-w-[760px]">
        <div className="space-y-3 p-4">
          {movementDetail.loading && <p className="text-[12px]">Cargando detalle...</p>}
          {movementDetail.error && <ErrorBlock message={movementDetail.error} onRetry={movementDetail.refresh} />}
          {movementDetail.detail && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DetailField label="Item" value={movementDetail.detail.movement.itemName} />
              <DetailField label="Tipo" value={movementDetail.detail.movement.typeName} />
              <DetailField label="Cantidad" value={formatNumber(movementDetail.detail.movement.quantity)} />
              <DetailField label="Fecha" value={movementDetail.detail.movement.date} />
              <DetailField label="Origen" value={movementDetail.detail.movement.originName} />
              <DetailField label="Destino" value={movementDetail.detail.movement.destinationName} />
              <DetailField label="Registrado por" value={movementDetail.detail.movement.registeredBy} />
            </div>
          )}
        </div>
      </ModalShell>

      <ModalShell open={Boolean(movementRemoveTarget)} onClose={() => setMovementRemoveTarget(null)} width="max-w-[520px]">
        <div className="space-y-3 p-4">
          <p className="text-[13px]" style={{ color: "var(--t-text-secondary)" }}>{movementRemoveTarget ? `Eliminar el movimiento ${movementRemoveTarget.id}?` : "Confirma la eliminacion."}</p>
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={async () => { if (!movementRemoveTarget) return; await movements.remove({ movementId: movementRemoveTarget.id }); toast.success("Movimiento eliminado."); setMovementRemoveTarget(null); }} disabled={movements.isRemoving}>{movements.isRemoving ? "Eliminando..." : "Confirmar"}</GradientButton>
            <OutlineButton size="sm" onClick={() => setMovementRemoveTarget(null)} disabled={movements.isRemoving}>Cancelar</OutlineButton>
          </div>
        </div>
      </ModalShell>
    </motion.div>
  );
}
