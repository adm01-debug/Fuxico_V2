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
      ab_tests: {
        Row: {
          auto_promote: boolean
          completed_at: string | null
          created_at: string
          holdout_percent: number
          id: string
          min_sample_size: number
          name: string
          recipient_email: string | null
          segment_filters: Json
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
          variant_a_body: string | null
          variant_a_clicks: number
          variant_a_opens: number
          variant_a_sends: number
          variant_a_subject: string
          variant_b_body: string | null
          variant_b_clicks: number
          variant_b_opens: number
          variant_b_sends: number
          variant_b_subject: string
          version: number
          winner: string | null
          winner_promoted_at: string | null
        }
        Insert: {
          auto_promote?: boolean
          completed_at?: string | null
          created_at?: string
          holdout_percent?: number
          id?: string
          min_sample_size?: number
          name: string
          recipient_email?: string | null
          segment_filters?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          variant_a_body?: string | null
          variant_a_clicks?: number
          variant_a_opens?: number
          variant_a_sends?: number
          variant_a_subject: string
          variant_b_body?: string | null
          variant_b_clicks?: number
          variant_b_opens?: number
          variant_b_sends?: number
          variant_b_subject: string
          version?: number
          winner?: string | null
          winner_promoted_at?: string | null
        }
        Update: {
          auto_promote?: boolean
          completed_at?: string | null
          created_at?: string
          holdout_percent?: number
          id?: string
          min_sample_size?: number
          name?: string
          recipient_email?: string | null
          segment_filters?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          variant_a_body?: string | null
          variant_a_clicks?: number
          variant_a_opens?: number
          variant_a_sends?: number
          variant_a_subject?: string
          variant_b_body?: string | null
          variant_b_clicks?: number
          variant_b_opens?: number
          variant_b_sends?: number
          variant_b_subject?: string
          version?: number
          winner?: string | null
          winner_promoted_at?: string | null
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
      alert_dispatch_log: {
        Row: {
          channel: string
          dispatched_at: string
          error_message: string | null
          id: string
          security_event_id: string
          status: string
        }
        Insert: {
          channel: string
          dispatched_at?: string
          error_message?: string | null
          id?: string
          security_event_id: string
          status: string
        }
        Update: {
          channel?: string
          dispatched_at?: string
          error_message?: string | null
          id?: string
          security_event_id?: string
          status?: string
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
          version: number
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
          version?: number
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
          version?: number
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
          version: number
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
          version?: number
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
          version?: number
          volume_threshold_daily?: number
          volume_threshold_hourly?: number
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_06: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_07: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_08: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_09: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_10: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_11: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_12: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_2027_01: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_default: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
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
          version: number
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
          version?: number
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
          version?: number
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
          version: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
          version?: number
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
          version: number
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
          version?: number
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
          version?: number
        }
        Relationships: []
      }
      cron_job_failures: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          http_status: number | null
          id: string
          job_name: string
          request_body: Json | null
          request_headers: Json
          request_url: string
          resolved_at: string | null
          resolved_by: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          job_name: string
          request_body?: Json | null
          request_headers?: Json
          request_url: string
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          job_name?: string
          request_body?: Json | null
          request_headers?: Json
          request_url?: string
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string
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
          version: number
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
          version?: number
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
          version?: number
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
          recipient_email: string
          sender_email: string
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
          recipient_email: string
          sender_email: string
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
          recipient_email?: string
          sender_email?: string
          subject?: string | null
          timestamp?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      email_sequences: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          settings: Json | null
          status: string
          total_completed: number | null
          total_enrolled: number | null
          total_replied: number | null
          trigger_type: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          settings?: Json | null
          status?: string
          total_completed?: number | null
          total_enrolled?: number | null
          total_replied?: number | null
          trigger_type?: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          settings?: Json | null
          status?: string
          total_completed?: number | null
          total_enrolled?: number | null
          total_replied?: number | null
          trigger_type?: string
          updated_at?: string
          user_id?: string
          version?: number
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
          version: number
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
          version?: number
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
          version?: number
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
      feature_flags: {
        Row: {
          conditions: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          enabled: boolean
          id: string
          key: string
          name: string
          percentage: number | null
          updated_at: string
          version: number
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          key: string
          name: string
          percentage?: number | null
          updated_at?: string
          version?: number
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          key?: string
          name?: string
          percentage?: number | null
          updated_at?: string
          version?: number
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
      gmail_configurations: {
        Row: {
          access_token: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          refresh_token: string | null
          updated_at: string | null
          user_id: string
          version: number
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id: string
          version?: number
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      index_advisor_runs: {
        Row: {
          created_at: string
          details: Json
          high_count: number
          id: string
          medium_count: number
          ran_at: string
          triggered_by: string
        }
        Insert: {
          created_at?: string
          details?: Json
          high_count?: number
          id?: string
          medium_count?: number
          ran_at?: string
          triggered_by?: string
        }
        Update: {
          created_at?: string
          details?: Json
          high_count?: number
          id?: string
          medium_count?: number
          ran_at?: string
          triggered_by?: string
        }
        Relationships: []
      }
      index_drop_impact_analysis: {
        Row: {
          baseline_captured_at: string | null
          baseline_total_cost: number | null
          created_at: string
          id: string
          index_name: string
          notes: string | null
          post_captured_at: string | null
          post_total_cost: number | null
          queries: Json
          schema_name: string
          status: string
          table_name: string
          updated_at: string
          verdict: string | null
        }
        Insert: {
          baseline_captured_at?: string | null
          baseline_total_cost?: number | null
          created_at?: string
          id?: string
          index_name: string
          notes?: string | null
          post_captured_at?: string | null
          post_total_cost?: number | null
          queries?: Json
          schema_name?: string
          status?: string
          table_name: string
          updated_at?: string
          verdict?: string | null
        }
        Update: {
          baseline_captured_at?: string | null
          baseline_total_cost?: number | null
          created_at?: string
          id?: string
          index_name?: string
          notes?: string | null
          post_captured_at?: string | null
          post_total_cost?: number | null
          queries?: Json
          schema_name?: string
          status?: string
          table_name?: string
          updated_at?: string
          verdict?: string | null
        }
        Relationships: []
      }
      index_usage_snapshots: {
        Row: {
          created_at: string
          id: string
          idx_scan: number
          idx_tup_fetch: number
          idx_tup_read: number
          index_name: string
          index_size_bytes: number
          schema_name: string
          snapshot_at: string
          table_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          idx_scan: number
          idx_tup_fetch: number
          idx_tup_read: number
          index_name: string
          index_size_bytes: number
          schema_name: string
          snapshot_at?: string
          table_name: string
        }
        Update: {
          created_at?: string
          id?: string
          idx_scan?: number
          idx_tup_fetch?: number
          idx_tup_read?: number
          index_name?: string
          index_size_bytes?: number
          schema_name?: string
          snapshot_at?: string
          table_name?: string
        }
        Relationships: []
      }
      internal_config: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: string
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
      login_attempts_2026_05: {
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
      login_attempts_2026_06: {
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
      login_attempts_2026_07: {
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
      login_attempts_2026_08: {
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
      login_attempts_2026_09: {
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
      login_attempts_2026_10: {
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
      login_attempts_2026_11: {
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
      login_attempts_2026_12: {
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
      login_attempts_2027_01: {
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
      login_attempts_default: {
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
      mfa_backup_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
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
          version: number
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
          version?: number
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
          version?: number
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
      query_performance_snapshots: {
        Row: {
          cache_hit_ratio_pct: number | null
          calls: number
          created_at: string
          id: string
          max_exec_ms: number
          mean_exec_ms: number
          query_text: string
          queryid: number | null
          rows: number | null
          snapshot_at: string
          stddev_exec_ms: number | null
          total_exec_ms: number
        }
        Insert: {
          cache_hit_ratio_pct?: number | null
          calls: number
          created_at?: string
          id?: string
          max_exec_ms: number
          mean_exec_ms: number
          query_text: string
          queryid?: number | null
          rows?: number | null
          snapshot_at?: string
          stddev_exec_ms?: number | null
          total_exec_ms: number
        }
        Update: {
          cache_hit_ratio_pct?: number | null
          calls?: number
          created_at?: string
          id?: string
          max_exec_ms?: number
          mean_exec_ms?: number
          query_text?: string
          queryid?: number | null
          rows?: number | null
          snapshot_at?: string
          stddev_exec_ms?: number | null
          total_exec_ms?: number
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
      rate_limit_logs_2026_06: {
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
      rate_limit_logs_2026_07: {
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
      rate_limit_logs_2026_08: {
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
      rate_limit_logs_2026_09: {
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
      rate_limit_logs_2026_10: {
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
      rate_limit_logs_2026_11: {
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
      rate_limit_logs_2026_12: {
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
      rate_limit_logs_2027_01: {
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
      rate_limit_logs_default: {
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
          version: number
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
          version?: number
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
          version?: number
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
      security_events_2026_05: {
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
      security_events_2026_06: {
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
      security_events_2026_07: {
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
      security_events_2026_08: {
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
      security_events_2026_09: {
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
      security_events_2026_10: {
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
      security_events_2026_11: {
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
      security_events_2026_12: {
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
      security_events_2027_01: {
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
      security_events_default: {
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
      sequence_enrollments: {
        Row: {
          completed_at: string | null
          contact_email: string
          contact_name: string | null
          created_at: string
          current_step: number
          enrolled_at: string
          id: string
          metadata: Json | null
          next_step_at: string | null
          sequence_id: string
          status: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          completed_at?: string | null
          contact_email: string
          contact_name?: string | null
          created_at?: string
          current_step?: number
          enrolled_at?: string
          id?: string
          metadata?: Json | null
          next_step_at?: string | null
          sequence_id: string
          status?: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          completed_at?: string | null
          contact_email?: string
          contact_name?: string | null
          created_at?: string
          current_step?: number
          enrolled_at?: string
          id?: string
          metadata?: Json | null
          next_step_at?: string | null
          sequence_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "sequence_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_step_executions: {
        Row: {
          clicked_at: string | null
          created_at: string
          enrollment_id: string
          error_message: string | null
          id: string
          opened_at: string | null
          replied_at: string | null
          sent_at: string | null
          status: string
          step_id: string
          tracking_id: string | null
          updated_at: string
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string
          enrollment_id: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          replied_at?: string | null
          sent_at?: string | null
          status?: string
          step_id: string
          tracking_id?: string | null
          updated_at?: string
        }
        Update: {
          clicked_at?: string | null
          created_at?: string
          enrollment_id?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          replied_at?: string | null
          sent_at?: string | null
          status?: string
          step_id?: string
          tracking_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequence_step_executions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "sequence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_step_executions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "sequence_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_steps: {
        Row: {
          body: string
          created_at: string
          delay_days: number
          delay_hours: number
          id: string
          is_active: boolean | null
          sequence_id: string
          step_order: number
          subject: string
          trigger_condition: string | null
          updated_at: string
          version: number
        }
        Insert: {
          body: string
          created_at?: string
          delay_days?: number
          delay_hours?: number
          id?: string
          is_active?: boolean | null
          sequence_id: string
          step_order: number
          subject: string
          trigger_condition?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          body?: string
          created_at?: string
          delay_days?: number
          delay_hours?: number
          id?: string
          is_active?: boolean | null
          sequence_id?: string
          step_order?: number
          subject?: string
          trigger_condition?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      stale_index_drops: {
        Row: {
          created_at: string
          dropped_at: string | null
          dry_run: boolean
          forced: boolean
          id: string
          impact_analysis_id: string | null
          index_definition: string
          index_name: string
          index_size_bytes: number | null
          reason: string | null
          requested_by: string | null
          restored_at: string | null
          schema_name: string
          status: string
          table_name: string
          updated_at: string
          verdict: Json
        }
        Insert: {
          created_at?: string
          dropped_at?: string | null
          dry_run?: boolean
          forced?: boolean
          id?: string
          impact_analysis_id?: string | null
          index_definition: string
          index_name: string
          index_size_bytes?: number | null
          reason?: string | null
          requested_by?: string | null
          restored_at?: string | null
          schema_name?: string
          status: string
          table_name: string
          updated_at?: string
          verdict?: Json
        }
        Update: {
          created_at?: string
          dropped_at?: string | null
          dry_run?: boolean
          forced?: boolean
          id?: string
          impact_analysis_id?: string | null
          index_definition?: string
          index_name?: string
          index_size_bytes?: number | null
          reason?: string | null
          requested_by?: string | null
          restored_at?: string | null
          schema_name?: string
          status?: string
          table_name?: string
          updated_at?: string
          verdict?: Json
        }
        Relationships: [
          {
            foreignKeyName: "stale_index_drops_impact_analysis_id_fkey"
            columns: ["impact_analysis_id"]
            isOneToOne: false
            referencedRelation: "index_drop_impact_analysis"
            referencedColumns: ["id"]
          },
        ]
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
          version: number
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
          version?: number
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
          version?: number
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
          sender_email: string
          subject: string | null
          tracking_id: string
          user_id: string
          version: number
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
          sender_email: string
          subject?: string | null
          tracking_id: string
          user_id: string
          version?: number
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
          sender_email?: string
          subject?: string | null
          tracking_id?: string
          user_id?: string
          version?: number
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
      tracking_events_2026_06: {
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
        Relationships: []
      }
      tracking_events_2026_07: {
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
        Relationships: []
      }
      tracking_events_2026_08: {
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
        Relationships: []
      }
      tracking_events_2026_09: {
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
        Relationships: []
      }
      tracking_events_2026_10: {
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
        Relationships: []
      }
      tracking_events_2026_11: {
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
        Relationships: []
      }
      tracking_events_2026_12: {
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
        Relationships: []
      }
      tracking_events_2027_01: {
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
        Relationships: []
      }
      tracking_events_default: {
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
        Relationships: []
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
          font_size: number | null
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
          version: number
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
          font_size?: number | null
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
          version?: number
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
          font_size?: number | null
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
          version?: number
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
          version: number
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
          version?: number
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
          version?: number
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
      webhook_logs_2026_06: {
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
        Relationships: []
      }
      webhook_logs_2026_07: {
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
        Relationships: []
      }
      webhook_logs_2026_08: {
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
        Relationships: []
      }
      webhook_logs_2026_09: {
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
        Relationships: []
      }
      webhook_logs_2026_10: {
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
        Relationships: []
      }
      webhook_logs_2026_11: {
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
        Relationships: []
      }
      webhook_logs_2026_12: {
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
        Relationships: []
      }
      webhook_logs_2027_01: {
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
        Relationships: []
      }
      webhook_logs_default: {
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
        Relationships: []
      }
      whatsapp_configs: {
        Row: {
          api_key: string | null
          auto_follow_up: boolean | null
          business_hours_only: boolean | null
          created_at: string | null
          enabled: boolean | null
          follow_up_delay: number | null
          follow_up_message: string | null
          id: string
          max_retries: number | null
          phone_number: string | null
          updated_at: string | null
          user_id: string
          version: number
        }
        Insert: {
          api_key?: string | null
          auto_follow_up?: boolean | null
          business_hours_only?: boolean | null
          created_at?: string | null
          enabled?: boolean | null
          follow_up_delay?: number | null
          follow_up_message?: string | null
          id?: string
          max_retries?: number | null
          phone_number?: string | null
          updated_at?: string | null
          user_id: string
          version?: number
        }
        Update: {
          api_key?: string | null
          auto_follow_up?: boolean | null
          business_hours_only?: boolean | null
          created_at?: string | null
          enabled?: boolean | null
          follow_up_delay?: number | null
          follow_up_message?: string | null
          id?: string
          max_retries?: number | null
          phone_number?: string | null
          updated_at?: string | null
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      whitelabel_config: {
        Row: {
          created_at: string
          custom_domain: string | null
          custom_link_path: string | null
          custom_pixel_path: string | null
          hide_branding: boolean | null
          id: string
          tracking_brand: string | null
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          custom_link_path?: string | null
          custom_pixel_path?: string | null
          hide_branding?: boolean | null
          id?: string
          tracking_brand?: string | null
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          custom_link_path?: string | null
          custom_pixel_path?: string | null
          hide_branding?: boolean | null
          id?: string
          tracking_brand?: string | null
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
    }
    Views: {
      admin_cache_hit_ratio: {
        Row: {
          cache_type: string | null
          hit_ratio_pct: number | null
          hits: number | null
          reads: number | null
        }
        Relationships: []
      }
      admin_cron_status: {
        Row: {
          active: boolean | null
          failures_24h: number | null
          jobname: string | null
          last_duration_sec: number | null
          last_end: string | null
          last_message: string | null
          last_start: string | null
          last_status: string | null
          schedule: string | null
        }
        Relationships: []
      }
      admin_partition_coverage: {
        Row: {
          coverage_until: string | null
          future_partitions: number | null
          parent_table: unknown
          partitions: number | null
        }
        Relationships: []
      }
      admin_slow_queries: {
        Row: {
          cache_hit_ratio_pct: number | null
          calls: number | null
          max_exec_ms: number | null
          mean_exec_ms: number | null
          query: string | null
          queryid: number | null
          rows: number | null
          stddev_exec_ms: number | null
          total_exec_ms: number | null
        }
        Relationships: []
      }
      admin_table_health: {
        Row: {
          autovacuum_count: number | null
          dead_rows: number | null
          dead_tuple_pct: number | null
          last_analyze: string | null
          last_autoanalyze: string | null
          last_autovacuum: string | null
          last_vacuum: string | null
          live_rows: number | null
          rows_modified_since_analyze: number | null
          schemaname: unknown
          table_name: unknown
          total_size: string | null
          total_size_bytes: number | null
          vacuum_count: number | null
        }
        Relationships: []
      }
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
      tracking_events_monthly_agg: {
        Row: {
          distinct_ips: number | null
          event_count: number | null
          event_type: string | null
          first_event_at: string | null
          last_event_at: string | null
          month: string | null
          tracking_id: string | null
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
    }
    Functions: {
      admin_alert_sanity_check: { Args: never; Returns: Json }
      admin_auto_promote_ab_winners: { Args: never; Returns: Json }
      admin_blocking_queries: {
        Args: never
        Returns: {
          blocked_pid: number
          blocked_query: string
          blocked_user: string
          blocking_pid: number
          blocking_query: string
          blocking_user: string
          waited_seconds: number
        }[]
      }
      admin_cleanup_index_advisor_runs: { Args: never; Returns: Json }
      admin_data_integrity_check: {
        Args: never
        Returns: {
          check_name: string
          severity: string
          violations: number
        }[]
      }
      admin_execute_index_drop:
        | {
            Args: {
              _dry_run?: boolean
              _force?: boolean
              _index_name: string
              _requested_by?: string
            }
            Returns: Json
          }
        | {
            Args: {
              _capture_baseline?: boolean
              _dry_run?: boolean
              _force?: boolean
              _index_name: string
              _requested_by?: string
            }
            Returns: Json
          }
      admin_index_advisor: {
        Args: { min_seq_scans?: number }
        Returns: {
          avg_tuples_per_scan: number
          idx_scan: number
          n_live_tup: number
          recommendation: string
          schema_name: string
          seq_scan: number
          seq_scan_ratio_pct: number
          seq_tup_read: number
          table_name: string
          table_size: string
        }[]
      }
      admin_index_ranking: {
        Args: { _limit?: number; _period_days?: number }
        Returns: {
          classification: string
          current_size_bytes: number
          index_name: string
          period_scans: number
          rank_position: number
          schema_name: string
          table_name: string
        }[]
      }
      admin_index_usage: {
        Args: never
        Returns: {
          idx_scan: number
          idx_tup_fetch: number
          idx_tup_read: number
          index_size: string
          indexname: string
          schemaname: string
          tablename: string
        }[]
      }
      admin_index_usage_by_table: {
        Args: { _period_days?: number }
        Returns: {
          cold_indexes: number
          index_count: number
          schema_name: string
          table_name: string
          total_scans: number
          total_size_bytes: number
        }[]
      }
      admin_index_usage_trend: {
        Args: { _days?: number; _limit?: number }
        Returns: {
          avg_size_bytes: number
          bucket_date: string
          index_name: string
          scans_delta: number
          table_name: string
          total_scans: number
        }[]
      }
      admin_last_index_advisor_cleanup: { Args: never; Returns: Json }
      admin_list_cron_failures: {
        Args: { _limit?: number }
        Returns: {
          attempts: number
          created_at: string
          error_message: string
          id: string
          job_name: string
          replayed_at: string
          status_code: number
          url: string
        }[]
      }
      admin_list_index_advisor_runs: {
        Args: { _limit?: number }
        Returns: {
          details: Json
          high_count: number
          id: string
          medium_count: number
          ran_at: string
          triggered_by: string
        }[]
      }
      admin_ops_dashboard: { Args: never; Returns: Json }
      admin_preview_index_drop: { Args: { _index_name: string }; Returns: Json }
      admin_query_regressions: {
        Args: { _threshold_pct?: number }
        Returns: {
          baseline_mean_ms: number
          current_calls: number
          current_mean_ms: number
          query_text: string
          queryid: number
          regression_pct: number
        }[]
      }
      admin_replay_cron_failure: {
        Args: { _failure_id: string }
        Returns: Json
      }
      admin_restore_dropped_index: {
        Args: { _drop_id: string; _requested_by?: string }
        Returns: Json
      }
      admin_run_index_advisor: { Args: never; Returns: Json }
      admin_stale_indexes: {
        Args: { _days?: number }
        Returns: {
          current_scans: number
          first_seen: string
          index_name: string
          index_size: string
          last_seen: string
          scans_delta: number
          schema_name: string
          table_name: string
        }[]
      }
      admin_table_bloat: {
        Args: never
        Returns: {
          bloat_ratio_pct: number
          bloat_size: string
          dead_rows: number
          live_rows: number
          schema_name: string
          table_name: string
          table_size: string
          total_size: string
        }[]
      }
      alert_query_regressions: { Args: never; Returns: number }
      analyze_index_post_drop: { Args: { _analysis_id: string }; Returns: Json }
      analyze_index_pre_drop: {
        Args: { _index_name: string; _top_n?: number }
        Returns: Json
      }
      auto_promote_ab_winners: { Args: never; Returns: Json }
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
      capture_index_usage_snapshot: { Args: never; Returns: number }
      capture_query_performance_snapshot: { Args: never; Returns: number }
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
      check_stagnant_indexes: {
        Args: { _min_days?: number; _min_size_mb?: number }
        Returns: Json
      }
      cleanup_expired_challenges: { Args: never; Returns: undefined }
      cleanup_old_index_advisor_runs: { Args: never; Returns: Json }
      consume_mfa_backup_code: {
        Args: { _code: string; _user_id: string }
        Returns: boolean
      }
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
      db_health_check: { Args: never; Returns: Json }
      ensure_audit_logs_partition: {
        Args: { target_month: string }
        Returns: undefined
      }
      ensure_future_partitions: { Args: never; Returns: undefined }
      ensure_login_attempts_partition: {
        Args: { target_month: string }
        Returns: undefined
      }
      ensure_rate_limit_logs_partition: {
        Args: { target_month: string }
        Returns: undefined
      }
      ensure_security_events_partition: {
        Args: { target_month: string }
        Returns: undefined
      }
      ensure_tracking_events_partition: {
        Args: { target_month: string }
        Returns: undefined
      }
      ensure_webhook_logs_partition: {
        Args: { target_month: string }
        Returns: undefined
      }
      generate_mfa_backup_codes: { Args: never; Returns: string[] }
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
          p_last_id?: string
          p_last_timestamp?: string
          p_limit?: number
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
      get_tracking_monthly_stats: {
        Args: { _months?: number; _user_id: string }
        Returns: {
          distinct_ips: number
          event_count: number
          event_type: string
          month: string
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
      increment_ab_metrics: {
        Args: {
          p_clicks?: number
          p_id: string
          p_opens?: number
          p_sends?: number
          p_variant: string
        }
        Returns: undefined
      }
      increment_sequence_completed: {
        Args: { seq_id: string }
        Returns: undefined
      }
      internal_get_config: { Args: { _key: string }; Returns: string }
      is_country_allowed: { Args: { _country_code: string }; Returns: boolean }
      is_ip_blocked: { Args: { _ip_address: string }; Returns: boolean }
      is_ip_whitelisted: { Args: { _ip_address: string }; Returns: boolean }
      log_audit_event: {
        Args: {
          p_description: string
          p_event_type: string
          p_metadata?: Json
          p_severity: string
          p_user_id: string
        }
        Returns: string
      }
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
      monitor_cron_jobs: { Args: never; Returns: number }
      monitor_table_bloat: { Args: never; Returns: number }
      preview_ab_segment: {
        Args: { p_filters?: Json; p_user_id: string }
        Returns: {
          engagement_score: number
          recipient_email: string
          score_level: string
        }[]
      }
      promote_ab_winner: {
        Args: { _test_id: string; _winner: string }
        Returns: Json
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
      record_login_attempt: {
        Args: {
          _email: string
          _ip_address: string
          _metadata?: Json
          _success?: boolean
          _user_agent?: string
        }
        Returns: string
      }
      refresh_email_stats_mv: { Args: never; Returns: undefined }
      refresh_tracking_events_monthly_agg: { Args: never; Returns: undefined }
      release_singleton_job: { Args: { _job_key: string }; Returns: undefined }
      replay_cron_failure: { Args: { _failure_id: string }; Returns: number }
      reset_login_lockout: { Args: { _email: string }; Returns: undefined }
      reset_slow_query_stats: { Args: never; Returns: undefined }
      run_index_advisor_check:
        | { Args: never; Returns: Json }
        | { Args: { _triggered_by?: string }; Returns: Json }
      run_proactive_maintenance: { Args: never; Returns: Json }
      run_retention_cleanup: { Args: never; Returns: undefined }
      run_tracking_events_retention: { Args: never; Returns: undefined }
      safe_http_post: {
        Args: { _body: Json; _headers: Json; _job_name: string; _url: string }
        Returns: number
      }
      try_singleton_job: { Args: { _job_key: string }; Returns: boolean }
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
