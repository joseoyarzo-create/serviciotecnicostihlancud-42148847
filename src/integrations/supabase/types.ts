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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          created_at: string
          direccion: string | null
          id: string
          nombre: string
          puntos: number
          telefono: string | null
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          id?: string
          nombre: string
          puntos?: number
          telefono?: string | null
        }
        Update: {
          created_at?: string
          direccion?: string | null
          id?: string
          nombre?: string
          puntos?: number
          telefono?: string | null
        }
        Relationships: []
      }
      configuracion: {
        Row: {
          id: string
          valor: boolean | null
          valor_numerico: number | null
        }
        Insert: {
          id: string
          valor?: boolean | null
          valor_numerico?: number | null
        }
        Update: {
          id?: string
          valor?: boolean | null
          valor_numerico?: number | null
        }
        Relationships: []
      }
      contador: {
        Row: {
          id: string
          valor: number
        }
        Insert: {
          id?: string
          valor?: number
        }
        Update: {
          id?: string
          valor?: number
        }
        Relationships: []
      }
      fichas: {
        Row: {
          boleta_fisica: string | null
          cliente_direccion: string | null
          cliente_nombre: string
          cliente_telefono: string | null
          created_at: string
          fecha_entrega: string | null
          fecha_ingreso: string
          fecha_reparacion: string | null
          id: string
          mecanico: string
          modelo_maquina: string
          numero_boleta: string
          numero_serie: string | null
          observaciones: string | null
          origen: string
          public_token: string
          repuestos: Json | null
          servicios: Json | null
          updated_at: string
          whatsapp_notificado: boolean
          whatsapp_notificado_at: string | null
        }
        Insert: {
          boleta_fisica?: string | null
          cliente_direccion?: string | null
          cliente_nombre: string
          cliente_telefono?: string | null
          created_at?: string
          fecha_entrega?: string | null
          fecha_ingreso: string
          fecha_reparacion?: string | null
          id?: string
          mecanico: string
          modelo_maquina: string
          numero_boleta: string
          numero_serie?: string | null
          observaciones?: string | null
          origen?: string
          public_token?: string
          repuestos?: Json | null
          servicios?: Json | null
          updated_at?: string
          whatsapp_notificado?: boolean
          whatsapp_notificado_at?: string | null
        }
        Update: {
          boleta_fisica?: string | null
          cliente_direccion?: string | null
          cliente_nombre?: string
          cliente_telefono?: string | null
          created_at?: string
          fecha_entrega?: string | null
          fecha_ingreso?: string
          fecha_reparacion?: string | null
          id?: string
          mecanico?: string
          modelo_maquina?: string
          numero_boleta?: string
          numero_serie?: string | null
          observaciones?: string | null
          origen?: string
          public_token?: string
          repuestos?: Json | null
          servicios?: Json | null
          updated_at?: string
          whatsapp_notificado?: boolean
          whatsapp_notificado_at?: string | null
        }
        Relationships: []
      }
      modelos: {
        Row: {
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      recepciones: {
        Row: {
          cadena: boolean
          cliente_id: string | null
          created_at: string
          espada: boolean
          fecha_estimada: string | null
          ficha_id: string
          funda: boolean
          id: string
          numero: string
          observaciones: string
          solicitud_id: string
          updated_at: string
        }
        Insert: {
          cadena?: boolean
          cliente_id?: string | null
          created_at?: string
          espada?: boolean
          fecha_estimada?: string | null
          ficha_id: string
          funda?: boolean
          id?: string
          numero: string
          observaciones?: string
          solicitud_id: string
          updated_at?: string
        }
        Update: {
          cadena?: boolean
          cliente_id?: string | null
          created_at?: string
          espada?: boolean
          fecha_estimada?: string | null
          ficha_id?: string
          funda?: boolean
          id?: string
          numero?: string
          observaciones?: string
          solicitud_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recepciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recepciones_ficha_id_fkey"
            columns: ["ficha_id"]
            isOneToOne: true
            referencedRelation: "fichas"
            referencedColumns: ["id"]
          },
        ]
      }
      repuestos: {
        Row: {
          codigo: string
          created_at: string
          id: string
          nombre: string
          precio: number
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: string
          nombre: string
          precio?: number
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: string
          nombre?: string
          precio?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      crear_recepcion_digital: {
        Args: {
          _cadena: boolean
          _espada: boolean
          _fecha: string
          _fecha_estimada?: string
          _funda: boolean
          _modelo: string
          _motivo: string
          _nombre: string
          _observaciones: string
          _serie: string
          _solicitud: string
          _telefono: string
        }
        Returns: {
          cadena: boolean
          cliente_id: string | null
          created_at: string
          espada: boolean
          fecha_estimada: string | null
          ficha_id: string
          funda: boolean
          id: string
          numero: string
          observaciones: string
          solicitud_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "recepciones"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_ficha_publica: {
        Args: { _token: string }
        Returns: {
          cliente_nombre: string
          cliente_telefono: string
          fecha_entrega: string
          fecha_ingreso: string
          fecha_reparacion: string
          mecanico: string
          modelo_maquina: string
          numero_boleta: string
          numero_serie: string
          observaciones: string
          repuestos: Json
          servicios: Json
        }[]
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
