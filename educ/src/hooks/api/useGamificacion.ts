import { useQuery } from '@tanstack/react-query';
import { supabase } from '@educ/lib/supabase';

// FASE 5: Capa de Abstracción de Datos (Data Access Layer)
// Centraliza toda la lógica de obtención, caché y transformación de datos.
// Previene el acoplamiento directo de los componentes UI con la BD.

export function useGamificacion(userId: string) {
  return useQuery({
    queryKey: ['gamificacion', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('educa')
        .from('gamificacion')
        .select('*')
        .eq('estudiante_id', userId)
        .single();
        
      if (error) throw error;
      return data;
    },
    // Solo ejecutamos la consulta si tenemos un userId válido
    enabled: !!userId,
  });
}
