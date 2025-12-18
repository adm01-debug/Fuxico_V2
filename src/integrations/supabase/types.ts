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
  public: {
    Tables: {
      document_events: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          document_id: string
          duration_seconds: number | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          os: string | null
          page_number: number | null
          referer: string | null
          user_agent: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          document_id: string
          duration_seconds?: number | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          os?: string | null
          page_number?: number | null
          referer?: string | null
          user_agent?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          document_id?: string
          duration_seconds?: number | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          os?: string | null
          page_number?: number | null
          referer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "tracked_documents"
            referencedColumns: ["document_id"]
          },
        ]
      }
      email_audit_logs: {
        Row: {
          created_at: string
          direction: string
          external_domain: string | null
          id: string
          is_external: boolean | null
          metadata: Json | null
          recipient_email: string | null
          sender_email: string | null
          subject: string | null
          timestamp: string
          user_email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          external_domain?: string | null
          id?: string
          is_external?: boolean | null
          metadata?: Json | null
          recipient_email?: string | null
          sender_email?: string | null
          subject?: string | null
          timestamp?: string
          user_email: string
          user_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          external_domain?: string | null
          id?: string
          is_external?: boolean | null
          metadata?: Json | null
          recipient_email?: string | null
          sender_email?: string | null
          subject?: string | null
          timestamp?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      fraud_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string
          email_audit_log_id: string | null
          id: string
          is_resolved: boolean | null
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          user_email: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          description: string
          email_audit_log_id?: string | null
          id?: string
          is_resolved?: boolean | null
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          user_email: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string
          email_audit_log_id?: string | null
          id?: string
          is_resolved?: boolean | null
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_alerts_email_audit_log_id_fkey"
            columns: ["email_audit_log_id"]
            isOneToOne: false
            referencedRelation: "email_audit_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      link_click_events: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_address: string | null
          link_id: string
          os: string | null
          referer: string | null
          user_agent: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          link_id: string
          os?: string | null
          referer?: string | null
          user_agent?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string
          os?: string | null
          referer?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      standalone_tracked_links: {
        Row: {
          click_count: number | null
          created_at: string
          description: string | null
          id: string
          link_id: string
          original_url: string
          title: string | null
          user_id: string
        }
        Insert: {
          click_count?: number | null
          created_at?: string
          description?: string | null
          id?: string
          link_id: string
          original_url: string
          title?: string | null
          user_id: string
        }
        Update: {
          click_count?: number | null
          created_at?: string
          description?: string | null
          id?: string
          link_id?: string
          original_url?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tracked_documents: {
        Row: {
          created_at: string
          description: string | null
          document_id: string
          expires_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          recipient_email: string | null
          recipient_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_id: string
          expires_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          recipient_email?: string | null
          recipient_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_id?: string
          expires_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          recipient_email?: string | null
          recipient_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tracked_emails: {
        Row: {
          bounce_detected_at: string | null
          bounce_reason: string | null
          bounce_type: string | null
          created_at: string
          delivery_status: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          sender_email: string | null
          subject: string | null
          tracking_id: string
          user_id: string | null
        }
        Insert: {
          bounce_detected_at?: string | null
          bounce_reason?: string | null
          bounce_type?: string | null
          created_at?: string
          delivery_status?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          sender_email?: string | null
          subject?: string | null
          tracking_id: string
          user_id?: string | null
        }
        Update: {
          bounce_detected_at?: string | null
          bounce_reason?: string | null
          bounce_type?: string | null
          created_at?: string
          delivery_status?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          sender_email?: string | null
          subject?: string | null
          tracking_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tracked_links: {
        Row: {
          click_count: number | null
          created_at: string
          id: string
          link_id: string
          original_url: string
          tracking_id: string
        }
        Insert: {
          click_count?: number | null
          created_at?: string
          id?: string
          link_id: string
          original_url: string
          tracking_id: string
        }
        Update: {
          click_count?: number | null
          created_at?: string
          id?: string
          link_id?: string
          original_url?: string
          tracking_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracked_links_tracking_id_fkey"
            columns: ["tracking_id"]
            isOneToOne: false
            referencedRelation: "tracked_emails"
            referencedColumns: ["tracking_id"]
          },
        ]
      }
      tracking_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          is_self_open: boolean | null
          link_url: string | null
          metadata: Json | null
          referer: string | null
          tracking_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          is_self_open?: boolean | null
          link_url?: string | null
          metadata?: Json | null
          referer?: string | null
          tracking_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          is_self_open?: boolean | null
          link_url?: string | null
          metadata?: Json | null
          referer?: string | null
          tracking_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_tracking_id_fkey"
            columns: ["tracking_id"]
            isOneToOne: false
            referencedRelation: "tracked_emails"
            referencedColumns: ["tracking_id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          desktop_enabled: boolean
          email_digest_frequency: string | null
          email_enabled: boolean
          id: string
          notify_on_click: boolean
          notify_on_document_download: boolean
          notify_on_document_view: boolean
          notify_on_open: boolean
          sound_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          desktop_enabled?: boolean
          email_digest_frequency?: string | null
          email_enabled?: boolean
          id?: string
          notify_on_click?: boolean
          notify_on_document_download?: boolean
          notify_on_document_view?: boolean
          notify_on_open?: boolean
          sound_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          desktop_enabled?: boolean
          email_digest_frequency?: string | null
          email_enabled?: boolean
          id?: string
          notify_on_click?: boolean
          notify_on_document_download?: boolean
          notify_on_document_view?: boolean
          notify_on_open?: boolean
          sound_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
