import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@educacion/shared-types/src/database.types';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private clientInstance: SupabaseClient<Database>;

  constructor(private readonly configService: ConfigService) {}

  getClient() {
    if (this.clientInstance) {
      return this.clientInstance;
    }

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SECRET_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('Las credenciales de Supabase no están configuradas en el entorno (SUPABASE_URL, SUPABASE_SECRET_KEY).');
      throw new Error('Supabase credentials missing');
    }

    // Usamos el Service Role Key para saltarnos el RLS, dado que el backend es de absoluta confianza.
    this.clientInstance = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.log('Supabase Service Role Client inicializado correctamente.');
    return this.clientInstance;
  }
}
