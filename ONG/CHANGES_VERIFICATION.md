# Verification: Every File Modified and Exact Code Changes

This document lists **every file that was modified** and the **exact code** that exists in the app for each feature. If something was not implemented in code, it is stated explicitly.

---

## 1. MODAL OVERLAY BLUR (Nueva Actividad)

**Status: IMPLEMENTED IN CODE**

**File:** `src/components/ActivityForm.tsx`

**Exact code present (line 281):**
```tsx
<div className="fixed inset-0 bg-black/65 backdrop-blur-[12px] flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
```

- **Overlay:** `bg-black/65` — semi-transparent dark (65% black), NOT solid black.
- **Blur:** `backdrop-blur-[12px]` — within the 8–12px range.
- **Animation:** `animate-in fade-in duration-200` for consistency with volunteer modal.

---

## 2. POST-CREATE NAVIGATION TO "ACTIVIDADES"

**Status: IMPLEMENTED IN CODE**

**File:** `src/components/AdminPanel.tsx`

**2a – useAuth now includes `user` (line 23):**
```tsx
const { accessToken, user } = useAuth();
```

**2b – ActivityForm onSuccess (lines 706–715):**
```tsx
{showActivityForm && (
  <ActivityForm
    onClose={() => setShowActivityForm(false)}
    onSuccess={() => {
      setShowActivityForm(false);
      setActiveTab('actividades');
    }}
    accessToken={accessToken || ''}
    id_usuario={user?.id}
    rol={user?.role}
  />
)}
```

- On success: modal closes and active tab is set to `'actividades'`, so the user is taken to the "Actividades" tab.

**Note:** The **Actividades tab content** in AdminPanel (when `activeTab === 'actividades'`) only shows:
- Title "Gestión de Actividades"
- Button "Nueva Actividad"
- An info box ("Cómo funciona")

There is **no activity list/table component** on that tab. So navigation to "Actividades" is implemented; the tab itself does not render a list of activities from the API.

---

## 3. RESPONSABLE AUTO-FILLED AND DISABLED FOR NON-ADMINS

**Status: IMPLEMENTED IN CODE**

**File:** `src/components/ActivityForm.tsx`

**3a – Props (lines 7–15):**
```tsx
interface ActivityFormProps {
  onClose: () => void;
  onSuccess: () => void;
  accessToken: string;
  /** Logged-in user id (id_usuario). When set, Responsable is pre-filled and read-only unless isAdmin. */
  id_usuario?: string;
  /** Logged-in user role. Admin can change responsable; others see it read-only. */
  rol?: string;
}
```

**3b – Destructuring and isAdmin (lines 33, 65):**
```tsx
export default function ActivityForm({ onClose, onSuccess, accessToken, id_usuario: userId, rol }: ActivityFormProps) {
  // ...
  const isAdmin = rol === 'admin';
```

**3c – Pre-fill id_responsable when not admin (lines 71–76):**
```tsx
  useEffect(() => {
    if (userId && !isAdmin) {
      setFormData(prev => ({ ...prev, id_responsable: userId }));
    }
  }, [userId, isAdmin]);
```

**3d – After loading responsables, set again (lines 113–118):**
```tsx
      if (resResponsables.ok) {
        const dataResp = await resResponsables.json();
        setResponsables(dataResp.responsables || []);
        if (userId && !isAdmin) {
          setFormData(prev => ({ ...prev, id_responsable: userId }));
        }
      }
```

**3e – Responsable select disabled for non-admin when userId set (lines 446–462):**
```tsx
                <select
                  name="id_responsable"
                  value={formData.id_responsable}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading || success || loadingCatalogos || (!isAdmin && !!userId)}
                >
                  ...
                </select>
                {!isAdmin && userId && (
                  <p className="text-xs text-gray-500 mt-1">Asignado a ti (sesión actual)</p>
                )}
```

