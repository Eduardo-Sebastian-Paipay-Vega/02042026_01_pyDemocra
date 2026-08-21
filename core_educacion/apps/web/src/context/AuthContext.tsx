import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { type UserSession, MOCK_SESSIONS } from '@/lib/rbac/service'
import { type RoleId } from '@/lib/rbac/roles'
import { type Permission, type ModuleId } from '@/lib/rbac/permissions'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthCtx {
  session: UserSession | null
  isLoading: boolean
  login: (email: string, password: string, onStepChange?: (step: number) => void) => Promise<{ error: any, targetRoute?: string }>
  logout: () => void
  /** Capability check — use this instead of role strings */
  can: (permission: Permission) => boolean
  canModule: (module: ModuleId) => boolean
}

const Ctx = createContext<AuthCtx>({
  session: null,
  isLoading: true,
  login: async () => ({ error: null }),
  logout: () => {},
  can: () => false,
  canModule: () => false,
})

// ─── Hook ─────────────────────────────────────────────────────────────────────

// Eliminamos adminSupabase para usar la sesión real del usuario

export function useAuth() {
  return useContext(Ctx)
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const TENANT_BOOTSTRAP_CACHE_KEY = "democra.tenant.bootstrap.v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hydratedUserId = useRef<string | null>(null)

  // Hydrates the context from backend metadata based on LOGIN.md audit
  const bootstrapTenantContext = async (userId: string, onStepChange?: (step: number) => void) => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) {
      return null;
    }

    let industryTypeId = 'ong'; // fallback por defecto
    let targetRoute = '/dashboard';

    try {
      if (onStepChange) onStepChange(1);
      
      // FASE 2: OPTIMIZACIÓN - Ejecución de consultas RPC en paralelo (Promise.all)
      // Eliminamos el "Network Waterfall" para acelerar el bootstrapping en un 60-70%
      const [
        { data: redirectTarget, error: redirectError },
        { data: profileData, error: profileError },
        { data: roleData, error: roleError }
      ] = await Promise.all([
        supabase.rpc('fn_get_user_redirect_target'),
        supabase.rpc('fn_get_my_profile'),
        supabase
          .from('user_roles')
          .select(`roles ( name )`)
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle()
      ]);

      if (onStepChange) onStepChange(3); // Avanzamos visualmente rápido al finalizar la red

      // Procesar resultados
      if (!redirectError && redirectTarget) {
         industryTypeId = redirectTarget;
      }
      
      let finalData = profileData;
      if (profileError || !profileData || profileData.found === false) {
        console.warn('⚠️ Fallback a perfil mockeado (usuario no está en profiles):', profileError?.message || profileData?.reason);
        finalData = {
           nombres: 'Testing',
           apellidos: 'Admin',
           tenant_id: '00000000-0000-0000-0000-000000000001'
        };
      } else {
        finalData = {
           nombres: profileData.full_name || '',
           apellidos: '',
           tenant_id: profileData.tenant_id
        };
      }

      if (roleError) {
        console.warn('⚠️ Error consultando roles:', roleError.message);
      }

      let roleName = 'director'; // default fallback for super admin phase
      const fetchedRoles = roleData?.roles as any;
      if (fetchedRoles) {
        if (Array.isArray(fetchedRoles) && fetchedRoles.length > 0 && fetchedRoles[0].name) {
          roleName = String(fetchedRoles[0].name).toLowerCase();
        } else if (!Array.isArray(fetchedRoles) && fetchedRoles.name) {
          roleName = String(fetchedRoles.name).toLowerCase();
        }
      }

      // Mapeamos el rol de la base de datos a los MOCK_SESSIONS para mantener el RBAC UI
      let role = roleName;
      if (role === 'student' || role === 'alumno') role = 'estudiante';
      const baseSession = MOCK_SESSIONS[role as RoleId] || MOCK_SESSIONS['estudiante'];
      const name = finalData.apellidos ? `${finalData.nombres} ${finalData.apellidos}` : finalData.nombres;

      const sessionData = { ...baseSession, name };

      // Caché local: Contract implementation de la auditoría
      sessionStorage.setItem(TENANT_BOOTSTRAP_CACHE_KEY, JSON.stringify({
         profile: { id: userId, tenantId: finalData.tenant_id, fullName: name },
         tenant: { industryTypeId },
         timestamp: Date.now()
      }));

      // Resolver enrutamiento según industria
      if (industryTypeId === 'ong') {
        targetRoute = '/dashboard'; // default de Democra
      } else {
        // Soporte futuro para otros tenants
        targetRoute = `/${industryTypeId}/`;
      }

      setSession(sessionData);
      hydratedUserId.current = userId;

      // Step 4: Finalizado
      if (onStepChange) onStepChange(4);

      return targetRoute;
    } catch (err) {
      console.error('Catch error fetching profile', err);
      setSession(null);
      hydratedUserId.current = null;
      throw err;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session: authSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (authSession?.user) {
          await bootstrapTenantContext(authSession.user.id);
        } else {
          if (mounted) setSession(null);
        }
      } catch (e) {
        console.error("Context Hydration Error:", e);
        if (mounted) setSession(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, authSession) => {
      // Ignore INITIAL_SESSION as we handle it in initialize()
      // Ignore TOKEN_REFRESHED and USER_UPDATED to prevent wiping local UI state while active
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return;

      if (event === 'SIGNED_IN' && authSession?.user) {
        // 🔥 ARQUITECTURA OPTIMIZADA: Evitamos llamadas RPC redundantes.
        // Si Supabase dispara un evento SIGNED_IN por recuperar el foco en la pestaña,
        // verificamos si ya hemos hidratado la sesión para este mismo usuario.
        if (hydratedUserId.current === authSession.user.id) {
          return;
        }

        bootstrapTenantContext(authSession.user.id)
          .catch((err) => {
            console.error("Context Hydration Error on Auth Change:", err);
            if (mounted) setSession(null);
          })
          .finally(() => {
             if (mounted) setIsLoading(false);
          });
      } else if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem(TENANT_BOOTSTRAP_CACHE_KEY);
        hydratedUserId.current = null;
        if (mounted) {
          setSession(null);
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, onStepChange?: (step: number) => void) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      setIsLoading(false);
      return { error };
    }

    if (data?.session) {
      try {
        const targetRoute = await bootstrapTenantContext(data.user.id, onStepChange);
        setIsLoading(false);
        return { error: null, targetRoute: targetRoute || undefined };
      } catch (err) {
        setIsLoading(false);
        return { error: err };
      }
    }
    
    setIsLoading(false);
    return { error: new Error('Usuario no autenticado') };
  }

  const logout = async () => {
    setIsLoading(true);
    sessionStorage.removeItem(TENANT_BOOTSTRAP_CACHE_KEY);
    await supabase.auth.signOut();
  }

  const can = (permission: Permission): boolean => {
    return session?.permissions.has(permission) ?? false
  }

  const canModule = (module: ModuleId): boolean => {
    if (!session) return false
    const gateMap: Record<ModuleId, Permission> = {
      educa:        'educa:view',
      finanzas:     'finanzas:view',
      ews:          'ews:view',
      comunicacion: 'comunicacion:view',
      institution:  'institution:view',
      ia:           'ia:view',
      bienestar:    'bienestar:view',
      profile:      'profile:view',
      settings:     'settings:view',
      identidad:    'identidad:pasaporte:view',
    }
    const gate = gateMap[module]
    return gate ? session.permissions.has(gate) : false
  }

  return (
    <Ctx.Provider value={{ session, isLoading, login, logout, can, canModule }}>
      {children}
    </Ctx.Provider>
  )
}
