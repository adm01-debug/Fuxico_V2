export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ab_tests: {
        Row: {
          id: string
          user_id: string
          name: string
          variant_a: Json
          variant_b: Json
          status: string
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          variant_a: Json
          variant_b: Json
          status?: string
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          variant_a?: Json
          variant_b?: Json
          status?: string
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      mail_merge_campaigns: {
        Row: {
          id: string
          user_id: string
          name: string
          template_id: string | null
          source_type: string
          source_config: Json
          status: string
          total_recipients: number
          sent_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          template_id?: string | null
          source_type: string
          source_config: Json
          status?: string
          total_recipients?: number
          sent_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          template_id?: string | null
          source_type?: string
          source_config?: Json
          status?: string
          total_recipients?: number
          sent_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      mail_merge_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          subject: string
          body: string
          variables: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          subject: string
          body: string
          variables?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          subject?: string
          body?: string
          variables?: Json
          created_at?: string
          updated_at?: string
        }
      }
      mail_merge_recipients: {
        Row: {
          id: string
          campaign_id: string
          email: string
          variables: Json
          status: string
          sent_at: string | null
          tracking_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          email: string
          variables?: Json
          status?: string
          sent_at?: string | null
          tracking_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          email?: string
          variables?: Json
          status?: string
          sent_at?: string | null
          tracking_id?: string | null
          created_at?: string
        }
      }
      email_campaigns: {
        Row: {
          id: string
          user_id: string
          name: string
          subject: string
          body: string
          status: string
          scheduled_at: string | null
          sent_count: number
          monthly_limit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          subject: string
          body: string
          status?: string
          scheduled_at?: string | null
          sent_count?: number
          monthly_limit?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          subject?: string
          body?: string
          status?: string
          scheduled_at?: string | null
          sent_count?: number
          monthly_limit?: number
          created_at?: string
          updated_at?: string
        }
      }
      zapier_webhooks: {
        Row: {
          id: string
          user_id: string
          name: string
          url: string
          events: Json
          is_active: boolean
          last_triggered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          url: string
          events?: Json
          is_active?: boolean
          last_triggered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          url?: string
          events?: Json
          is_active?: boolean
          last_triggered_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pdf_viewing_sessions: {
        Row: {
          id: string
          document_id: string
          viewer_email: string | null
          viewer_ip: string | null
          started_at: string
          ended_at: string | null
          total_time_seconds: number
          pages_viewed: Json
          completion_percentage: number
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          viewer_email?: string | null
          viewer_ip?: string | null
          started_at?: string
          ended_at?: string | null
          total_time_seconds?: number
          pages_viewed?: Json
          completion_percentage?: number
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          viewer_email?: string | null
          viewer_ip?: string | null
          started_at?: string
          ended_at?: string | null
          total_time_seconds?: number
          pages_viewed?: Json
          completion_percentage?: number
          created_at?: string
        }
      }
      pdf_page_views: {
        Row: {
          id: string
          session_id: string
          page_number: number
          time_spent_seconds: number
          scroll_depth: number
          viewed_at: string
        }
        Insert: {
          id?: string
          session_id: string
          page_number: number
          time_spent_seconds?: number
          scroll_depth?: number
          viewed_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          page_number?: number
          time_spent_seconds?: number
          scroll_depth?: number
          viewed_at?: string
        }
      }
      signature_requests: {
        Row: {
          id: string
          user_id: string
          document_id: string
          title: string
          message: string | null
          status: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          document_id: string
          title: string
          message?: string | null
          status?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_id?: string
          title?: string
          message?: string | null
          status?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      signature_data: {
        Row: {
          id: string
          request_id: string
          signer_email: string
          signer_name: string
          status: string
          signed_at: string | null
          signature_image: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          signer_email: string
          signer_name: string
          status?: string
          signed_at?: string | null
          signature_image?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          signer_email?: string
          signer_name?: string
          status?: string
          signed_at?: string | null
          signature_image?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      signature_audit_trail: {
        Row: {
          id: string
          request_id: string
          action: string
          actor_email: string | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          action: string
          actor_email?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          action?: string
          actor_email?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      signed_documents: {
        Row: {
          id: string
          request_id: string
          original_document_url: string
          signed_document_url: string
          certificate_hash: string
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          original_document_url: string
          signed_document_url: string
          certificate_hash: string
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          original_document_url?: string
          signed_document_url?: string
          certificate_hash?: string
          created_at?: string
        }
      }
      screen_recordings: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          recording_url: string | null
          thumbnail_url: string | null
          duration_seconds: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          recording_url?: string | null
          thumbnail_url?: string | null
          duration_seconds?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          recording_url?: string | null
          thumbnail_url?: string | null
          duration_seconds?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      recording_views: {
        Row: {
          id: string
          recording_id: string
          viewer_email: string | null
          viewer_ip: string | null
          watch_duration_seconds: number
          completed: boolean
          viewed_at: string
        }
        Insert: {
          id?: string
          recording_id: string
          viewer_email?: string | null
          viewer_ip?: string | null
          watch_duration_seconds?: number
          completed?: boolean
          viewed_at?: string
        }
        Update: {
          id?: string
          recording_id?: string
          viewer_email?: string | null
          viewer_ip?: string | null
          watch_duration_seconds?: number
          completed?: boolean
          viewed_at?: string
        }
      }
      watermarked_documents: {
        Row: {
          id: string
          user_id: string
          original_document_id: string
          watermark_text: string
          watermark_config: Json
          watermarked_url: string | null
          is_revoked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_document_id: string
          watermark_text: string
          watermark_config?: Json
          watermarked_url?: string | null
          is_revoked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          original_document_id?: string
          watermark_text?: string
          watermark_config?: Json
          watermarked_url?: string | null
          is_revoked?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      mobile_devices: {
        Row: {
          id: string
          user_id: string
          device_token: string
          platform: string
          device_name: string | null
          app_version: string | null
          is_active: boolean
          last_active_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_token: string
          platform: string
          device_name?: string | null
          app_version?: string | null
          is_active?: boolean
          last_active_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_token?: string
          platform?: string
          device_name?: string | null
          app_version?: string | null
          is_active?: boolean
          last_active_at?: string | null
          created_at?: string
        }
      }
      mobile_notifications: {
        Row: {
          id: string
          device_id: string
          title: string
          body: string
          data: Json
          status: string
          sent_at: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          device_id: string
          title: string
          body: string
          data?: Json
          status?: string
          sent_at?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          title?: string
          body?: string
          data?: Json
          status?: string
          sent_at?: string | null
          read_at?: string | null
          created_at?: string
        }
      }
      outlook_connections: {
        Row: {
          id: string
          user_id: string
          outlook_email: string
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          is_active: boolean
          auto_track: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          outlook_email: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          is_active?: boolean
          auto_track?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          outlook_email?: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          is_active?: boolean
          auto_track?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      crm_contacts: {
        Row: {
          id: string
          user_id: string
          email: string
          name: string | null
          company: string | null
          phone: string | null
          tags: Json
          custom_fields: Json
          engagement_score: number
          last_contacted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          name?: string | null
          company?: string | null
          phone?: string | null
          tags?: Json
          custom_fields?: Json
          engagement_score?: number
          last_contacted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          name?: string | null
          company?: string | null
          phone?: string | null
          tags?: Json
          custom_fields?: Json
          engagement_score?: number
          last_contacted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      crm_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          contact_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          contact_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          contact_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      productivity_reports: {
        Row: {
          id: string
          user_id: string
          report_type: string
          period_start: string
          period_end: string
          data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          report_type: string
          period_start: string
          period_end: string
          data: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          report_type?: string
          period_start?: string
          period_end?: string
          data?: Json
          created_at?: string
        }
      }
      cta_buttons: {
        Row: {
          id: string
          user_id: string
          name: string
          text: string
          url: string
          style: Json
          click_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          text: string
          url: string
          style?: Json
          click_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          text?: string
          url?: string
          style?: Json
          click_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      cta_clicks: {
        Row: {
          id: string
          button_id: string
          tracking_id: string | null
          ip_address: string | null
          user_agent: string | null
          referrer: string | null
          clicked_at: string
        }
        Insert: {
          id?: string
          button_id: string
          tracking_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          clicked_at?: string
        }
        Update: {
          id?: string
          button_id?: string
          tracking_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          clicked_at?: string
        }
      }
      custom_domains: {
        Row: {
          id: string
          user_id: string
          domain: string
          verification_token: string
          is_verified: boolean
          verified_at: string | null
          dns_records: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          domain: string
          verification_token?: string
          is_verified?: boolean
          verified_at?: string | null
          dns_records?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          domain?: string
          verification_token?: string
          is_verified?: boolean
          verified_at?: string | null
          dns_records?: Json
          created_at?: string
          updated_at?: string
        }
      }
      delivery_certificates: {
        Row: {
          id: string
          tracking_id: string
          certificate_hash: string
          delivery_proof: Json
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tracking_id: string
          certificate_hash: string
          delivery_proof: Json
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tracking_id?: string
          certificate_hash?: string
          delivery_proof?: Json
          verified?: boolean
          created_at?: string
        }
      }
      polls: {
        Row: {
          id: string
          user_id: string
          tracking_id: string | null
          question: string
          options: Json
          allow_multiple: boolean
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tracking_id?: string | null
          question: string
          options: Json
          allow_multiple?: boolean
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tracking_id?: string | null
          question?: string
          options?: Json
          allow_multiple?: boolean
          expires_at?: string | null
          created_at?: string
        }
      }
      poll_votes: {
        Row: {
          id: string
          poll_id: string
          voter_email: string | null
          voter_ip: string | null
          selected_options: Json
          voted_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          voter_email?: string | null
          voter_ip?: string | null
          selected_options: Json
          voted_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          voter_email?: string | null
          voter_ip?: string | null
          selected_options?: Json
          voted_at?: string
        }
      }
      team_billing: {
        Row: {
          id: string
          team_id: string
          plan: string
          seats: number
          price_per_seat: number
          billing_cycle: string
          next_billing_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          plan: string
          seats?: number
          price_per_seat?: number
          billing_cycle?: string
          next_billing_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          plan?: string
          seats?: number
          price_per_seat?: number
          billing_cycle?: string
          next_billing_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: string
          invited_by: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: string
          invited_by?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: string
          invited_by?: string | null
          joined_at?: string
        }
      }
      email_signatures: {
        Row: {
          id: string
          user_id: string
          name: string
          html_content: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          html_content: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          html_content?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      email_stats_mv: {
        Row: {
          tracking_id: string | null
          email_id: string | null
          user_id: string | null
          recipient_email: string | null
          subject: string | null
          sender_email: string | null
          created_at: string | null
          metadata: Json | null
          delivery_status: string | null
          bounce_type: string | null
          bounce_reason: string | null
          bounce_detected_at: string | null
          opens: number | null
          clicks: number | null
          self_opens: number | null
          unique_opens: number | null
          first_opened_at: string | null
          last_opened_at: string | null
        }
      }
    }
    Functions: {
      get_emails_with_stats: {
        Args: {
          p_user_id: string
          p_limit?: number
          p_offset?: number
          p_cursor_date?: string
        }
        Returns: {
          id: string
          tracking_id: string
          recipient_email: string
          subject: string
          sender_email: string
          created_at: string
          metadata: Json
          delivery_status: string
          bounce_type: string
          bounce_reason: string
          bounce_detected_at: string
          opens: number
          clicks: number
          self_opens: number
          unique_opens: number
          first_opened_at: string
          last_opened_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