**Call sites that pass user:**
- **AdminPanel.tsx (lines 713–714):** `id_usuario={user?.id}` and `rol={user?.role}`.
- **TrabajadorDashboard.tsx (lines 285–286):** `id_usuario={user?.id}` and `rol={user?.role}`.

---

## 4. ACTIVITIES FILTERED BY id_responsable IN QUERIES

**Status: IMPLEMENTED IN CODE**

**File:** `src/supabase/functions/server/index.tsx`

**4a – GET `/make-server-7052c263/activities` (lines 1317–1324):**
```tsx
    let filteredActivities = dbActivities || [];
    if (user.role === 'admin') {
      // Admin sees all activities
    } else if (user.role === 'trabajador' || user.role === 'jefa') {
      filteredActivities = filteredActivities.filter((activity: any) => String(activity.id_responsable) === String(user.id));
    } else {
      filteredActivities = [];
    }
```

- **Admin:** sees all activities.
- **Trabajador and Jefa:** only activities where `id_responsable === user.id`.

**4b – GET `/make-server-7052c263/reports/metrics`**
- **Admin (lines 1666–1739):** uses `allActivities` from Supabase; pending computed with `PENDING_ESTADOS = ['planificada', 'en_ejecucion']`; volunteers/hours from Supabase.
- **Jefa (lines 1741–1794):** `myActivities = allActivities.filter((a) => String(a.id_responsable) === String(user.id))`; all metrics (total, pending, validated, rejected, volunteersManaged, totalVolunteerHours) from that subset and Supabase queries.
- **Trabajador (lines 1786–1830):** `myActivities = allActivities.filter((activity) => String(activity.id_responsable) === String(user.id))`; pending uses `PENDING_ESTADOS`.

---

## 5. FILE UPLOAD DOES NOT TOUCH `actividades` TABLE

**Status: IMPLEMENTED IN CODE**

**5a – Activity creation (POST `/actividades`)**  
Inserts only into `actividades` (standard columns: codigo, titulo, id_responsable, etc.). No file columns.

**5b – File upload endpoint:** `src/supabase/functions/server/index.tsx` (lines 2873–2941)

- **Reads actividad:** `.from('actividades').select('id_actividad').eq('id_actividad', id_actividad).single()` — only to check existence, no write.
- **Writes:**  
  - **Supabase Storage:** `supabase.storage.from(BUCKET_ARCHIVOS).upload(path, arrayBuffer, ...)` (bucket `actividad-archivos`).  
  - **Table:** `.from('actividad_archivos').insert({ id_actividad, ruta_storage, nombre_original, tipo })`.

No insert/update to `actividades` for files. File references live only in `actividad_archivos` and Storage.

**5c – Frontend (ActivityForm.tsx, lines 242–263):**
- Activity is created first via `POST .../actividades`.
- File upload runs only when `idActividad && archivos.length > 0`; otherwise it is skipped.
- Creating an activity **without** files never calls the upload endpoint, so it does not fail.

```tsx
      const idActividad = data.actividad?.id_actividad;
      if (idActividad && archivos.length > 0) {
        setUploadingFiles(true);
        try {
          const uploadFormData = new FormData();
          archivos.forEach(f => uploadFormData.append('archivos', f));
          const uploadRes = await fetch(`${API_URL}/actividades/${idActividad}/archivos`, {
            ...
          });
          ...
        } finally {
          setUploadingFiles(false);
        }
      }
```

---

## 6. DASHBOARD METRICS FROM SUPABASE (NO PLACEHOLDERS)

**Status: IMPLEMENTED IN CODE**

**File:** `src/supabase/functions/server/index.tsx`

**6a – Data source (lines 1654–1664):**
```tsx
    const { data: dbActivities, error: activitiesError } = await supabase
      .from('actividades')
      .select('id_actividad, estado, id_responsable');
    ...
    const allActivities = dbActivities || [];
    const PENDING_ESTADOS = ['planificada', 'en_ejecucion'];
```

