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
      ab_tests: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          name: string
          recipient_email: string | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
          variant_a_clicks: number
          variant_a_opens: number
          variant_a_sends: number
          variant_a_subject: string
          variant_b_clicks: number
          variant_b_opens: number
          variant_b_sends: number
          variant_b_subject: string
          winner: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name: string
          recipient_email?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          variant_a_clicks?: number
          variant_a_opens?: number
          variant_a_sends?: number
          variant_a_subject: string
          variant_b_clicks?: number
          variant_b_opens?: number
          variant_b_sends?: number
          variant_b_subject: string
          winner?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          recipient_email?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          variant_a_clicks?: number
          variant_a_opens?: number
          variant_a_sends?: number
          variant_a_subject?: string
          variant_b_clicks?: number
          variant_b_opens?: number
          variant_b_sends?: number
          variant_b_subject?: string
          winner?: string | null
        }
        Relationships: []
      }
      active_sessions: {
        Row: {
          created_at: string
          device_info: Json | null
          expires_at: string
          id: string
          ip_address: string | null
          last_activity_at: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          expires_at: string
          id?: string
          ip_address?: string | null
          last_activity_at?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_activity_at?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      alert_thresholds: {
        Row: {
          bounce_rate_critical: number | null
          bounce_rate_warning: number | null
          created_at: string
          id: string
          low_delivery_rate: number | null
          low_open_rate: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bounce_rate_critical?: number | null
          bounce_rate_warning?: number | null
          created_at?: string
          id?: string
          low_delivery_rate?: number | null
          low_open_rate?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bounce_rate_critical?: number | null
          bounce_rate_warning?: number | null
          created_at?: string
          id?: string
          low_delivery_rate?: number | null
          low_open_rate?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_config: {
        Row: {
          business_hours_end: number
          business_hours_start: number
          created_at: string
          id: string
          internal_domains: string[]
          timezone: string
          updated_at: string
          volume_threshold_daily: number
          volume_threshold_hourly: number
        }
        Insert: {
          business_hours_end?: number
          business_hours_start?: number
          created_at?: string
          id?: string
          internal_domains?: string[]
          timezone?: string
          updated_at?: string
          volume_threshold_daily?: number
          volume_threshold_hourly?: number
        }
        Update: {
          business_hours_end?: number
          business_hours_start?: number
          created_at?: string
          id?: string
          internal_domains?: string[]
          timezone?: string
          updated_at?: string
          volume_threshold_daily?: number
          volume_threshold_hourly?: number
        }
        Relationships: []
      }
      bitrix24_config: {
        Row: {
          auto_create_deals: boolean
          auto_register_activities: boolean
          auto_sync_contacts: boolean
          created_at: string
          default_deal_category: string
          default_deal_stage: string
          enabled: boolean
          id: string
          send_notifications: boolean
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          auto_create_deals?: boolean
          auto_register_activities?: boolean
          auto_sync_contacts?: boolean
          created_at?: string
          default_deal_category?: string
          default_deal_stage?: string
          enabled?: boolean
          id?: string
          send_notifications?: boolean
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          auto_create_deals?: boolean
          auto_register_activities?: boolean
          auto_sync_contacts?: boolean
          created_at?: string
          default_deal_category?: string
          default_deal_stage?: string
          enabled?: boolean
          id?: string
          send_notifications?: boolean
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          ip_address: string
          is_permanent: boolean | null
          metadata: Json | null
          reason: string
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address: string
          is_permanent?: boolean | null
          metadata?: Json | null
          reason: string
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: string
          is_permanent?: boolean | null
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      bounce_alerts: {
        Row: {
          alert_type: string
          bounce_rate: number
          created_at: string
          domain: string
          id: string
          is_read: boolean | null
          is_resolved: boolean | null
          resolved_at: string | null
          threshold: number
          user_id: string
        }
        Insert: {
          alert_type?: string
          bounce_rate: number
          created_at?: string
          domain: string
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          resolved_at?: string | null
          threshold: number
          user_id: string
        }
        Update: {
          alert_type?: string
          bounce_rate?: number
          created_at?: string
          domain?: string
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          resolved_at?: string | null
          threshold?: number
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_scores: {
        Row: {
          created_at: string
          email: string
          engagement_score: number | null
          first_interaction_at: string | null
          id: string
          last_interaction_at: string | null
          score_level: string | null
          total_bounces: number | null
          total_clicks: number | null
          total_emails_sent: number | null
          total_opens: number | null
          unique_opens: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          engagement_score?: number | null
          first_interaction_at?: string | null
          id?: string
          last_interaction_at?: string | null
          score_level?: string | null
          total_bounces?: number | null
          total_clicks?: number | null
          total_emails_sent?: number | null
          total_opens?: number | null
          unique_opens?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          engagement_score?: number | null
          first_interaction_at?: string | null
          id?: string
          last_interaction_at?: string | null
          score_level?: string | null
          total_bounces?: number | null
          total_clicks?: number | null
          total_emails_sent?: number | null
          total_opens?: number | null
          unique_opens?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deliverability_logs: {
        Row: {
          created_at: string
          delivery_rate: number | null
          domain: string
          emails_bounced: number | null
          emails_delivered: number | null
          emails_opened: number | null
          emails_sent: number | null
          hard_bounces: number | null
          id: string
          period_end: string
          period_start: string
          reputation_score: number | null
          soft_bounces: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_rate?: number | null
          domain: string
          emails_bounced?: number | null
          emails_delivered?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          hard_bounces?: number | null
          id?: string
          period_end: string
          period_start: string
          reputation_score?: number | null
          soft_bounces?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_rate?: number | null
          domain?: string
          emails_bounced?: number | null
          emails_delivered?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          hard_bounces?: number | null
          id?: string
          period_end?: string
          period_start?: string
          reputation_score?: number | null
          soft_bounces?: number | null
          user_id?: string
        }
        Relationships: []
      }
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
      domain_reputation: {
        Row: {
          bounce_rate: number | null
          created_at: string
          dkim_valid: boolean | null
          dmarc_valid: boolean | null
          domain: string
          id: string
          last_checked_at: string | null
          open_rate: number | null
          reputation_score: number | null
          spf_valid: boolean | null
          total_bounced: number | null
          total_delivered: number | null
          total_opened: number | null
          total_sent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bounce_rate?: number | null
          created_at?: string
          dkim_valid?: boolean | null
          dmarc_valid?: boolean | null
          domain: string
          id?: string
          last_checked_at?: string | null
          open_rate?: number | null
          reputation_score?: number | null
          spf_valid?: boolean | null
          total_bounced?: number | null
          total_delivered?: number | null
          total_opened?: number | null
          total_sent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bounce_rate?: number | null
          created_at?: string
          dkim_valid?: boolean | null
          dmarc_valid?: boolean | null
          domain?: string
          id?: string
          last_checked_at?: string | null
          open_rate?: number | null
          reputation_score?: number | null
          spf_valid?: boolean | null
          total_bounced?: number | null
          total_delivered?: number | null
          total_opened?: number | null
          total_sent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      email_templates: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          name: string
          subject: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          id?: string
          name: string
          subject: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      email_verification_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      follow_up_reminders: {
        Row: {
          created_at: string
          id: string
          reminded_at: string | null
          reminder_days: number
          status: string
          tracking_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reminded_at?: string | null
          reminder_days?: number
          status?: string
          tracking_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reminded_at?: string | null
          reminder_days?: number
          status?: string
          tracking_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_reminders_tracking_id_fkey"
            columns: ["tracking_id"]
            isOneToOne: false
            referencedRelation: "email_stats_mv"
            referencedColumns: ["tracking_id"]
          },
          {
            foreignKeyName: "follow_up_reminders_tracking_id_fkey"
            columns: ["tracking_id"]
            isOneToOne: false
            referencedRelation: "tracked_emails"
            referencedColumns: ["tracking_id"]
          },
        ]
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
      geo_whitelist: {
        Row: {
          added_by: string | null
          country_code: string
          country_name: string
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          country_code: string
          country_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          country_code?: string
          country_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      ip_whitelist: {
        Row: {
          added_by: string | null
          created_at: string
          description: string | null
          id: string
          ip_address: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
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
      login_attempts: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string
          metadata: Json | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address: string
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      login_lockouts: {
        Row: {
          created_at: string
          email: string
          failed_attempts: number
          id: string
          ip_address: string | null
          last_failed_at: string | null
          lockout_until: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          failed_attempts?: number
          id?: string
          ip_address?: string | null
          last_failed_at?: string | null
          lockout_until?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          failed_attempts?: number
          id?: string
          ip_address?: string | null
          last_failed_at?: string | null
          lockout_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mfa_settings: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          enrolled_at: string | null
          id: string
          is_enabled: boolean
          last_verified_at: string | null
          recovery_email: string | null
          totp_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          enrolled_at?: string | null
          id?: string
          is_enabled?: boolean
          last_verified_at?: string | null
          recovery_email?: string | null
          totp_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          enrolled_at?: string | null
          id?: string
          is_enabled?: boolean
          last_verified_at?: string | null
          recovery_email?: string | null
          totp_secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_history: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          severity: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          severity?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          severity?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_requests: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          rejection_reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          rejection_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          permission_key: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          permission_key: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          permission_key?: string
        }
        Relationships: []
      }
      rate_limit_logs: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          endpoint: string
          id: string
          ip_address: string
          is_blocked: boolean | null
          request_count: number
          user_agent: string | null
          user_id: string | null
          window_end: string
          window_start: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          endpoint: string
          id?: string
          ip_address: string
          is_blocked?: boolean | null
          request_count?: number
          user_agent?: string | null
          user_id?: string | null
          window_end: string
          window_start?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string
          is_blocked?: boolean | null
          request_count?: number
          user_agent?: string | null
          user_id?: string | null
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_emails: {
        Row: {
          body: string | null
          created_at: string
          id: string
          metadata: Json | null
          recipient_email: string
          scheduled_at: string
          sender_email: string | null
          sent_at: string | null
          status: string
          subject: string
          tracking_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          recipient_email: string
          scheduled_at: string
          sender_email?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          tracking_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          recipient_email?: string
          scheduled_at?: string
          sender_email?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          tracking_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          created_at: string
          enabled: boolean
          format: string
          id: string
          last_sent_at: string | null
          metrics: string[]
          name: string
          next_send_at: string | null
          recipients: string[]
          report_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          format?: string
          id?: string
          last_sent_at?: string | null
          metrics?: string[]
          name: string
          next_send_at?: string | null
          recipients?: string[]
          report_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          format?: string
          id?: string
          last_sent_at?: string | null
          metrics?: string[]
          name?: string
          next_send_at?: string | null
          recipients?: string[]
          report_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
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
          campaign_id: string | null
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
          campaign_id?: string | null
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
          campaign_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "tracked_emails_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "email_stats_mv"
            referencedColumns: ["tracking_id"]
          },
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
            referencedRelation: "email_stats_mv"
            referencedColumns: ["tracking_id"]
          },
          {
            foreignKeyName: "tracking_events_tracking_id_fkey"
            columns: ["tracking_id"]
            isOneToOne: false
            referencedRelation: "tracked_emails"
            referencedColumns: ["tracking_id"]
          },
        ]
      }
      unsubscribed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          reason: string | null
          source: string | null
          tracking_id: string | null
          unsubscribed_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          reason?: string | null
          source?: string | null
          tracking_id?: string | null
          unsubscribed_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          reason?: string | null
          source?: string | null
          tracking_id?: string | null
          unsubscribed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          auto_reminder_days: number
          auto_reminder_enabled: boolean
          created_at: string
          critical_volume: number | null
          desktop_enabled: boolean
          email_digest_frequency: string | null
          email_enabled: boolean
          id: string
          notification_sound_type: string | null
          notification_volume: number | null
          notify_on_click: boolean
          notify_on_document_download: boolean
          notify_on_document_view: boolean
          notify_on_open: boolean
          sound_enabled: boolean
          updated_at: string
          user_id: string
          warning_volume: number | null
        }
        Insert: {
          auto_reminder_days?: number
          auto_reminder_enabled?: boolean
          created_at?: string
          critical_volume?: number | null
          desktop_enabled?: boolean
          email_digest_frequency?: string | null
          email_enabled?: boolean
          id?: string
          notification_sound_type?: string | null
          notification_volume?: number | null
          notify_on_click?: boolean
          notify_on_document_download?: boolean
          notify_on_document_view?: boolean
          notify_on_open?: boolean
          sound_enabled?: boolean
          updated_at?: string
          user_id: string
          warning_volume?: number | null
        }
        Update: {
          auto_reminder_days?: number
          auto_reminder_enabled?: boolean
          created_at?: string
          critical_volume?: number | null
          desktop_enabled?: boolean
          email_digest_frequency?: string | null
          email_enabled?: boolean
          id?: string
          notification_sound_type?: string | null
          notification_volume?: number | null
          notify_on_click?: boolean
          notify_on_document_download?: boolean
          notify_on_document_view?: boolean
          notify_on_open?: boolean
          sound_enabled?: boolean
          updated_at?: string
          user_id?: string
          warning_volume?: number | null
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
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string
          email: string | null
          expires_at: string
          id: string
          type: string
          user_id: string | null
        }
        Insert: {
          challenge: string
          created_at?: string
          email?: string | null
          expires_at: string
          id?: string
          type: string
          user_id?: string | null
        }
        Update: {
          challenge?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          backed_up: boolean | null
          counter: number
          created_at: string
          credential_id: string
          credential_name: string | null
          device_type: string | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          user_id: string
        }
        Insert: {
          backed_up?: boolean | null
          counter?: number
          created_at?: string
          credential_id: string
          credential_name?: string | null
          device_type?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          user_id: string
        }
        Update: {
          backed_up?: boolean | null
          counter?: number
          created_at?: string
          credential_id?: string
          credential_name?: string | null
          device_type?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      webhook_configs: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean
          secret: string | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          secret?: string | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          secret?: string | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          error: string | null
          event_type: string
          id: string
          payload: Json | null
          response_body: string | null
          response_status: number | null
          success: boolean
          tracking_id: string | null
          user_id: string
          webhook_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          tracking_id?: string | null
          user_id: string
          webhook_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          tracking_id?: string | null
          user_id?: string
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhook_configs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      email_stats_mv: {
        Row: {
          bounce_detected_at: string | null
          bounce_reason: string | null
          bounce_type: string | null
          click_count: number | null
          created_at: string | null
          delivery_status: string | null
          first_opened_at: string | null
          id: string | null
          last_opened_at: string | null
          metadata: Json | null
          open_count: number | null
          recipient_email: string | null
          sender_email: string | null
          subject: string | null
          total_link_clicks: number | null
          tracking_id: string | null
          unique_links_clicked: number | null
          unique_opens: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_domain_deliverability: {
        Args: { p_user_id: string }
        Returns: {
          bounce_rate: number
          delivery_rate: number
          domain: string
          open_rate: number
          reputation_score: number
          total_bounced: number
          total_delivered: number
          total_opened: number
          total_sent: number
        }[]
      }
      check_bounce_alerts: {
        Args: { p_user_id: string }
        Returns: {
          bounce_rate: number
          domain: string
          severity: string
          threshold: number
        }[]
      }
      check_lockout_status: {
        Args: { _email: string; _ip_address?: string }
        Returns: {
          failed_attempts: number
          is_locked: boolean
          lockout_remaining_seconds: number
          lockout_until: string
        }[]
      }
      check_login_attempts: {
        Args: {
          _email: string
          _ip_address: string
          _max_attempts?: number
          _window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_expired_challenges: { Args: never; Returns: undefined }
      create_bounce_alert: {
        Args: {
          _alert_type?: string
          _bounce_rate: number
          _domain: string
          _threshold: number
          _user_id: string
        }
        Returns: string
      }
      create_password_reset_token: {
        Args: { _expires_at: string; _token: string; _user_id: string }
        Returns: string
      }
      create_webauthn_challenge: {
        Args: {
          _challenge: string
          _email: string
          _expires_at: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      get_due_reminders: {
        Args: never
        Returns: {
          created_at: string
          id: string
          recipient_email: string
          reminder_days: number
          subject: string
          tracking_id: string
          user_id: string
        }[]
      }
      get_emails_with_stats: {
        Args: {
          p_end_date?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_start_date?: string
          p_status?: string
          p_user_id: string
        }
        Returns: {
          bounce_detected_at: string
          bounce_reason: string
          bounce_type: string
          click_count: number
          created_at: string
          delivery_status: string
          first_opened_at: string
          id: string
          last_opened_at: string
          metadata: Json
          open_count: number
          recipient_email: string
          sender_email: string
          subject: string
          total_count: number
          total_link_clicks: number
          tracking_id: string
          unique_links_clicked: number
          unique_opens: number
          user_id: string
        }[]
      }
      get_geo_stats: {
        Args: { p_user_id: string }
        Returns: {
          city: string
          click_count: number
          country: string
          open_count: number
        }[]
      }
      get_lockout_status: {
        Args: { _email: string }
        Returns: {
          failed_attempts: number
          is_locked: boolean
          lockout_until: string
        }[]
      }
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: {
          category: string
          permission_key: string
          permission_name: string
        }[]
      }
      get_user_tracking_stats: {
        Args: { p_user_id: string }
        Returns: {
          bounce_rate: number
          click_rate: number
          open_rate: number
          total_bounces: number
          total_clicks: number
          total_emails: number
          total_opens: number
        }[]
      }
      has_permission: {
        Args: { _permission_key: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_country_allowed: { Args: { _country_code: string }; Returns: boolean }
      is_ip_blocked: { Args: { _ip_address: string }; Returns: boolean }
      is_ip_whitelisted: { Args: { _ip_address: string }; Returns: boolean }
      log_security_event: {
        Args: {
          _description: string
          _event_type: string
          _ip_address?: string
          _metadata?: Json
          _severity: string
          _user_agent?: string
          _user_id: string
        }
        Returns: string
      }
      manage_email_verification_token: {
        Args: {
          _email: string
          _expires_at: string
          _token: string
          _user_id: string
        }
        Returns: string
      }
      recalculate_all_contact_scores: {
        Args: { p_user_id: string }
        Returns: number
      }
      record_failed_login: {
        Args: { _email: string; _ip_address?: string }
        Returns: {
          is_now_locked: boolean
          lockout_seconds: number
          total_attempts: number
        }[]
      }
      refresh_email_stats_mv: { Args: never; Returns: undefined }
      reset_login_lockout: { Args: { _email: string }; Returns: undefined }
      update_contact_score: {
        Args: { p_email: string; p_user_id: string }
        Returns: undefined
      }
      use_password_reset_token: { Args: { _token: string }; Returns: string }
      verify_email_token: { Args: { _token: string }; Returns: boolean }
      verify_webauthn_challenge: {
        Args: { _challenge: string }
        Returns: {
          email: string
          type: string
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      permission_type:
        | "read"
        | "write"
        | "delete"
        | "admin"
        | "manage_users"
        | "manage_roles"
        | "view_analytics"
        | "export_data"
        | "manage_webhooks"
        | "manage_templates"
        | "view_audit_logs"
        | "manage_security"
        | "manage_mfa"
        | "manage_rate_limits"
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
      permission_type: [
        "read",
        "write",
        "delete",
        "admin",
        "manage_users",
        "manage_roles",
        "view_analytics",
        "export_data",
        "manage_webhooks",
        "manage_templates",
        "view_audit_logs",
        "manage_security",
        "manage_mfa",
        "manage_rate_limits",
      ],
    },
  },
} as const
