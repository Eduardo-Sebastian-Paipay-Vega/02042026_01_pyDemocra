export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  bienestar: {
    Tables: {
      accessibility_user_profiles: {
        Row: {
          estudiante_id: string
          lectura_por_voz: boolean | null
          lengua_originaria: string | null
          modo_dislexia: boolean | null
          profile_id: string
          subtitulos_lsa: boolean | null
          tenant_id: string
        }
        Insert: {
          estudiante_id: string
          lectura_por_voz?: boolean | null
          lengua_originaria?: string | null
          modo_dislexia?: boolean | null
          profile_id?: string
          subtitulos_lsa?: boolean | null
          tenant_id: string
        }
        Update: {
          estudiante_id?: string
          lectura_por_voz?: boolean | null
          lengua_originaria?: string | null
          modo_dislexia?: boolean | null
          profile_id?: string
          subtitulos_lsa?: boolean | null
          tenant_id?: string
        }
        Relationships: []
      }
      climate_sentiment_surveys: {
        Row: {
          enps_score: number
          fecha_encuesta: string | null
          mapa_calor_sentimiento_json: Json
          survey_id: string
          tenant_id: string
        }
        Insert: {
          enps_score: number
          fecha_encuesta?: string | null
          mapa_calor_sentimiento_json: Json
          survey_id?: string
          tenant_id: string
        }
        Update: {
          enps_score?: number
          fecha_encuesta?: string | null
          mapa_calor_sentimiento_json?: Json
          survey_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      inclusion_iep_plans: {
        Row: {
          adaptaciones_json: Json
          diagnostico_nee: string
          estudiante_id: string
          fecha_aprobacion: string | null
          iep_id: string
          tenant_id: string
        }
        Insert: {
          adaptaciones_json: Json
          diagnostico_nee: string
          estudiante_id: string
          fecha_aprobacion?: string | null
          iep_id?: string
          tenant_id: string
        }
        Update: {
          adaptaciones_json?: Json
          diagnostico_nee?: string
          estudiante_id?: string
          fecha_aprobacion?: string | null
          iep_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      mental_health_radar_alerts: {
        Row: {
          alert_id: string
          atencion_asignada: boolean | null
          estudiante_id: string
          fecha_alerta: string | null
          nivel_riesgo: string
          tenant_id: string
        }
        Insert: {
          alert_id?: string
          atencion_asignada?: boolean | null
          estudiante_id: string
          fecha_alerta?: string | null
          nivel_riesgo: string
          tenant_id: string
        }
        Update: {
          alert_id?: string
          atencion_asignada?: boolean | null
          estudiante_id?: string
          fecha_alerta?: string | null
          nivel_riesgo?: string
          tenant_id?: string
        }
        Relationships: []
      }
      psycho_aptitude_reports: {
        Row: {
          alerta_vulnerabilidad: boolean | null
          estudiante_id: string
          fecha_test: string | null
          perfil_habilidades_blandas_json: Json
          report_id: string
          tenant_id: string
        }
        Insert: {
          alerta_vulnerabilidad?: boolean | null
          estudiante_id: string
          fecha_test?: string | null
          perfil_habilidades_blandas_json: Json
          report_id?: string
          tenant_id: string
        }
        Update: {
          alerta_vulnerabilidad?: boolean | null
          estudiante_id?: string
          fecha_test?: string | null
          perfil_habilidades_blandas_json?: Json
          report_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      safe_social_mediations: {
        Row: {
          autor_id: string
          contenido_texto: string
          estado_moderacion: string | null
          post_id: string
          tenant_id: string
          toxicity_score: number
        }
        Insert: {
          autor_id: string
          contenido_texto: string
          estado_moderacion?: string | null
          post_id?: string
          tenant_id: string
          toxicity_score: number
        }
        Update: {
          autor_id?: string
          contenido_texto?: string
          estado_moderacion?: string | null
          post_id?: string
          tenant_id?: string
          toxicity_score?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  core: {
    Tables: {
      audit_trail_immutable_logs: {
        Row: {
          accion: string
          fecha_evento: string | null
          hash_sha256: string
          log_id: string
          payload_json: Json
          tenant_id: string
          usuario_id: string
        }
        Insert: {
          accion: string
          fecha_evento?: string | null
          hash_sha256: string
          log_id?: string
          payload_json: Json
          tenant_id: string
          usuario_id: string
        }
        Update: {
          accion?: string
          fecha_evento?: string | null
          hash_sha256?: string
          log_id?: string
          payload_json?: Json
          tenant_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_immutable_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "institutos"
            referencedColumns: ["instituto_id"]
          },
          {
            foreignKeyName: "audit_trail_immutable_logs_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["usuario_id"]
          },
        ]
      }
      estudiantes: {
        Row: {
          estudiante_id: string
          grado_actual: string | null
          matricula_codigo: string
          tenant_id: string
          usuario_id: string
        }
        Insert: {
          estudiante_id: string
          grado_actual?: string | null
          matricula_codigo: string
          tenant_id: string
          usuario_id: string
        }
        Update: {
          estudiante_id?: string
          grado_actual?: string | null
          matricula_codigo?: string
          tenant_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estudiantes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "institutos"
            referencedColumns: ["instituto_id"]
          },
          {
            foreignKeyName: "estudiantes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["usuario_id"]
          },
        ]
      }
      institutos: {
        Row: {
          configuracion_json: Json | null
          created_at: string | null
          dominio: string | null
          instituto_id: string
          nombre: string
        }
        Insert: {
          configuracion_json?: Json | null
          created_at?: string | null
          dominio?: string | null
          instituto_id?: string
          nombre: string
        }
        Update: {
          configuracion_json?: Json | null
          created_at?: string | null
          dominio?: string | null
          instituto_id?: string
          nombre?: string
        }
        Relationships: []
      }
      profesores: {
        Row: {
          especialidad: string | null
          profesor_id: string
          tenant_id: string
          usuario_id: string
        }
        Insert: {
          especialidad?: string | null
          profesor_id: string
          tenant_id: string
          usuario_id: string
        }
        Update: {
          especialidad?: string | null
          profesor_id?: string
          tenant_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profesores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "institutos"
            referencedColumns: ["instituto_id"]
          },
          {
            foreignKeyName: "profesores_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["usuario_id"]
          },
        ]
      }
      referrals_conversiones: {
        Row: {
          estado: string | null
          fecha_registro: string | null
          recompensa_entregada: boolean | null
          referido_email: string
          referidor_id: string
          referral_id: string
          tenant_id: string
        }
        Insert: {
          estado?: string | null
          fecha_registro?: string | null
          recompensa_entregada?: boolean | null
          referido_email: string
          referidor_id: string
          referral_id?: string
          tenant_id: string
        }
        Update: {
          estado?: string | null
          fecha_registro?: string | null
          recompensa_entregada?: boolean | null
          referido_email?: string
          referidor_id?: string
          referral_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_conversiones_referidor_id_fkey"
            columns: ["referidor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["usuario_id"]
          },
          {
            foreignKeyName: "referrals_conversiones_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "institutos"
            referencedColumns: ["instituto_id"]
          },
        ]
      }
      roles: {
        Row: {
          descripcion: string | null
          permisos_json: Json | null
          rol_id: string
          tenant_id: string
        }
        Insert: {
          descripcion?: string | null
          permisos_json?: Json | null
          rol_id: string
          tenant_id: string
        }
        Update: {
          descripcion?: string | null
          permisos_json?: Json | null
          rol_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "institutos"
            referencedColumns: ["instituto_id"]
          },
        ]
      }
      usuarios: {
        Row: {
          apellidos: string
          auth_provider_id: string | null
          creado_en: string | null
          email: string
          nombres: string
          rol_id: string
          tenant_id: string
          usuario_id: string
        }
        Insert: {
          apellidos: string
          auth_provider_id?: string | null
          creado_en?: string | null
          email: string
          nombres: string
          rol_id: string
          tenant_id: string
          usuario_id?: string
        }
        Update: {
          apellidos?: string
          auth_provider_id?: string | null
          creado_en?: string | null
          email?: string
          nombres?: string
          rol_id?: string
          tenant_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["rol_id"]
          },
          {
            foreignKeyName: "usuarios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "institutos"
            referencedColumns: ["instituto_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  educa: {
    Tables: {
      attendance_dynamic_qrs: {
        Row: {
          distancia_metros: number
          estado: string | null
          estudiante_id: string
          fecha_marcado: string | null
          hmac_hash: string
          latitud: number
          longitud: number
          qr_id: string
          tenant_id: string
        }
        Insert: {
          distancia_metros: number
          estado?: string | null
          estudiante_id: string
          fecha_marcado?: string | null
          hmac_hash: string
          latitud: number
          longitud: number
          qr_id?: string
          tenant_id: string
        }
        Update: {
          distancia_metros?: number
          estado?: string | null
          estudiante_id?: string
          fecha_marcado?: string | null
          hmac_hash?: string
          latitud?: number
          longitud?: number
          qr_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      calificaciones: {
        Row: {
          calificacion_id: string
          estudiante_id: string
          fecha_evaluacion: string | null
          feedback: string | null
          leccion_id: string
          nota: number
          tenant_id: string
        }
        Insert: {
          calificacion_id?: string
          estudiante_id: string
          fecha_evaluacion?: string | null
          feedback?: string | null
          leccion_id: string
          nota: number
          tenant_id: string
        }
        Update: {
          calificacion_id?: string
          estudiante_id?: string
          fecha_evaluacion?: string | null
          feedback?: string | null
          leccion_id?: string
          nota?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calificaciones_leccion_id_fkey"
            columns: ["leccion_id"]
            isOneToOne: false
            referencedRelation: "lecciones"
            referencedColumns: ["leccion_id"]
          },
        ]
      }
      cat_irt_assessments: {
        Row: {
          assessment_id: string
          confidence_interval: number
          estudiante_id: string
          fecha_evaluacion: string | null
          items_answered_json: Json
          tenant_id: string
          theta_skill_level: number
        }
        Insert: {
          assessment_id?: string
          confidence_interval: number
          estudiante_id: string
          fecha_evaluacion?: string | null
          items_answered_json: Json
          tenant_id: string
          theta_skill_level: number
        }
        Update: {
          assessment_id?: string
          confidence_interval?: number
          estudiante_id?: string
          fecha_evaluacion?: string | null
          items_answered_json?: Json
          tenant_id?: string
          theta_skill_level?: number
        }
        Relationships: []
      }
      co_curricular_student_clubs: {
        Row: {
          club_id: string
          nombre_club: string
          presidente_id: string
          presupuesto_asignado: number | null
          tenant_id: string
        }
        Insert: {
          club_id?: string
          nombre_club: string
          presidente_id: string
          presupuesto_asignado?: number | null
          tenant_id: string
        }
        Update: {
          club_id?: string
          nombre_club?: string
          presidente_id?: string
          presupuesto_asignado?: number | null
          tenant_id?: string
        }
        Relationships: []
      }
      compartidos_logros: {
        Row: {
          compartido_id: string
          fecha_compartido: string | null
          gamificacion_id: string
          red_social: string
          tenant_id: string
          url_publicacion: string | null
          usuario_id: string
        }
        Insert: {
          compartido_id?: string
          fecha_compartido?: string | null
          gamificacion_id: string
          red_social: string
          tenant_id: string
          url_publicacion?: string | null
          usuario_id: string
        }
        Update: {
          compartido_id?: string
          fecha_compartido?: string | null
          gamificacion_id?: string
          red_social?: string
          tenant_id?: string
          url_publicacion?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compartidos_logros_gamificacion_id_fkey"
            columns: ["gamificacion_id"]
            isOneToOne: false
            referencedRelation: "gamificacion"
            referencedColumns: ["gamificacion_id"]
          },
        ]
      }
      curriculum_convalidations: {
        Row: {
          convalidation_id: string
          coordinador_firma_id: string | null
          estudiante_id: string
          fecha_aprobacion: string | null
          institucion_origen: string
          matriz_equivalencias_json: Json
          porcentaje_coincidencia: number
          tenant_id: string
        }
        Insert: {
          convalidation_id?: string
          coordinador_firma_id?: string | null
          estudiante_id: string
          fecha_aprobacion?: string | null
          institucion_origen: string
          matriz_equivalencias_json: Json
          porcentaje_coincidencia: number
          tenant_id: string
        }
        Update: {
          convalidation_id?: string
          coordinador_firma_id?: string | null
          estudiante_id?: string
          fecha_aprobacion?: string | null
          institucion_origen?: string
          matriz_equivalencias_json?: Json
          porcentaje_coincidencia?: number
          tenant_id?: string
        }
        Relationships: []
      }
      cursos: {
        Row: {
          creditos: number | null
          curso_id: string
          descripcion: string | null
          nombre: string
          tenant_id: string
        }
        Insert: {
          creditos?: number | null
          curso_id?: string
          descripcion?: string | null
          nombre: string
          tenant_id: string
        }
        Update: {
          creditos?: number | null
          curso_id?: string
          descripcion?: string | null
          nombre?: string
          tenant_id?: string
        }
        Relationships: []
      }
      documentos: {
        Row: {
          documento_id: string
          firma_digital_hash: string | null
          propietario_id: string
          tenant_id: string
          tipo_documento: string
          url_archivo: string
        }
        Insert: {
          documento_id?: string
          firma_digital_hash?: string | null
          propietario_id: string
          tenant_id: string
          tipo_documento: string
          url_archivo: string
        }
        Update: {
          documento_id?: string
          firma_digital_hash?: string | null
          propietario_id?: string
          tenant_id?: string
          tipo_documento?: string
          url_archivo?: string
        }
        Relationships: []
      }
      gamificacion: {
        Row: {
          estudiante_id: string
          gamificacion_id: string
          medallas_json: Json | null
          nivel: number | null
          puntos_xp: number | null
          tenant_id: string
          ultima_actualizacion: string | null
        }
        Insert: {
          estudiante_id: string
          gamificacion_id?: string
          medallas_json?: Json | null
          nivel?: number | null
          puntos_xp?: number | null
          tenant_id: string
          ultima_actualizacion?: string | null
        }
        Update: {
          estudiante_id?: string
          gamificacion_id?: string
          medallas_json?: Json | null
          nivel?: number | null
          puntos_xp?: number | null
          tenant_id?: string
          ultima_actualizacion?: string | null
        }
        Relationships: []
      }
      horarios: {
        Row: {
          dia_semana: string
          hora_fin: string
          hora_inicio: string
          horario_id: string
          salon: string | null
          seccion_id: string
          tenant_id: string
        }
        Insert: {
          dia_semana: string
          hora_fin: string
          hora_inicio: string
          horario_id?: string
          salon?: string | null
          seccion_id: string
          tenant_id: string
        }
        Update: {
          dia_semana?: string
          hora_fin?: string
          hora_inicio?: string
          horario_id?: string
          salon?: string | null
          seccion_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "horarios_seccion_id_fkey"
            columns: ["seccion_id"]
            isOneToOne: false
            referencedRelation: "secciones"
            referencedColumns: ["seccion_id"]
          },
        ]
      }
      item_bank_questions: {
        Row: {
          enunciado: string
          generado_por_llm: boolean | null
          item_id: string
          materia_code: string
          parametro_a_discriminacion: number | null
          parametro_b_dificultad: number | null
          tenant_id: string
        }
        Insert: {
          enunciado: string
          generado_por_llm?: boolean | null
          item_id?: string
          materia_code: string
          parametro_a_discriminacion?: number | null
          parametro_b_dificultad?: number | null
          tenant_id: string
        }
        Update: {
          enunciado?: string
          generado_por_llm?: boolean | null
          item_id?: string
          materia_code?: string
          parametro_a_discriminacion?: number | null
          parametro_b_dificultad?: number | null
          tenant_id?: string
        }
        Relationships: []
      }
      lecciones: {
        Row: {
          contenido_url: string | null
          curso_id: string
          leccion_id: string
          orden: number
          tenant_id: string
          titulo: string
        }
        Insert: {
          contenido_url?: string | null
          curso_id: string
          leccion_id?: string
          orden: number
          tenant_id: string
          titulo: string
        }
        Update: {
          contenido_url?: string | null
          curso_id?: string
          leccion_id?: string
          orden?: number
          tenant_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "lecciones_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["curso_id"]
          },
        ]
      }
      peer_review_assignments: {
        Row: {
          entregable_id: string
          evaluador_id: string
          feedback_texto: string | null
          nota_asignada: number | null
          review_id: string
          sesgo_calibrado: number | null
          tenant_id: string
        }
        Insert: {
          entregable_id: string
          evaluador_id: string
          feedback_texto?: string | null
          nota_asignada?: number | null
          review_id?: string
          sesgo_calibrado?: number | null
          tenant_id: string
        }
        Update: {
          entregable_id?: string
          evaluador_id?: string
          feedback_texto?: string | null
          nota_asignada?: number | null
          review_id?: string
          sesgo_calibrado?: number | null
          tenant_id?: string
        }
        Relationships: []
      }
      planes_matricula: {
        Row: {
          estado: string | null
          estudiante_id: string
          matricula_id: string
          seccion_id: string
          tenant_id: string
        }
        Insert: {
          estado?: string | null
          estudiante_id: string
          matricula_id?: string
          seccion_id: string
          tenant_id: string
        }
        Update: {
          estado?: string | null
          estudiante_id?: string
          matricula_id?: string
          seccion_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planes_matricula_seccion_id_fkey"
            columns: ["seccion_id"]
            isOneToOne: false
            referencedRelation: "secciones"
            referencedColumns: ["seccion_id"]
          },
        ]
      }
      secciones: {
        Row: {
          cupo_maximo: number
          curso_id: string
          periodo_academico: string
          profesor_id: string
          seccion_id: string
          tenant_id: string
        }
        Insert: {
          cupo_maximo: number
          curso_id: string
          periodo_academico: string
          profesor_id: string
          seccion_id?: string
          tenant_id: string
        }
        Update: {
          cupo_maximo?: number
          curso_id?: string
          periodo_academico?: string
          profesor_id?: string
          seccion_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "secciones_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["curso_id"]
          },
        ]
      }
      service_learning_projects: {
        Row: {
          horas_convalidadas: number
          ong_aliada: string
          project_id: string
          tenant_id: string
          titulo_proyecto: string
        }
        Insert: {
          horas_convalidadas: number
          ong_aliada: string
          project_id?: string
          tenant_id: string
          titulo_proyecto: string
        }
        Update: {
          horas_convalidadas?: number
          ong_aliada?: string
          project_id?: string
          tenant_id?: string
          titulo_proyecto?: string
        }
        Relationships: []
      }
      student_clans: {
        Row: {
          clan_id: string
          fecha_creacion: string | null
          nombre_clan: string
          racha_semanal: number | null
          tenant_id: string
          xp_acumulado: number | null
        }
        Insert: {
          clan_id?: string
          fecha_creacion?: string | null
          nombre_clan: string
          racha_semanal?: number | null
          tenant_id: string
          xp_acumulado?: number | null
        }
        Update: {
          clan_id?: string
          fecha_creacion?: string | null
          nombre_clan?: string
          racha_semanal?: number | null
          tenant_id?: string
          xp_acumulado?: number | null
        }
        Relationships: []
      }
      virtual_lab_simulations: {
        Row: {
          estudiante_id: string
          fecha_simulacion: string | null
          inputs_json: Json
          laboratorio_tipo: string
          resultado_obtenido: number
          simulation_id: string
          tenant_id: string
        }
        Insert: {
          estudiante_id: string
          fecha_simulacion?: string | null
          inputs_json: Json
          laboratorio_tipo: string
          resultado_obtenido: number
          simulation_id?: string
          tenant_id: string
        }
        Update: {
          estudiante_id?: string
          fecha_simulacion?: string | null
          inputs_json?: Json
          laboratorio_tipo?: string
          resultado_obtenido?: number
          simulation_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  finanzas: {
    Tables: {
      aprobaciones_transaccion: {
        Row: {
          comentario: string | null
          created_at: string
          estado: string
          id: string
          id_transaccion: string
          requested_at: string
          resolved_at: string | null
          resuelto_por: string | null
          solicitado_por: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          estado?: string
          id?: string
          id_transaccion: string
          requested_at?: string
          resolved_at?: string | null
          resuelto_por?: string | null
          solicitado_por?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          comentario?: string | null
          created_at?: string
          estado?: string
          id?: string
          id_transaccion?: string
          requested_at?: string
          resolved_at?: string | null
          resuelto_por?: string | null
          solicitado_por?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aprobaciones_transaccion_id_transaccion_fkey"
            columns: ["id_transaccion"]
            isOneToOne: false
            referencedRelation: "transacciones"
            referencedColumns: ["id"]
          },
        ]
      }
      cat_tipos_cuenta: {
        Row: {
          codigo: string
          nombre: string
        }
        Insert: {
          codigo: string
          nombre: string
        }
        Update: {
          codigo?: string
          nombre?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          nombre: string
          tenant_id: string
          tipo: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          nombre: string
          tenant_id?: string
          tipo: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          nombre?: string
          tenant_id?: string
          tipo?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      comprobantes_financieros: {
        Row: {
          created_at: string | null
          created_by: string | null
          emisor_nombre: string | null
          emisor_ruc_dni: string | null
          id: string
          id_transaccion: string
          numero_comprobante: string
          tenant_id: string
          tipo_comprobante: string
          updated_at: string | null
          updated_by: string | null
          url_archivo: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          emisor_nombre?: string | null
          emisor_ruc_dni?: string | null
          id?: string
          id_transaccion: string
          numero_comprobante: string
          tenant_id?: string
          tipo_comprobante: string
          updated_at?: string | null
          updated_by?: string | null
          url_archivo?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          emisor_nombre?: string | null
          emisor_ruc_dni?: string | null
          id?: string
          id_transaccion?: string
          numero_comprobante?: string
          tenant_id?: string
          tipo_comprobante?: string
          updated_at?: string | null
          updated_by?: string | null
          url_archivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comprobantes_financieros_id_transaccion_fkey"
            columns: ["id_transaccion"]
            isOneToOne: false
            referencedRelation: "transacciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_fin_comp_id_transaccion"
            columns: ["id_transaccion"]
            isOneToOne: false
            referencedRelation: "transacciones"
            referencedColumns: ["id"]
          },
        ]
      }
      cuentas: {
        Row: {
          activa: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          moneda: string
          nombre_cuenta: string
          saldo_actual: number
          tenant_id: string
          tipo_cuenta: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          activa?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          moneda?: string
          nombre_cuenta: string
          saldo_actual?: number
          tenant_id?: string
          tipo_cuenta: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          activa?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          moneda?: string
          nombre_cuenta?: string
          saldo_actual?: number
          tenant_id?: string
          tipo_cuenta?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_finanzas_cuentas_tipo_cuenta"
            columns: ["tipo_cuenta"]
            isOneToOne: false
            referencedRelation: "cat_tipos_cuenta"
            referencedColumns: ["codigo"]
          },
        ]
      }
      faculty_lifecycle_payroll: {
        Row: {
          estado_pago: string | null
          horas_dictadas: number
          monto_total: number
          payroll_id: string
          profesor_id: string
          tarifa_hora: number
          tenant_id: string
        }
        Insert: {
          estado_pago?: string | null
          horas_dictadas: number
          monto_total: number
          payroll_id?: string
          profesor_id: string
          tarifa_hora: number
          tenant_id: string
        }
        Update: {
          estado_pago?: string | null
          horas_dictadas?: number
          monto_total?: number
          payroll_id?: string
          profesor_id?: string
          tarifa_hora?: number
          tenant_id?: string
        }
        Relationships: []
      }
      local_payment_transactions: {
        Row: {
          apoderado_id: string
          estado: string | null
          fecha_pago: string | null
          monto: number
          proveedor_pago: string
          tenant_id: string
          transaction_id: string
          webhook_signature: string
        }
        Insert: {
          apoderado_id: string
          estado?: string | null
          fecha_pago?: string | null
          monto: number
          proveedor_pago: string
          tenant_id: string
          transaction_id?: string
          webhook_signature: string
        }
        Update: {
          apoderado_id?: string
          estado?: string | null
          fecha_pago?: string | null
          monto?: number
          proveedor_pago?: string
          tenant_id?: string
          transaction_id?: string
          webhook_signature?: string
        }
        Relationships: []
      }
      marketplace_productos: {
        Row: {
          nombre_producto: string
          precio: number
          producto_id: string
          stock: number | null
          tenant_id: string
          vendedor_id: string
        }
        Insert: {
          nombre_producto: string
          precio: number
          producto_id?: string
          stock?: number | null
          tenant_id: string
          vendedor_id: string
        }
        Update: {
          nombre_producto?: string
          precio?: number
          producto_id?: string
          stock?: number | null
          tenant_id?: string
          vendedor_id?: string
        }
        Relationships: []
      }
      pagos: {
        Row: {
          estado: string | null
          fecha_pago: string | null
          moneda: string | null
          monto: number
          pago_id: string
          tenant_id: string
          usuario_id: string
        }
        Insert: {
          estado?: string | null
          fecha_pago?: string | null
          moneda?: string | null
          monto: number
          pago_id?: string
          tenant_id: string
          usuario_id: string
        }
        Update: {
          estado?: string | null
          fecha_pago?: string | null
          moneda?: string | null
          monto?: number
          pago_id?: string
          tenant_id?: string
          usuario_id?: string
        }
        Relationships: []
      }
      scholarship_financial_aids: {
        Row: {
          estado_beca: string | null
          estudiante_id: string
          porcentaje_descuento: number
          puntaje_vulnerabilidad: number
          scholarship_id: string
          tenant_id: string
        }
        Insert: {
          estado_beca?: string | null
          estudiante_id: string
          porcentaje_descuento: number
          puntaje_vulnerabilidad: number
          scholarship_id?: string
          tenant_id: string
        }
        Update: {
          estado_beca?: string | null
          estudiante_id?: string
          porcentaje_descuento?: number
          puntaje_vulnerabilidad?: number
          scholarship_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      transacciones: {
        Row: {
          comprobante_url: string | null
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          fecha_transaccion: string
          id: string
          id_categoria: string
          id_cuenta: string
          id_proyecto: string | null
          monto: number
          tenant_id: string
          tipo: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          comprobante_url?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          fecha_transaccion?: string
          id?: string
          id_categoria: string
          id_cuenta: string
          id_proyecto?: string | null
          monto: number
          tenant_id?: string
          tipo: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          comprobante_url?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          fecha_transaccion?: string
          id?: string
          id_categoria?: string
          id_cuenta?: string
          id_proyecto?: string | null
          monto?: number
          tenant_id?: string
          tipo?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_fin_trans_id_categoria"
            columns: ["id_categoria"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_fin_trans_id_cuenta"
            columns: ["id_cuenta"]
            isOneToOne: false
            referencedRelation: "cuentas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_id_categoria_fkey"
            columns: ["id_categoria"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacciones_id_cuenta_fkey"
            columns: ["id_cuenta"]
            isOneToOne: false
            referencedRelation: "cuentas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  ia: {
    Tables: {
      agentes_ia_ejecuciones: {
        Row: {
          ejecucion_id: string
          fecha_ejecucion: string | null
          prompt_json: Json
          resultado_json: Json | null
          solicitante_id: string
          tenant_id: string
          tiempo_ejecucion_ms: number | null
          tipo_agente: string
        }
        Insert: {
          ejecucion_id?: string
          fecha_ejecucion?: string | null
          prompt_json: Json
          resultado_json?: Json | null
          solicitante_id: string
          tenant_id: string
          tiempo_ejecucion_ms?: number | null
          tipo_agente: string
        }
        Update: {
          ejecucion_id?: string
          fecha_ejecucion?: string | null
          prompt_json?: Json
          resultado_json?: Json | null
          solicitante_id?: string
          tenant_id?: string
          tiempo_ejecucion_ms?: number | null
          tipo_agente?: string
        }
        Relationships: []
      }
      proctoring_ai_sessions: {
        Row: {
          estudiante_id: string
          fecha_supervision: string | null
          flags_incidencias_json: Json
          proctoring_score: number
          session_id: string
          tenant_id: string
        }
        Insert: {
          estudiante_id: string
          fecha_supervision?: string | null
          flags_incidencias_json: Json
          proctoring_score: number
          session_id?: string
          tenant_id: string
        }
        Update: {
          estudiante_id?: string
          fecha_supervision?: string | null
          flags_incidencias_json?: Json
          proctoring_score?: number
          session_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  identidad: {
    Tables: {
      alumni_lifelong_directory: {
        Row: {
          alumni_id: string
          anio_graduacion: number
          carnet_digital_hash: string
          empresa_actual: string | null
          exalumno_id: string
          tenant_id: string
        }
        Insert: {
          alumni_id?: string
          anio_graduacion: number
          carnet_digital_hash: string
          empresa_actual?: string | null
          exalumno_id: string
          tenant_id: string
        }
        Update: {
          alumni_id?: string
          anio_graduacion?: number
          carnet_digital_hash?: string
          empresa_actual?: string | null
          exalumno_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      pasaportes_digitales: {
        Row: {
          blockchain_tx_hash: string | null
          estudiante_id: string
          fecha_emision: string | null
          habilidades_validadas_json: Json | null
          pasaporte_id: string
          tenant_id: string
        }
        Insert: {
          blockchain_tx_hash?: string | null
          estudiante_id: string
          fecha_emision?: string | null
          habilidades_validadas_json?: Json | null
          pasaporte_id?: string
          tenant_id: string
        }
        Update: {
          blockchain_tx_hash?: string | null
          estudiante_id?: string
          fecha_emision?: string | null
          habilidades_validadas_json?: Json | null
          pasaporte_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  institution: {
    Tables: {
      asset_predictive_maintenances: {
        Row: {
          asset_id: string
          fecha_proximo_mantenimiento: string | null
          nombre_equipo: string
          qr_rfid_tag: string
          riesgo_fallo_porcentaje: number | null
          tenant_id: string
        }
        Insert: {
          asset_id?: string
          fecha_proximo_mantenimiento?: string | null
          nombre_equipo: string
          qr_rfid_tag: string
          riesgo_fallo_porcentaje?: number | null
          tenant_id: string
        }
        Update: {
          asset_id?: string
          fecha_proximo_mantenimiento?: string | null
          nombre_equipo?: string
          qr_rfid_tag?: string
          riesgo_fallo_porcentaje?: number | null
          tenant_id?: string
        }
        Relationships: []
      }
      board_governance_resolutions: {
        Row: {
          documento_hash: string
          fecha_firma: string | null
          quorum_validado: boolean | null
          resolution_id: string
          tenant_id: string
          titulo_acta: string
        }
        Insert: {
          documento_hash: string
          fecha_firma?: string | null
          quorum_validado?: boolean | null
          resolution_id?: string
          tenant_id: string
          titulo_acta: string
        }
        Update: {
          documento_hash?: string
          fecha_firma?: string | null
          quorum_validado?: boolean | null
          resolution_id?: string
          tenant_id?: string
          titulo_acta?: string
        }
        Relationships: []
      }
      emergency_crisis_events: {
        Row: {
          evacuados_conteo: number | null
          event_id: string
          fecha_activacion: string | null
          tenant_id: string
          tipo_emergencia: string
          zonas_afectadas: Json
        }
        Insert: {
          evacuados_conteo?: number | null
          event_id?: string
          fecha_activacion?: string | null
          tenant_id: string
          tipo_emergencia: string
          zonas_afectadas: Json
        }
        Update: {
          evacuados_conteo?: number | null
          event_id?: string
          fecha_activacion?: string | null
          tenant_id?: string
          tipo_emergencia?: string
          zonas_afectadas?: Json
        }
        Relationships: []
      }
      esg_impact_dashboards: {
        Row: {
          certificado_gri_hash: string
          esg_id: string
          papel_ahorrado_hojas: number
          score_diversidad: number
          tenant_id: string
        }
        Insert: {
          certificado_gri_hash: string
          esg_id?: string
          papel_ahorrado_hojas: number
          score_diversidad: number
          tenant_id: string
        }
        Update: {
          certificado_gri_hash?: string
          esg_id?: string
          papel_ahorrado_hojas?: number
          score_diversidad?: number
          tenant_id?: string
        }
        Relationships: []
      }
      facility_reservations: {
        Row: {
          codigo_qr_acceso: string
          espacio_nombre: string
          estado: string | null
          fecha_reserva: string
          hora_fin: string
          hora_inicio: string
          reservation_id: string
          solicitante_id: string
          tenant_id: string
        }
        Insert: {
          codigo_qr_acceso: string
          espacio_nombre: string
          estado?: string | null
          fecha_reserva: string
          hora_fin: string
          hora_inicio: string
          reservation_id?: string
          solicitante_id: string
          tenant_id: string
        }
        Update: {
          codigo_qr_acceso?: string
          espacio_nombre?: string
          estado?: string | null
          fecha_reserva?: string
          hora_fin?: string
          hora_inicio?: string
          reservation_id?: string
          solicitante_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      public_audit_reports: {
        Row: {
          fecha_publicacion: string | null
          hash_criptografico: string
          indicadores_anonimizados_json: Json
          periodo_academico: string
          report_id: string
          tenant_id: string
        }
        Insert: {
          fecha_publicacion?: string | null
          hash_criptografico: string
          indicadores_anonimizados_json: Json
          periodo_academico: string
          report_id?: string
          tenant_id: string
        }
        Update: {
          fecha_publicacion?: string | null
          hash_criptografico?: string
          indicadores_anonimizados_json?: Json
          periodo_academico?: string
          report_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      schedule_genetic_optimizations: {
        Row: {
          fecha_generacion: string | null
          fitness_score: number
          matriz_horarios_json: Json
          optimization_id: string
          periodo_academico: string
          tenant_id: string
        }
        Insert: {
          fecha_generacion?: string | null
          fitness_score: number
          matriz_horarios_json: Json
          optimization_id?: string
          periodo_academico: string
          tenant_id: string
        }
        Update: {
          fecha_generacion?: string | null
          fitness_score?: number
          matriz_horarios_json?: Json
          optimization_id?: string
          periodo_academico?: string
          tenant_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      access_links: {
        Row: {
          assigned_role_id: string | null
          assigned_sede_id: string | null
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          metadata: Json
          onboarding_flow: string | null
          slug: string | null
          target_id: string | null
          target_type: string
          tenant_id: string
          type: string
          updated_at: string
          updated_by: string | null
          used_count: number
        }
        Insert: {
          assigned_role_id?: string | null
          assigned_sede_id?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          metadata?: Json
          onboarding_flow?: string | null
          slug?: string | null
          target_id?: string | null
          target_type: string
          tenant_id: string
          type: string
          updated_at?: string
          updated_by?: string | null
          used_count?: number
        }
        Update: {
          assigned_role_id?: string | null
          assigned_sede_id?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          metadata?: Json
          onboarding_flow?: string | null
          slug?: string | null
          target_id?: string | null
          target_type?: string
          tenant_id?: string
          type?: string
          updated_at?: string
          updated_by?: string | null
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "access_links_assigned_role_id_fkey"
            columns: ["assigned_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_links_assigned_sede_id_fkey"
            columns: ["assigned_sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      aprobaciones: {
        Row: {
          aprobador_id: string | null
          comentarios: string | null
          created_at: string | null
          created_by: string | null
          entidad_id: string
          entidad_tipo: string
          estado: string | null
          fecha_resolucion: string | null
          id: string
          tenant_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          aprobador_id?: string | null
          comentarios?: string | null
          created_at?: string | null
          created_by?: string | null
          entidad_id: string
          entidad_tipo: string
          estado?: string | null
          fecha_resolucion?: string | null
          id?: string
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          aprobador_id?: string | null
          comentarios?: string | null
          created_at?: string | null
          created_by?: string | null
          entidad_id?: string
          entidad_tipo?: string
          estado?: string | null
          fecha_resolucion?: string | null
          id?: string
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      async_report_jobs: {
        Row: {
          completed_at: string | null
          download_url: string | null
          enqueued_at: string | null
          id: string
          job_id: string | null
          progress_percentage: number | null
          report_type: string | null
          requested_by: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          download_url?: string | null
          enqueued_at?: string | null
          id?: string
          job_id?: string | null
          progress_percentage?: number | null
          report_type?: string | null
          requested_by?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          download_url?: string | null
          enqueued_at?: string | null
          id?: string
          job_id?: string | null
          progress_percentage?: number | null
          report_type?: string | null
          requested_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      attendance_geofence_logs: {
        Row: {
          calculated_distance_meters: number | null
          event_id: string | null
          id: string
          is_valid: boolean | null
          logged_at: string | null
          max_radius_meters: number | null
          target_latitude: number | null
          target_longitude: number | null
          user_id: string | null
          user_latitude: number | null
          user_longitude: number | null
        }
        Insert: {
          calculated_distance_meters?: number | null
          event_id?: string | null
          id?: string
          is_valid?: boolean | null
          logged_at?: string | null
          max_radius_meters?: number | null
          target_latitude?: number | null
          target_longitude?: number | null
          user_id?: string | null
          user_latitude?: number | null
          user_longitude?: number | null
        }
        Update: {
          calculated_distance_meters?: number | null
          event_id?: string | null
          id?: string
          is_valid?: boolean | null
          logged_at?: string | null
          max_radius_meters?: number | null
          target_latitude?: number | null
          target_longitude?: number | null
          user_id?: string | null
          user_latitude?: number | null
          user_longitude?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          ip: unknown
          payload_after: Json | null
          payload_before: Json | null
          resource_name: string
          retention_until: string | null
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip?: unknown
          payload_after?: Json | null
          payload_before?: Json | null
          resource_name: string
          retention_until?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip?: unknown
          payload_after?: Json | null
          payload_before?: Json | null
          resource_name?: string
          retention_until?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_events: {
        Row: {
          created_at: string
          created_by: string | null
          device_id: string | null
          error_code: string | null
          event_type: string
          id: string
          ip: unknown
          result: string
          session_id: string | null
          tenant_id: string
          terminal_id: string | null
          updated_at: string | null
          updated_by: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          device_id?: string | null
          error_code?: string | null
          event_type: string
          id?: string
          ip?: unknown
          result: string
          session_id?: string | null
          tenant_id?: string
          terminal_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          device_id?: string | null
          error_code?: string | null
          event_type?: string
          id?: string
          ip?: unknown
          result?: string
          session_id?: string | null
          tenant_id?: string
          terminal_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auth_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auth_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auth_events_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "terminals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auth_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auth_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_session_context"
            referencedColumns: ["user_id"]
          },
        ]
      }
      auto_purchase_orders: {
        Row: {
          current_global_stock: number | null
          generated_at: string | null
          id: string
          item_id: string | null
          item_name: string | null
          min_stock_threshold: number | null
          purchase_order_id: string | null
          status: string | null
          suggested_order_quantity: number | null
        }
        Insert: {
          current_global_stock?: number | null
          generated_at?: string | null
          id?: string
          item_id?: string | null
          item_name?: string | null
          min_stock_threshold?: number | null
          purchase_order_id?: string | null
          status?: string | null
          suggested_order_quantity?: number | null
        }
        Update: {
          current_global_stock?: number | null
          generated_at?: string | null
          id?: string
          item_id?: string | null
          item_name?: string | null
          min_stock_threshold?: number | null
          purchase_order_id?: string | null
          status?: string | null
          suggested_order_quantity?: number | null
        }
        Relationships: []
      }
      bank_reconciliation_matches: {
        Row: {
          bank_amount: number | null
          bank_operation_code: string | null
          id: string
          matched_at: string | null
          statement_id: string | null
          status: string | null
          system_voucher_id: string | null
        }
        Insert: {
          bank_amount?: number | null
          bank_operation_code?: string | null
          id?: string
          matched_at?: string | null
          statement_id?: string | null
          status?: string | null
          system_voucher_id?: string | null
        }
        Update: {
          bank_amount?: number | null
          bank_operation_code?: string | null
          id?: string
          matched_at?: string | null
          statement_id?: string | null
          status?: string | null
          system_voucher_id?: string | null
        }
        Relationships: []
      }
      bank_statements: {
        Row: {
          id: string
          match_rate_percentage: number | null
          matched_count: number | null
          reconciled_at: string | null
          statement_format: string | null
          total_transactions: number | null
          unmatched_bank_count: number | null
        }
        Insert: {
          id?: string
          match_rate_percentage?: number | null
          matched_count?: number | null
          reconciled_at?: string | null
          statement_format?: string | null
          total_transactions?: number | null
          unmatched_bank_count?: number | null
        }
        Update: {
          id?: string
          match_rate_percentage?: number | null
          matched_count?: number | null
          reconciled_at?: string | null
          statement_format?: string | null
          total_transactions?: number | null
          unmatched_bank_count?: number | null
        }
        Relationships: []
      }
      battle_pass_progression: {
        Row: {
          fecha_fin: string
          fecha_inicio: string
          id_progression: string
          id_usuario: string
          progreso_porcentaje: number
          recompensas_desbloqueadas: number
          temporada: string
          tier_actual: number
          tipo: string
        }
        Insert: {
          fecha_fin: string
          fecha_inicio: string
          id_progression?: string
          id_usuario: string
          progreso_porcentaje?: number
          recompensas_desbloqueadas?: number
          temporada?: string
          tier_actual?: number
          tipo?: string
        }
        Update: {
          fecha_fin?: string
          fecha_inicio?: string
          id_progression?: string
          id_usuario?: string
          progreso_porcentaje?: number
          recompensas_desbloqueadas?: number
          temporada?: string
          tier_actual?: number
          tipo?: string
        }
        Relationships: []
      }
      biometric_signatures: {
        Row: {
          document_type: string | null
          id: string
          ip_address: string | null
          sealed_at: string | null
          sha256_seal: string | null
          signature_id: string | null
          signature_size_bytes: number | null
          signer_id: string | null
          status: string | null
          user_agent: string | null
        }
        Insert: {
          document_type?: string | null
          id?: string
          ip_address?: string | null
          sealed_at?: string | null
          sha256_seal?: string | null
          signature_id?: string | null
          signature_size_bytes?: number | null
          signer_id?: string | null
          status?: string | null
          user_agent?: string | null
        }
        Update: {
          document_type?: string | null
          id?: string
          ip_address?: string | null
          sealed_at?: string | null
          sha256_seal?: string | null
          signature_id?: string | null
          signature_size_bytes?: number | null
          signer_id?: string | null
          status?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      candidate_ocr_scoring: {
        Row: {
          candidate_id: string | null
          document_match: boolean | null
          extracted_document_number: string | null
          extracted_full_name: string | null
          full_name_similarity: number | null
          id: string
          levenshtein_distance: number | null
          ocr_confidence_percentage: number | null
          recommendation: string | null
          scored_at: string | null
          total_score: number | null
        }
        Insert: {
          candidate_id?: string | null
          document_match?: boolean | null
          extracted_document_number?: string | null
          extracted_full_name?: string | null
          full_name_similarity?: number | null
          id?: string
          levenshtein_distance?: number | null
          ocr_confidence_percentage?: number | null
          recommendation?: string | null
          scored_at?: string | null
          total_score?: number | null
        }
        Update: {
          candidate_id?: string | null
          document_match?: boolean | null
          extracted_document_number?: string | null
          extracted_full_name?: string | null
          full_name_similarity?: number | null
          id?: string
          levenshtein_distance?: number | null
          ocr_confidence_percentage?: number | null
          recommendation?: string | null
          scored_at?: string | null
          total_score?: number | null
        }
        Relationships: []
      }
      cat_code_types: {
        Row: {
          created_at: string
          description: string
          id: string
          module: string
          public_lookup: boolean
        }
        Insert: {
          created_at?: string
          description: string
          id: string
          module?: string
          public_lookup?: boolean
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          module?: string
          public_lookup?: boolean
        }
        Relationships: []
      }
      cat_generos: {
        Row: {
          activo: boolean | null
          codigo: string
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          codigo: string
          nombre: string
        }
        Update: {
          activo?: boolean | null
          codigo?: string
          nombre?: string
        }
        Relationships: []
      }
      cat_industry_types: {
        Row: {
          created_at: string
          description: string
          id: string
        }
        Insert: {
          created_at?: string
          description: string
          id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      cat_invoice_statuses: {
        Row: {
          created_at: string
          description: string
          id: string
        }
        Insert: {
          created_at?: string
          description: string
          id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      cat_module_statuses: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          created_by: string | null
          descripcion: string | null
          nombre: string
          orden: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          nombre: string
          orden?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          nombre?: string
          orden?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      cat_monedas: {
        Row: {
          activo: boolean | null
          codigo: string
          nombre: string
          simbolo: string
        }
        Insert: {
          activo?: boolean | null
          codigo: string
          nombre: string
          simbolo: string
        }
        Update: {
          activo?: boolean | null
          codigo?: string
          nombre?: string
          simbolo?: string
        }
        Relationships: []
      }
      cat_paises: {
        Row: {
          activo: boolean | null
          codigo: string
          codigo_telefonico: string | null
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          codigo: string
          codigo_telefonico?: string | null
          nombre: string
        }
        Update: {
          activo?: boolean | null
          codigo?: string
          codigo_telefonico?: string | null
          nombre?: string
        }
        Relationships: []
      }
      cat_payment_statuses: {
        Row: {
          created_at: string
          description: string
          id: string
        }
        Insert: {
          created_at?: string
          description: string
          id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      cat_permissions: {
        Row: {
          created_at: string
          description: string
          id: string
          module: string
        }
        Insert: {
          created_at?: string
          description: string
          id: string
          module?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          module?: string
        }
        Relationships: []
      }
      cat_plan_types: {
        Row: {
          created_at: string
          description: string
          id: string
        }
        Insert: {
          created_at?: string
          description: string
          id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      cat_subscription_change_statuses: {
        Row: {
          created_at: string
          description: string
          id: string
        }
        Insert: {
          created_at?: string
          description: string
          id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      cat_subscription_statuses: {
        Row: {
          created_at: string
          description: string
          id: string
        }
        Insert: {
          created_at?: string
          description: string
          id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      cat_tenant_statuses: {
        Row: {
          created_at: string
          description: string
          id: string
        }
        Insert: {
          created_at?: string
          description: string
          id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      cat_tipos_documento: {
        Row: {
          activo: boolean | null
          codigo: string
          nombre: string
          requiere_caducidad: boolean | null
        }
        Insert: {
          activo?: boolean | null
          codigo: string
          nombre: string
          requiere_caducidad?: boolean | null
        }
        Update: {
          activo?: boolean | null
          codigo?: string
          nombre?: string
          requiere_caducidad?: boolean | null
        }
        Relationships: []
      }
      clan_miembros: {
        Row: {
          contribucion_xp: number | null
          fecha_union: string
          id_clan: string
          id_usuario: string
          rol_clan: string | null
        }
        Insert: {
          contribucion_xp?: number | null
          fecha_union?: string
          id_clan: string
          id_usuario: string
          rol_clan?: string | null
        }
        Update: {
          contribucion_xp?: number | null
          fecha_union?: string
          id_clan?: string
          id_usuario?: string
          rol_clan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clan_miembros_id_clan_fkey"
            columns: ["id_clan"]
            isOneToOne: false
            referencedRelation: "clanes"
            referencedColumns: ["id_clan"]
          },
        ]
      }
      clanes: {
        Row: {
          capacidad_maxima: number
          descripcion: string | null
          fecha_creacion: string
          id_clan: string
          id_gimnasio: string | null
          id_lider: string | null
          nombre: string
          ranking: number | null
          xp_clan: number
        }
        Insert: {
          capacidad_maxima?: number
          descripcion?: string | null
          fecha_creacion?: string
          id_clan?: string
          id_gimnasio?: string | null
          id_lider?: string | null
          nombre: string
          ranking?: number | null
          xp_clan?: number
        }
        Update: {
          capacidad_maxima?: number
          descripcion?: string | null
          fecha_creacion?: string
          id_clan?: string
          id_gimnasio?: string | null
          id_lider?: string | null
          nombre?: string
          ranking?: number | null
          xp_clan?: number
        }
        Relationships: []
      }
      cms_posts: {
        Row: {
          author_id: string | null
          clean_html_content: string | null
          id: string
          post_id: string | null
          published_at: string | null
          slug: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          author_id?: string | null
          clean_html_content?: string | null
          id?: string
          post_id?: string | null
          published_at?: string | null
          slug?: string | null
          status?: string | null
          title?: string | null
        }
        Update: {
          author_id?: string | null
          clean_html_content?: string | null
          id?: string
          post_id?: string | null
          published_at?: string | null
          slug?: string | null
          status?: string | null
          title?: string | null
        }
        Relationships: []
      }
      code_grants: {
        Row: {
          code_id: string
          role_id: string
        }
        Insert: {
          code_id: string
          role_id: string
        }
        Update: {
          code_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_grants_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "code_grants_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      code_usages: {
        Row: {
          code_id: string
          id: string
          ip_address: unknown
          metadata: Json
          module_name: string
          observations: string | null
          tenant_id: string
          used_at: string
          used_by: string | null
        }
        Insert: {
          code_id: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          module_name: string
          observations?: string | null
          tenant_id: string
          used_at?: string
          used_by?: string | null
        }
        Update: {
          code_id?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          module_name?: string
          observations?: string | null
          tenant_id?: string
          used_at?: string
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "code_usages_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "code_usages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      codes: {
        Row: {
          code: string
          code_type: string | null
          context_payload: Json
          created_at: string
          created_by: string | null
          current_uses: number
          description: string | null
          expires_at: string | null
          id: string
          max_uses: number | null
          metadata: Json
          status: string
          tenant_id: string
          type_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          code_type?: string | null
          context_payload?: Json
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          metadata?: Json
          status?: string
          tenant_id: string
          type_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          code_type?: string | null
          context_payload?: Json
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          metadata?: Json
          status?: string
          tenant_id?: string
          type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "codes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codes_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "cat_code_types"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_clients: {
        Row: {
          cantidad_empleados: number
          cantidad_membresias: number
          contacto_hr: string
          email_hr: string | null
          estado: string
          fecha_inicio_contrato: string
          fecha_renovacion: string | null
          id_corporativo: string
          nombre_empresa: string
          precio_por_empleado: number
        }
        Insert: {
          cantidad_empleados?: number
          cantidad_membresias?: number
          contacto_hr: string
          email_hr?: string | null
          estado?: string
          fecha_inicio_contrato?: string
          fecha_renovacion?: string | null
          id_corporativo?: string
          nombre_empresa: string
          precio_por_empleado?: number
        }
        Update: {
          cantidad_empleados?: number
          cantidad_membresias?: number
          contacto_hr?: string
          email_hr?: string | null
          estado?: string
          fecha_inicio_contrato?: string
          fecha_renovacion?: string | null
          id_corporativo?: string
          nombre_empresa?: string
          precio_por_empleado?: number
        }
        Relationships: []
      }
      corporate_leaderboards: {
        Row: {
          departamento: string
          fecha_actualizacion: string
          id_corporativo: string | null
          id_leaderboard: string
          ranking: number | null
          xp_acumulado: number
        }
        Insert: {
          departamento: string
          fecha_actualizacion?: string
          id_corporativo?: string | null
          id_leaderboard?: string
          ranking?: number | null
          xp_acumulado?: number
        }
        Update: {
          departamento?: string
          fecha_actualizacion?: string
          id_corporativo?: string | null
          id_leaderboard?: string
          ranking?: number | null
          xp_acumulado?: number
        }
        Relationships: [
          {
            foreignKeyName: "corporate_leaderboards_id_corporativo_fkey"
            columns: ["id_corporativo"]
            isOneToOne: false
            referencedRelation: "corporate_clients"
            referencedColumns: ["id_corporativo"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string
          created_by: string | null
          device_fingerprint: string
          device_type: string | null
          id: string
          is_trusted: boolean
          last_ip: unknown
          last_seen_at: string | null
          last_user_agent: string | null
          tenant_id: string
          updated_at: string | null
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          device_fingerprint: string
          device_type?: string | null
          id?: string
          is_trusted?: boolean
          last_ip?: unknown
          last_seen_at?: string | null
          last_user_agent?: string | null
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          device_fingerprint?: string
          device_type?: string | null
          id?: string
          is_trusted?: boolean
          last_ip?: unknown
          last_seen_at?: string | null
          last_user_agent?: string | null
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_session_context"
            referencedColumns: ["user_id"]
          },
        ]
      }
      dynamic_forms: {
        Row: {
          context_type: string | null
          created_at: string
          created_by: string | null
          form_schema: Json
          id: string
          is_active: boolean
          name: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          context_type?: string | null
          created_at?: string
          created_by?: string | null
          form_schema?: Json
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          context_type?: string | null
          created_at?: string
          created_by?: string | null
          form_schema?: Json
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_forms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dynamic_pricing_log: {
        Row: {
          actividad: string | null
          fecha_cambio: string
          id_gimnasio: string | null
          id_pricing: string
          precio_anterior: number | null
          precio_nuevo: number | null
          razon: string | null
          zona_geografica: string | null
        }
        Insert: {
          actividad?: string | null
          fecha_cambio?: string
          id_gimnasio?: string | null
          id_pricing?: string
          precio_anterior?: number | null
          precio_nuevo?: number | null
          razon?: string | null
          zona_geografica?: string | null
        }
        Update: {
          actividad?: string | null
          fecha_cambio?: string
          id_gimnasio?: string | null
          id_pricing?: string
          precio_anterior?: number | null
          precio_nuevo?: number | null
          razon?: string | null
          zona_geografica?: string | null
        }
        Relationships: []
      }
      entitlements: {
        Row: {
          can_use_terminals: boolean
          created_at: string | null
          created_by: string | null
          effective_from: string
          max_licenses: number
          max_sedes: number
          plan_id: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          can_use_terminals: boolean
          created_at?: string | null
          created_by?: string | null
          effective_from?: string
          max_licenses: number
          max_sedes: number
          plan_id: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          can_use_terminals?: boolean
          created_at?: string | null
          created_by?: string | null
          effective_from?: string
          max_licenses?: number
          max_sedes?: number
          plan_id?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "cat_plan_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gdpr_export_requests: {
        Row: {
          exported_at: string | null
          id: string
          package_json: Json | null
          user_id: string | null
        }
        Insert: {
          exported_at?: string | null
          id?: string
          package_json?: Json | null
          user_id?: string | null
        }
        Update: {
          exported_at?: string | null
          id?: string
          package_json?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      inventory_transfers: {
        Row: {
          approved_by: string | null
          dispatched_at: string | null
          id: string
          item_id: string | null
          quantity: number | null
          requested_at: string | null
          requested_by: string | null
          source_sede_id: string | null
          status: string | null
          target_sede_id: string | null
          transfer_id: string | null
        }
        Insert: {
          approved_by?: string | null
          dispatched_at?: string | null
          id?: string
          item_id?: string | null
          quantity?: number | null
          requested_at?: string | null
          requested_by?: string | null
          source_sede_id?: string | null
          status?: string | null
          target_sede_id?: string | null
          transfer_id?: string | null
        }
        Update: {
          approved_by?: string | null
          dispatched_at?: string | null
          id?: string
          item_id?: string | null
          quantity?: number | null
          requested_at?: string | null
          requested_by?: string | null
          source_sede_id?: string | null
          status?: string | null
          target_sede_id?: string | null
          transfer_id?: string | null
        }
        Relationships: []
      }
      invoice_lines: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          line_total: number
          qty: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          line_total?: number
          qty?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          line_total?: number
          qty?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          due_at: string | null
          id: string
          invoice_number: string | null
          issued_at: string | null
          period_end: string | null
          period_start: string | null
          status_id: string
          subtotal: number
          tax: number
          tenant_id: string
          total: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          due_at?: string | null
          id?: string
          invoice_number?: string | null
          issued_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status_id?: string
          subtotal?: number
          tax?: number
          tenant_id?: string
          total?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          due_at?: string | null
          id?: string
          invoice_number?: string | null
          issued_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status_id?: string
          subtotal?: number
          tax?: number
          tenant_id?: string
          total?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "cat_invoice_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_exam_sessions: {
        Row: {
          completed_at: string | null
          course_id: string | null
          expires_at: string | null
          id: string
          passed: boolean | null
          score_percentage: number | null
          session_id: string | null
          started_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          course_id?: string | null
          expires_at?: string | null
          id?: string
          passed?: boolean | null
          score_percentage?: number | null
          session_id?: string | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string | null
          expires_at?: string | null
          id?: string
          passed?: boolean | null
          score_percentage?: number | null
          session_id?: string | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      marketplace_transactions: {
        Row: {
          comision_gymsos: number
          estado: string
          fecha_transaccion: string
          id_transaccion: string
          id_usuario: string | null
          id_vendor: string | null
          monto: number
          tipo: string
        }
        Insert: {
          comision_gymsos: number
          estado?: string
          fecha_transaccion?: string
          id_transaccion?: string
          id_usuario?: string | null
          id_vendor?: string | null
          monto: number
          tipo: string
        }
        Update: {
          comision_gymsos?: number
          estado?: string
          fecha_transaccion?: string
          id_transaccion?: string
          id_usuario?: string | null
          id_vendor?: string | null
          monto?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_transactions_id_vendor_fkey"
            columns: ["id_vendor"]
            isOneToOne: false
            referencedRelation: "marketplace_vendors"
            referencedColumns: ["id_vendor"]
          },
        ]
      }
      marketplace_vendors: {
        Row: {
          certificaciones: string | null
          created_at: string
          descripcion: string | null
          email: string | null
          estado: string
          id_vendor: string
          nombre: string
          rating_promedio: number | null
          tarifa: number | null
          tipo: string
          total_clientes: number | null
        }
        Insert: {
          certificaciones?: string | null
          created_at?: string
          descripcion?: string | null
          email?: string | null
          estado?: string
          id_vendor?: string
          nombre: string
          rating_promedio?: number | null
          tarifa?: number | null
          tipo: string
          total_clientes?: number | null
        }
        Update: {
          certificaciones?: string | null
          created_at?: string
          descripcion?: string | null
          email?: string | null
          estado?: string
          id_vendor?: string
          nombre?: string
          rating_promedio?: number | null
          tarifa?: number | null
          tipo?: string
          total_clientes?: number | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          context_id: string
          context_type: string
          created_at: string
          created_by: string | null
          id: string
          joined_at: string
          role_id: string | null
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context_id: string
          context_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          joined_at?: string
          role_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context_id?: string
          context_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          joined_at?: string
          role_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_session_context"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mfa_challenges: {
        Row: {
          channel: string
          code_hash: string
          context: Json
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          risk_level: string
          tenant_id: string
          updated_at: string | null
          updated_by: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          channel: string
          code_hash: string
          context?: Json
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          risk_level: string
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          channel?: string
          code_hash?: string
          context?: Json
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          risk_level?: string
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_challenges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mfa_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mfa_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_session_context"
            referencedColumns: ["user_id"]
          },
        ]
      }
      module_dependencies: {
        Row: {
          created_at: string
          depends_on_module_code: string
          parent_module_code: string
        }
        Insert: {
          created_at?: string
          depends_on_module_code: string
          parent_module_code: string
        }
        Update: {
          created_at?: string
          depends_on_module_code?: string
          parent_module_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_dependencies_depends_on_module_code_fkey"
            columns: ["depends_on_module_code"]
            isOneToOne: false
            referencedRelation: "system_modules"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "module_dependencies_parent_module_code_fkey"
            columns: ["parent_module_code"]
            isOneToOne: false
            referencedRelation: "system_modules"
            referencedColumns: ["codigo"]
          },
        ]
      }
      multichannel_notifications_log: {
        Row: {
          channel: string | null
          error_message: string | null
          id: string
          provider_response_id: string | null
          recipient_id: string | null
          sent_at: string | null
          status: string | null
          template_name: string | null
        }
        Insert: {
          channel?: string | null
          error_message?: string | null
          id?: string
          provider_response_id?: string | null
          recipient_id?: string | null
          sent_at?: string | null
          status?: string | null
          template_name?: string | null
        }
        Update: {
          channel?: string | null
          error_message?: string | null
          id?: string
          provider_response_id?: string | null
          recipient_id?: string | null
          sent_at?: string | null
          status?: string | null
          template_name?: string | null
        }
        Relationships: []
      }
      offline_sync_batches: {
        Row: {
          batch_id: string | null
          device_id: string | null
          id: string
          sync_completed_at: string | null
          total_processed: number | null
          total_received: number | null
          total_rejected: number | null
        }
        Insert: {
          batch_id?: string | null
          device_id?: string | null
          id?: string
          sync_completed_at?: string | null
          total_processed?: number | null
          total_received?: number | null
          total_rejected?: number | null
        }
        Update: {
          batch_id?: string | null
          device_id?: string | null
          id?: string
          sync_completed_at?: string | null
          total_processed?: number | null
          total_received?: number | null
          total_rejected?: number | null
        }
        Relationships: []
      }
      outgoing_webhooks_config: {
        Row: {
          created_at: string | null
          event_types: Json | null
          id: string
          is_active: boolean | null
          secret_key: string | null
          target_url: string | null
          webhook_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_types?: Json | null
          id?: string
          is_active?: boolean | null
          secret_key?: string | null
          target_url?: string | null
          webhook_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_types?: Json | null
          id?: string
          is_active?: boolean | null
          secret_key?: string | null
          target_url?: string | null
          webhook_id?: string | null
        }
        Relationships: []
      }
      outgoing_webhooks_logs: {
        Row: {
          attempt: number | null
          event_type: string | null
          http_status: number | null
          id: string
          logged_at: string | null
          next_retry_at: string | null
          payload: Json | null
          success: boolean | null
          webhook_id: string | null
        }
        Insert: {
          attempt?: number | null
          event_type?: string | null
          http_status?: number | null
          id?: string
          logged_at?: string | null
          next_retry_at?: string | null
          payload?: Json | null
          success?: boolean | null
          webhook_id?: string | null
        }
        Update: {
          attempt?: number | null
          event_type?: string | null
          http_status?: number | null
          id?: string
          logged_at?: string | null
          next_retry_at?: string | null
          payload?: Json | null
          success?: boolean | null
          webhook_id?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string
          created_by: string | null
          holder_name: string | null
          id: string
          is_default: boolean
          last4: string | null
          method_type: string
          provider: string | null
          tenant_id: string
          token_ref: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          holder_name?: string | null
          id?: string
          is_default?: boolean
          last4?: string | null
          method_type: string
          provider?: string | null
          tenant_id?: string
          token_ref?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          holder_name?: string | null
          id?: string
          is_default?: boolean
          last4?: string | null
          method_type?: string
          provider?: string | null
          tenant_id?: string
          token_ref?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          donor_id: string | null
          external_payment_id: string | null
          external_reference: string | null
          gateway_provider: string | null
          id: string
          idempotency_key: string | null
          invoice_id: string | null
          metadata: Json | null
          payment_method_id: string | null
          provider: string | null
          raw_payload: Json | null
          status: string | null
          status_id: string
          subscription_change_id: string | null
          tenant_id: string
          transaction_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency?: string
          donor_id?: string | null
          external_payment_id?: string | null
          external_reference?: string | null
          gateway_provider?: string | null
          id?: string
          idempotency_key?: string | null
          invoice_id?: string | null
          metadata?: Json | null
          payment_method_id?: string | null
          provider?: string | null
          raw_payload?: Json | null
          status?: string | null
          status_id?: string
          subscription_change_id?: string | null
          tenant_id?: string
          transaction_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          donor_id?: string | null
          external_payment_id?: string | null
          external_reference?: string | null
          gateway_provider?: string | null
          id?: string
          idempotency_key?: string | null
          invoice_id?: string | null
          metadata?: Json | null
          payment_method_id?: string | null
          provider?: string | null
          raw_payload?: Json | null
          status?: string | null
          status_id?: string
          subscription_change_id?: string | null
          tenant_id?: string
          transaction_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_payment_currency"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "cat_monedas"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "payment_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_session_context"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payment_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "cat_payment_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_subscription_change_id_fkey"
            columns: ["subscription_change_id"]
            isOneToOne: false
            referencedRelation: "subscription_changes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_id: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          received_at: string
          signature_valid: boolean
          tenant_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_id: string
          id?: string
          payload: Json
          processed_at?: string | null
          provider: string
          received_at?: string
          signature_valid?: boolean
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_id?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          received_at?: string
          signature_valid?: boolean
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhook_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_policies: {
        Row: {
          can_use_terminals: boolean
          created_at: string
          max_licenses: number
          max_sedes: number
          plan_id: string
          retention_days: number
        }
        Insert: {
          can_use_terminals?: boolean
          created_at?: string
          max_licenses?: number
          max_sedes?: number
          plan_id: string
          retention_days?: number
        }
        Update: {
          can_use_terminals?: boolean
          created_at?: string
          max_licenses?: number
          max_sedes?: number
          plan_id?: string
          retention_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_policies_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: true
            referencedRelation: "cat_plan_types"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          blocked_reason: string | null
          created_at: string
          created_by: string | null
          email_verified: boolean
          full_name: string | null
          genero: string | null
          id: string
          is_blocked: boolean
          numero_documento: string | null
          pin_blocked_until: string | null
          pin_failed_attempts: number
          pin_hash: string | null
          pin_last_failed_at: string | null
          risk_blocked_until: string | null
          tenant_id: string | null
          tipo_documento: string | null
          updated_at: string
          updated_by: string | null
          verify_token_expires_at: string | null
          verify_token_hash: string | null
        }
        Insert: {
          avatar_url?: string | null
          blocked_reason?: string | null
          created_at?: string
          created_by?: string | null
          email_verified?: boolean
          full_name?: string | null
          genero?: string | null
          id: string
          is_blocked?: boolean
          numero_documento?: string | null
          pin_blocked_until?: string | null
          pin_failed_attempts?: number
          pin_hash?: string | null
          pin_last_failed_at?: string | null
          risk_blocked_until?: string | null
          tenant_id?: string | null
          tipo_documento?: string | null
          updated_at?: string
          updated_by?: string | null
          verify_token_expires_at?: string | null
          verify_token_hash?: string | null
        }
        Update: {
          avatar_url?: string | null
          blocked_reason?: string | null
          created_at?: string
          created_by?: string | null
          email_verified?: boolean
          full_name?: string | null
          genero?: string | null
          id?: string
          is_blocked?: boolean
          numero_documento?: string | null
          pin_blocked_until?: string | null
          pin_failed_attempts?: number
          pin_hash?: string | null
          pin_last_failed_at?: string | null
          risk_blocked_until?: string | null
          tenant_id?: string | null
          tipo_documento?: string | null
          updated_at?: string
          updated_by?: string | null
          verify_token_expires_at?: string | null
          verify_token_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_genero_fkey"
            columns: ["genero"]
            isOneToOne: false
            referencedRelation: "cat_generos"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tipo_documento_fkey"
            columns: ["tipo_documento"]
            isOneToOne: false
            referencedRelation: "cat_tipos_documento"
            referencedColumns: ["codigo"]
          },
        ]
      }
      role_access_constraints: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          ip_cidr: unknown
          require_trusted_device: boolean
          role_id: string
          sede_id: string | null
          tenant_id: string
          time_end: string | null
          time_start: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          ip_cidr?: unknown
          require_trusted_device?: boolean
          role_id: string
          sede_id?: string | null
          tenant_id?: string
          time_end?: string | null
          time_start?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          ip_cidr?: unknown
          require_trusted_device?: boolean
          role_id?: string
          sede_id?: string | null
          tenant_id?: string
          time_end?: string | null
          time_start?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_access_constraints_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_access_constraints_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_access_constraints_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_field_permissions: {
        Row: {
          can_edit: boolean
          can_view: boolean
          entity_name: string
          field_name: string
          id: string
          role_id: string
          tenant_id: string
        }
        Insert: {
          can_edit?: boolean
          can_view?: boolean
          entity_name: string
          field_name: string
          id?: string
          role_id: string
          tenant_id: string
        }
        Update: {
          can_edit?: boolean
          can_view?: boolean
          entity_name?: string
          field_name?: string
          id?: string
          role_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_field_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_field_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_module_access: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          module_code: string
          role_id: string
          tenant_id: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          module_code: string
          role_id: string
          tenant_id: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          module_code?: string
          role_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_module_access_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_module_access_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          permission: string
          role_id: string
        }
        Insert: {
          created_at?: string
          permission: string
          role_id: string
        }
        Update: {
          created_at?: string
          permission?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          created_by: string | null
          hierarchy_level: number
          id: string
          is_system_role: boolean
          name: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          hierarchy_level?: number
          id?: string
          is_system_role?: boolean
          name: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          hierarchy_level?: number
          id?: string
          is_system_role?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sedes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sedes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          created_by: string | null
          device_id: string | null
          expires_at: string
          id: string
          ip: unknown
          revoke_reason: string | null
          revoked_at: string | null
          session_type: string
          tenant_id: string
          terminal_id: string | null
          updated_at: string | null
          updated_by: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          device_id?: string | null
          expires_at: string
          id?: string
          ip?: unknown
          revoke_reason?: string | null
          revoked_at?: string | null
          session_type: string
          tenant_id?: string
          terminal_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          device_id?: string | null
          expires_at?: string
          id?: string
          ip?: unknown
          revoke_reason?: string | null
          revoked_at?: string | null
          session_type?: string
          tenant_id?: string
          terminal_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "terminals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_session_context"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sponsorship_subscriptions: {
        Row: {
          beneficiary_id: string | null
          donor_id: string | null
          gateway_provider: string | null
          id: string
          monthly_amount: number | null
          started_at: string | null
          status: string | null
          subscription_id: string | null
        }
        Insert: {
          beneficiary_id?: string | null
          donor_id?: string | null
          gateway_provider?: string | null
          id?: string
          monthly_amount?: number | null
          started_at?: string | null
          status?: string | null
          subscription_id?: string | null
        }
        Update: {
          beneficiary_id?: string | null
          donor_id?: string | null
          gateway_provider?: string | null
          id?: string
          monthly_amount?: number | null
          started_at?: string | null
          status?: string | null
          subscription_id?: string | null
        }
        Relationships: []
      }
      sso_saml_configurations: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          idp_issuer: string | null
          rbac_default_role: string | null
          sso_login_url: string | null
          tenant_domain: string | null
          x509_certificate: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          idp_issuer?: string | null
          rbac_default_role?: string | null
          sso_login_url?: string | null
          tenant_domain?: string | null
          x509_certificate?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          idp_issuer?: string | null
          rbac_default_role?: string | null
          sso_login_url?: string | null
          tenant_domain?: string | null
          x509_certificate?: string | null
        }
        Relationships: []
      }
      subscription_changes: {
        Row: {
          created_at: string | null
          created_by: string | null
          from_plan_id: string
          id: string
          idempotency_key: string | null
          notes: string | null
          requested_at: string
          requested_by: string | null
          status_id: string
          tenant_id: string
          to_plan_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          from_plan_id: string
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          requested_at?: string
          requested_by?: string | null
          status_id?: string
          tenant_id?: string
          to_plan_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          from_plan_id?: string
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          requested_at?: string
          requested_by?: string | null
          status_id?: string
          tenant_id?: string
          to_plan_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_changes_from_plan_id_fkey"
            columns: ["from_plan_id"]
            isOneToOne: false
            referencedRelation: "cat_plan_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_changes_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_changes_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "v_user_session_context"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscription_changes_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "cat_subscription_change_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_changes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_changes_to_plan_id_fkey"
            columns: ["to_plan_id"]
            isOneToOne: false
            referencedRelation: "cat_plan_types"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_contracts: {
        Row: {
          billing_day: number
          created_at: string
          created_by: string | null
          current_plan_id: string
          cycle_end: string | null
          cycle_start: string | null
          grace_days: number
          id: string
          read_only_at: string | null
          status_id: string
          suspended_at: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          billing_day?: number
          created_at?: string
          created_by?: string | null
          current_plan_id: string
          cycle_end?: string | null
          cycle_start?: string | null
          grace_days?: number
          id?: string
          read_only_at?: string | null
          status_id?: string
          suspended_at?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          billing_day?: number
          created_at?: string
          created_by?: string | null
          current_plan_id?: string
          cycle_end?: string | null
          cycle_start?: string | null
          grace_days?: number
          id?: string
          read_only_at?: string | null
          status_id?: string
          suspended_at?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_contracts_current_plan_id_fkey"
            columns: ["current_plan_id"]
            isOneToOne: false
            referencedRelation: "cat_plan_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_contracts_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "cat_subscription_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      system_modules: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          created_by: string | null
          current_version: string | null
          descripcion: string | null
          is_core: boolean
          is_transversal: boolean
          nombre: string
          requires_tenant: boolean
          schema_name: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          created_by?: string | null
          current_version?: string | null
          descripcion?: string | null
          is_core?: boolean
          is_transversal?: boolean
          nombre: string
          requires_tenant?: boolean
          schema_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          created_by?: string | null
          current_version?: string | null
          descripcion?: string | null
          is_core?: boolean
          is_transversal?: boolean
          nombre?: string
          requires_tenant?: boolean
          schema_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      tenant_modules: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          disabled_at: string | null
          enabled_at: string | null
          id: string
          installed_at: string
          module_code: string
          status_code: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          disabled_at?: string | null
          enabled_at?: string | null
          id?: string
          installed_at?: string
          module_code: string
          status_code?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          disabled_at?: string | null
          enabled_at?: string | null
          id?: string
          installed_at?: string
          module_code?: string
          status_code?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_modules_module_code_fkey"
            columns: ["module_code"]
            isOneToOne: false
            referencedRelation: "system_modules"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "tenant_modules_status_code_fkey"
            columns: ["status_code"]
            isOneToOne: false
            referencedRelation: "cat_module_statuses"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "tenant_modules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          billing_day: number
          created_at: string
          id: string
          industry_type_id: string
          max_licenses: number
          name: string
          plan_id: string
          status_financial_id: string
          tax_id: string
          updated_at: string
        }
        Insert: {
          billing_day?: number
          created_at?: string
          id?: string
          industry_type_id: string
          max_licenses?: number
          name: string
          plan_id: string
          status_financial_id?: string
          tax_id: string
          updated_at?: string
        }
        Update: {
          billing_day?: number
          created_at?: string
          id?: string
          industry_type_id?: string
          max_licenses?: number
          name?: string
          plan_id?: string
          status_financial_id?: string
          tax_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_industry_type_id_fkey"
            columns: ["industry_type_id"]
            isOneToOne: false
            referencedRelation: "cat_industry_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "cat_plan_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_status_financial_id_fkey"
            columns: ["status_financial_id"]
            isOneToOne: false
            referencedRelation: "cat_tenant_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      terminals: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          last_seen_at: string | null
          name: string
          sede_id: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          name: string
          sede_id: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          name?: string
          sede_id?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "terminals_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terminals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      torneos_semanales: {
        Row: {
          descripcion: string | null
          fecha_fin: string
          fecha_inicio: string
          id_gimnasio: string | null
          id_torneo: string
          nombre: string
          premios_texto: string | null
          tipo_metrica: string
        }
        Insert: {
          descripcion?: string | null
          fecha_fin: string
          fecha_inicio: string
          id_gimnasio?: string | null
          id_torneo?: string
          nombre: string
          premios_texto?: string | null
          tipo_metrica: string
        }
        Update: {
          descripcion?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id_gimnasio?: string | null
          id_torneo?: string
          nombre?: string
          premios_texto?: string | null
          tipo_metrica?: string
        }
        Relationships: []
      }
      user_permission_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          effect: string
          expires_at: string | null
          id: string
          permission: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effect: string
          expires_at?: string | null
          id?: string
          permission: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effect?: string
          expires_at?: string | null
          id?: string
          permission?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permission_overrides_permission_fkey"
            columns: ["permission"]
            isOneToOne: false
            referencedRelation: "cat_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permission_overrides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          expires_at: string | null
          id: string
          role_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          role_id: string
          tenant_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          role_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles_sedes: {
        Row: {
          created_at: string
          created_by: string | null
          role_id: string
          sede_id: string
          tenant_id: string
          updated_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          role_id: string
          sede_id: string
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          role_id?: string
          sede_id?: string
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_sedes_tenant"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_sedes_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_sedes_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sedes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_sedes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_sedes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_sedes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_session_context"
            referencedColumns: ["user_id"]
          },
        ]
      }
      volunteer_attrition_predictions: {
        Row: {
          attendance_rate_percentage: number | null
          days_since_last_activity: number | null
          evaluated_at: string | null
          id: string
          recommended_action: string | null
          risk_level: string | null
          risk_score: number | null
          volunteer_id: string | null
        }
        Insert: {
          attendance_rate_percentage?: number | null
          days_since_last_activity?: number | null
          evaluated_at?: string | null
          id?: string
          recommended_action?: string | null
          risk_level?: string | null
          risk_score?: number | null
          volunteer_id?: string | null
        }
        Update: {
          attendance_rate_percentage?: number | null
          days_since_last_activity?: number | null
          evaluated_at?: string | null
          id?: string
          recommended_action?: string | null
          risk_level?: string | null
          risk_score?: number | null
          volunteer_id?: string | null
        }
        Relationships: []
      }
      volunteer_reputation: {
        Row: {
          attendances_count: number | null
          average_rating: number | null
          badge_code: string | null
          badge_name: string | null
          calculated_at: string | null
          id: string
          justified_absences: number | null
          on_time_count: number | null
          rank_title: string | null
          reputation_score: number | null
          total_hours: number | null
          unjustified_absences: number | null
          updated_at: string | null
          volunteer_id: string | null
        }
        Insert: {
          attendances_count?: number | null
          average_rating?: number | null
          badge_code?: string | null
          badge_name?: string | null
          calculated_at?: string | null
          id?: string
          justified_absences?: number | null
          on_time_count?: number | null
          rank_title?: string | null
          reputation_score?: number | null
          total_hours?: number | null
          unjustified_absences?: number | null
          updated_at?: string | null
          volunteer_id?: string | null
        }
        Update: {
          attendances_count?: number | null
          average_rating?: number | null
          badge_code?: string | null
          badge_name?: string | null
          calculated_at?: string | null
          id?: string
          justified_absences?: number | null
          on_time_count?: number | null
          rank_title?: string | null
          reputation_score?: number | null
          total_hours?: number | null
          unjustified_absences?: number | null
          updated_at?: string | null
          volunteer_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_user_session_context: {
        Row: {
          active_memberships: Json | null
          full_name: string | null
          genero: string | null
          numero_documento: string | null
          tenant_id: string | null
          tipo_documento: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_genero_fkey"
            columns: ["genero"]
            isOneToOne: false
            referencedRelation: "cat_generos"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tipo_documento_fkey"
            columns: ["tipo_documento"]
            isOneToOne: false
            referencedRelation: "cat_tipos_documento"
            referencedColumns: ["codigo"]
          },
        ]
      }
    }
    Functions: {
      _gym_plan_to_bd: { Args: { p_plan: string }; Returns: string }
      _gym_plan_to_licenses: { Args: { p_plan: string }; Returns: number }
      fn_bootstrap_tenant: {
        Args: {
          p_billing_day?: number
          p_industry_type_id: string
          p_plan_id?: string
          p_tax_id: string
          p_tenant_name: string
        }
        Returns: string
      }
      fn_check_permission: { Args: { p_permission: string }; Returns: boolean }
      fn_complete_access_onboarding: {
        Args: { p_access_code: string; p_metadata?: Json }
        Returns: Json
      }
      fn_create_code: {
        Args: {
          p_code?: string
          p_description?: string
          p_expires_at?: string
          p_max_uses?: number
          p_metadata?: Json
          p_tenant_id: string
          p_type_id: string
        }
        Returns: Json
      }
      fn_create_staff_code: {
        Args: {
          p_custom_code?: string
          p_description?: string
          p_expires_at?: string
          p_max_uses?: number
          p_role_id: string
          p_tenant_id: string
        }
        Returns: Json
      }
      fn_current_tenant_id: { Args: never; Returns: string }
      fn_get_my_profile: { Args: never; Returns: Json }
      fn_get_user_redirect_target: { Args: never; Returns: string }
      fn_has_context_access: {
        Args: { p_context_id: string; p_user_id: string }
        Returns: boolean
      }
      fn_has_permission:
        | { Args: { p_permission: string }; Returns: boolean }
        | {
            Args: { p_permission: string; p_sede_id?: string }
            Returns: boolean
          }
      fn_is_module_enabled: {
        Args: { p_module_code: string; p_tenant_id?: string }
        Returns: boolean
      }
      fn_is_tenant_admin: { Args: never; Returns: boolean }
      fn_lookup_gym_access: { Args: { p_codigo: string }; Returns: Json }
      fn_my_permissions: {
        Args: never
        Returns: {
          permission: string
          role_name: string
        }[]
      }
      fn_remote_revoke_app_session: {
        Args: { p_reason: string; p_session_id: string }
        Returns: {
          created_at: string
          created_by: string | null
          device_id: string | null
          expires_at: string
          id: string
          ip: unknown
          revoke_reason: string | null
          revoked_at: string | null
          session_type: string
          tenant_id: string
          terminal_id: string | null
          updated_at: string | null
          updated_by: string | null
          user_agent: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_revoke_code: {
        Args: { p_code_id: string; p_reason?: string }
        Returns: Json
      }
      fn_update_my_avatar: { Args: { p_url: string }; Returns: Json }
      fn_use_code: {
        Args: {
          p_code: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_module_name: string
          p_observations?: string
          p_tenant_id?: string
          p_type_id?: string
        }
        Returns: Json
      }
      fn_validate_access_code: { Args: { p_code: string }; Returns: Json }
      fn_validate_code: {
        Args: { p_code: string; p_tenant_id?: string; p_type_id?: string }
        Returns: Json
      }
      generate_gym_code: { Args: { p_nombre: string }; Returns: string }
      get_user_gym: { Args: never; Returns: string }
      get_user_rol: { Args: never; Returns: string }
      seed_gym_roles: {
        Args: { p_target_tenant: string; p_template_tenant?: string }
        Returns: number
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  telemetria: {
    Tables: {
      estadisticas_uso: {
        Row: {
          fecha_evento: string | null
          log_id: string
          operacion: string
          payload_json: Json
          registro_id: string
          tabla_origen: string
          tenant_id: string
          usuario_id: string | null
        }
        Insert: {
          fecha_evento?: string | null
          log_id?: string
          operacion: string
          payload_json: Json
          registro_id: string
          tabla_origen: string
          tenant_id: string
          usuario_id?: string | null
        }
        Update: {
          fecha_evento?: string | null
          log_id?: string
          operacion?: string
          payload_json?: Json
          registro_id?: string
          tabla_origen?: string
          tenant_id?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  bienestar: {
    Enums: {},
  },
  core: {
    Enums: {},
  },
  educa: {
    Enums: {},
  },
  finanzas: {
    Enums: {},
  },
  ia: {
    Enums: {},
  },
  identidad: {
    Enums: {},
  },
  institution: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  telemetria: {
    Enums: {},
  },
} as const