**6b – Admin:** Uses `allActivities`; then:
- `supabase.from('usuarios').select(..., { count: 'exact', head: true }).eq('rol', 'voluntario').eq('estado', 'activo')` for volunteer count.
- `supabase.from('actividad_voluntarios').select('horas_total')` for total hours.
- `supabase.from('usuarios').select(...).in('rol', ['admin', 'trabajador', 'responsable'])` for workers.
- No hardcoded or placeholder numbers; all from Supabase.

**6c – Jefa:** Filters `allActivities` by `id_responsable === user.id`; then:
- `supabase.from('actividad_voluntarios').select('id_usuario, horas_total').in('id_actividad', myActivityIds)` for volunteers and hours for her activities.
- `supabase.from('usuarios').select(..., { count: 'exact', head: true }).eq('rol', 'voluntario').eq('estado', 'activo')` for active volunteers count.
- Pending: `myActivities.filter((a) => PENDING_ESTADOS.includes(String(a.estado)))`.

**6d – Trabajador:** Same pattern: filter by `id_responsable === user.id`, then Supabase for `actividad_voluntarios` and counts. Pending uses `PENDING_ESTADOS`.

There are no placeholder or static metric values in this endpoint; all metrics come from Supabase queries and filtered activities.

---

## Summary Table

| Feature | File(s) | Implemented in code? |
|--------|--------|----------------------|
| Modal overlay blur (darker, 8–12px, no solid black) | `ActivityForm.tsx` | Yes – `bg-black/65 backdrop-blur-[12px]` |
| Post-create navigation to "Actividades" | `AdminPanel.tsx` | Yes – `setActiveTab('actividades')` in onSuccess |
| Responsable auto-filled and disabled for non-admins | `ActivityForm.tsx`, `AdminPanel.tsx`, `TrabajadorDashboard.tsx` | Yes – props, useEffects, disabled, and call sites |
| Activities filtered by id_responsable | `index.tsx` (activities + reports/metrics) | Yes – filter for jefa/trabajador by user.id |
| File upload not in actividades table | `index.tsx`, `ActivityForm.tsx` | Yes – Storage + actividad_archivos only; optional upload |
| Dashboard metrics from Supabase | `index.tsx` (reports/metrics) | Yes – all from Supabase queries, filtered by role/user |

---

## Not implemented / Caveats

- **Actividades tab content:** The "Actividades" tab in AdminPanel does not render a list of activities (e.g. from GET `/activities`). It only shows the header, "Nueva Actividad" button, and the info box. So after creating an activity you are navigated to that tab, but you do not see a table of activities there unless a separate list component is added later.

---

## List of every modified file

1. **src/components/ActivityForm.tsx** – Modal blur, props `id_usuario`/`rol`, pre-fill and disabled Responsable, file upload optional.
2. **src/components/AdminPanel.tsx** – `user` from useAuth, onSuccess closes modal and calls `setActiveTab('actividades')`, passes `id_usuario` and `rol` to ActivityForm.
3. **src/components/TrabajadorDashboard.tsx** – Passes `id_usuario` and `rol` to ActivityForm.
4. **src/supabase/functions/server/index.tsx** – Activities list filter by `id_responsable` for jefa/trabajador; reports/metrics filtered by user and using `PENDING_ESTADOS`; file upload endpoint (Storage + actividad_archivos only).

No other files were modified for these features.

---

## Why you might not see changes in the app

- **Frontend:** Restart the dev server (`npm run dev` or `vite`) and do a hard refresh (Ctrl+Shift+R) or clear cache so the new JS/CSS (e.g. modal classes, navigation, Responsable logic) are loaded.
- **Backend:** The activities filter and reports/metrics live in the Edge Function. If you use Supabase Functions, redeploy (e.g. `supabase functions deploy make-server-7052c263` or your deploy command) so the server code runs with the new logic.
- **Responsable:** Only pre-fills when `user` is available from `useAuth()` and you open the form from AdminPanel or TrabajadorDashboard (they pass `user?.id` and `user?.role`). If the form is opened from somewhere that does not pass these props, the field stays editable and empty until selected.
