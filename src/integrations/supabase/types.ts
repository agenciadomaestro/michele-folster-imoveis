export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      agency_settings: {
        Row: {
          administrator_id: string | null;
          id: boolean;
        };
        Insert: {
          administrator_id?: string | null;
          id?: boolean;
        };
        Update: {
          administrator_id?: string | null;
          id?: boolean;
        };
        Relationships: [];
      };
      broker_permissions: {
        Row: {
          pode_cadastrar_imovel: boolean;
          pode_ver_captacoes: boolean;
          pode_ver_ofertas_gerais: boolean;
          user_id: string;
        };
        Insert: {
          pode_cadastrar_imovel?: boolean;
          pode_ver_captacoes?: boolean;
          pode_ver_ofertas_gerais?: boolean;
          user_id: string;
        };
        Update: {
          pode_cadastrar_imovel?: boolean;
          pode_ver_captacoes?: boolean;
          pode_ver_ofertas_gerais?: boolean;
          user_id?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          broker_id: string | null;
          broker_name: string | null;
          capture_data: Json;
          consent: boolean;
          created_at: string;
          email: string | null;
          id: string;
          interest: string;
          loss_reason: string | null;
          message: string | null;
          name: string;
          next_action: string | null;
          next_action_date: string | null;
          notes: string | null;
          phone: string;
          property_code: string | null;
          property_id: string | null;
          property_title: string | null;
          source: string;
          source_page: string | null;
          status: string;
          temperature: string;
          timeline: Json;
          transaction_type: string;
          updated_at: string;
        };
        Insert: {
          broker_id?: string | null;
          broker_name?: string | null;
          capture_data?: Json;
          consent?: boolean;
          created_at?: string;
          email?: string | null;
          id?: string;
          interest?: string;
          loss_reason?: string | null;
          message?: string | null;
          name: string;
          next_action?: string | null;
          next_action_date?: string | null;
          notes?: string | null;
          phone: string;
          property_code?: string | null;
          property_id?: string | null;
          property_title?: string | null;
          source?: string;
          source_page?: string | null;
          status?: string;
          temperature?: string;
          timeline?: Json;
          transaction_type?: string;
          updated_at?: string;
        };
        Update: {
          broker_id?: string | null;
          broker_name?: string | null;
          capture_data?: Json;
          consent?: boolean;
          created_at?: string;
          email?: string | null;
          id?: string;
          interest?: string;
          loss_reason?: string | null;
          message?: string | null;
          name?: string;
          next_action?: string | null;
          next_action_date?: string | null;
          notes?: string | null;
          phone?: string;
          property_code?: string | null;
          property_id?: string | null;
          property_title?: string | null;
          source?: string;
          source_page?: string | null;
          status?: string;
          temperature?: string;
          timeline?: Json;
          transaction_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          active: boolean;
          created_at: string;
          creci: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          photo_url: string | null;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          creci?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          photo_url?: string | null;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          creci?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          photo_url?: string | null;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          address: string | null;
          area_built: number | null;
          area_land: number | null;
          area_useful: number | null;
          bathrooms: number | null;
          bedrooms: number | null;
          broker_id: string | null;
          city: string;
          code: string;
          condo_fee: number | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          featured: boolean;
          features: string[];
          id: string;
          iptu: number | null;
          neighborhood: string | null;
          parking: number | null;
          purpose: string;
          rent_price: number | null;
          sale_price: number | null;
          show_address: boolean;
          slug: string;
          state: string;
          status: string;
          suites: number | null;
          title: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          area_built?: number | null;
          area_land?: number | null;
          area_useful?: number | null;
          bathrooms?: number | null;
          bedrooms?: number | null;
          broker_id?: string | null;
          city: string;
          code: string;
          condo_fee?: number | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          featured?: boolean;
          features?: string[];
          id?: string;
          iptu?: number | null;
          neighborhood?: string | null;
          parking?: number | null;
          purpose?: string;
          rent_price?: number | null;
          sale_price?: number | null;
          show_address?: boolean;
          slug: string;
          state?: string;
          status?: string;
          suites?: number | null;
          title: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          area_built?: number | null;
          area_land?: number | null;
          area_useful?: number | null;
          bathrooms?: number | null;
          bedrooms?: number | null;
          broker_id?: string | null;
          city?: string;
          code?: string;
          condo_fee?: number | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          featured?: boolean;
          features?: string[];
          id?: string;
          iptu?: number | null;
          neighborhood?: string | null;
          parking?: number | null;
          purpose?: string;
          rent_price?: number | null;
          sale_price?: number | null;
          show_address?: boolean;
          slug?: string;
          state?: string;
          status?: string;
          suites?: number | null;
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      property_owners: {
        Row: {
          email: string;
          name: string;
          notes: string;
          phone: string;
          property_id: string;
        };
        Insert: {
          email?: string;
          name?: string;
          notes?: string;
          phone?: string;
          property_id: string;
        };
        Update: {
          email?: string;
          name?: string;
          notes?: string;
          phone?: string;
          property_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_owners_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: true;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      property_photos: {
        Row: {
          caption: string;
          created_at: string;
          id: string;
          position: number;
          property_id: string;
          storage_path: string | null;
          url: string;
        };
        Insert: {
          caption?: string;
          created_at?: string;
          id?: string;
          position?: number;
          property_id: string;
          storage_path?: string | null;
          url: string;
        };
        Update: {
          caption?: string;
          created_at?: string;
          id?: string;
          position?: number;
          property_id?: string;
          storage_path?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_photos_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      site_analytics: {
        Row: {
          created_at: string;
          duration_seconds: number;
          event_type: string;
          id: string;
          page_path: string;
          property_id: string | null;
          session_id: string;
          traffic_source: string;
        };
        Insert: {
          created_at?: string;
          duration_seconds?: number;
          event_type: string;
          id?: string;
          page_path: string;
          property_id?: string | null;
          session_id: string;
          traffic_source?: string;
        };
        Update: {
          created_at?: string;
          duration_seconds?: number;
          event_type?: string;
          id?: string;
          page_path?: string;
          property_id?: string | null;
          session_id?: string;
          traffic_source?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_read_lead: {
        Args: { _broker_id: string; _interest: string; _user_id: string };
        Returns: boolean;
      };
      can_view_all: { Args: { _user_id: string }; Returns: boolean };
      can_write_property: {
        Args: { _broker_id: string; _user_id: string };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_hidden_staff: { Args: { _user_id: string }; Returns: boolean };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
      is_staff_manager: { Args: { _user_id: string }; Returns: boolean };
      retire_broker: { Args: { _broker_id: string }; Returns: Json };
      update_analytics_duration: {
        Args: { _id: string; _seconds: number };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "owner" | "admin" | "broker";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "admin", "broker"],
    },
  },
} as const;
