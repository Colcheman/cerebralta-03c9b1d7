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
      achievements: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          requirement_type: string
          requirement_value: number
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          requirement_type: string
          requirement_value: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          requirement_type?: string
          requirement_value?: number
          title?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
      billing_history: {
        Row: {
          active_days: number
          asaas_payment_id: string | null
          base_amount: number
          created_at: string
          discount_percent: number
          final_amount: number
          id: string
          month: number
          paid_at: string | null
          status: string
          user_id: string
          year: number
        }
        Insert: {
          active_days?: number
          asaas_payment_id?: string | null
          base_amount?: number
          created_at?: string
          discount_percent?: number
          final_amount?: number
          id?: string
          month: number
          paid_at?: string | null
          status?: string
          user_id: string
          year: number
        }
        Update: {
          active_days?: number
          asaas_payment_id?: string | null
          base_amount?: number
          created_at?: string
          discount_percent?: number
          final_amount?: number
          id?: string
          month?: number
          paid_at?: string | null
          status?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          excerpt: string
          id: string
          keywords: string[]
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          excerpt?: string
          id?: string
          keywords?: string[]
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          keywords?: string[]
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          participant_1: string
          participant_2: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          participant_1: string
          participant_2: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          participant_1?: string
          participant_2?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          author_id: string
          category: string
          created_at: string
          description: string
          id: string
          is_premium: boolean
          pdf_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_id: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_premium?: boolean
          pdf_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_id?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_premium?: boolean
          pdf_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          creator_id: string
          description: string
          id: string
          is_active: boolean
          members_count: number
          name: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string
          id?: string
          is_active?: boolean
          members_count?: number
          name: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string
          id?: string
          is_active?: boolean
          members_count?: number
          name?: string
        }
        Relationships: []
      }
      login_history: {
        Row: {
          browser: string | null
          created_at: string
          device: string | null
          id: string
          ip_address: string | null
          location: string | null
          status: string
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          status?: string
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_address?: string | null
          location?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      missions: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          is_premium: boolean
          points: number
          title: string
          video_url: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          is_premium?: boolean
          points?: number
          title: string
          video_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          is_premium?: boolean
          points?: number
          title?: string
          video_url?: string | null
        }
        Relationships: []
      }
      news: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          created_at: string
          id: string
          message_type: string
          payload: Json
          recipient_user_id: string
          recipient_whatsapp: string
          sent_at: string | null
          status: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message_type?: string
          payload?: Json
          recipient_user_id: string
          recipient_whatsapp: string
          sent_at?: string | null
          status?: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message_type?: string
          payload?: Json
          recipient_user_id?: string
          recipient_whatsapp?: string
          sent_at?: string | null
          status?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      password_recovery_history: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          category: Database["public"]["Enums"]["post_category"]
          comments_count: number
          content: string
          created_at: string
          id: string
          is_premium: boolean
          likes_count: number
          quoted_post_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["post_category"]
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          is_premium?: boolean
          likes_count?: number
          quoted_post_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["post_category"]
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          is_premium?: boolean
          likes_count?: number
          quoted_post_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_quoted_post_id_fkey"
            columns: ["quoted_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accumulated_earnings: number
          allow_messages_from: string
          app_lock_pin: string | null
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          birth_date: string | null
          country: string
          cpf: string
          created_at: string
          display_name: string
          id: string
          language: string
          last_active_date: string | null
          level: string
          locale_configured: boolean
          name_verified: boolean
          notification_email: boolean
          notification_push: boolean
          notification_whatsapp: boolean
          points: number
          public_id: string
          real_name: string | null
          recovery_email: string | null
          streak: number
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          theme_preference: string
          timezone: string
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
          verification_status: string
          whatsapp_number: string | null
          whatsapp_opt_in: boolean
          whatsapp_status: string
        }
        Insert: {
          accumulated_earnings?: number
          allow_messages_from?: string
          app_lock_pin?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          birth_date?: string | null
          country?: string
          cpf?: string
          created_at?: string
          display_name: string
          id?: string
          language?: string
          last_active_date?: string | null
          level?: string
          locale_configured?: boolean
          name_verified?: boolean
          notification_email?: boolean
          notification_push?: boolean
          notification_whatsapp?: boolean
          points?: number
          public_id?: string
          real_name?: string | null
          recovery_email?: string | null
          streak?: number
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          theme_preference?: string
          timezone?: string
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
          verification_status?: string
          whatsapp_number?: string | null
          whatsapp_opt_in?: boolean
          whatsapp_status?: string
        }
        Update: {
          accumulated_earnings?: number
          allow_messages_from?: string
          app_lock_pin?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          birth_date?: string | null
          country?: string
          cpf?: string
          created_at?: string
          display_name?: string
          id?: string
          language?: string
          last_active_date?: string | null
          level?: string
          locale_configured?: boolean
          name_verified?: boolean
          notification_email?: boolean
          notification_push?: boolean
          notification_whatsapp?: boolean
          points?: number
          public_id?: string
          real_name?: string | null
          recovery_email?: string | null
          streak?: number
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          theme_preference?: string
          timezone?: string
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string
          verification_status?: string
          whatsapp_number?: string | null
          whatsapp_opt_in?: boolean
          whatsapp_status?: string
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          auto_logout_minutes: number
          created_at: string
          id: string
          notify_breach: boolean
          notify_failed_login: boolean
          notify_new_login: boolean
          notify_password_change: boolean
          notify_recovery: boolean
          notify_via_email: boolean
          notify_via_platform: boolean
          rate_limit_level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_logout_minutes?: number
          created_at?: string
          id?: string
          notify_breach?: boolean
          notify_failed_login?: boolean
          notify_new_login?: boolean
          notify_password_change?: boolean
          notify_recovery?: boolean
          notify_via_email?: boolean
          notify_via_platform?: boolean
          rate_limit_level?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_logout_minutes?: number
          created_at?: string
          id?: string
          notify_breach?: boolean
          notify_failed_login?: boolean
          notify_new_login?: boolean
          notify_password_change?: boolean
          notify_recovery?: boolean
          notify_via_email?: boolean
          notify_via_platform?: boolean
          rate_limit_level?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          created_at: string
          description: string
          id: string
          start_date: string
          status: string
          target_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          start_date?: string
          status?: string
          target_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          start_date?: string
          status?: string
          target_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_missions: {
        Row: {
          assigned_date: string
          completed: boolean
          completed_at: string | null
          id: string
          mission_id: string
          user_id: string
        }
        Insert: {
          assigned_date?: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          mission_id: string
          user_id: string
        }
        Update: {
          assigned_date?: string
          completed?: boolean
          completed_at?: string | null
          id?: string
          mission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      safe_profiles: {
        Row: {
          accumulated_earnings: number | null
          allow_messages_from: string | null
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          followers_count: number | null
          following_count: number | null
          level: string | null
          name_verified: boolean | null
          points: number | null
          public_id: string | null
          streak: number | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          user_id: string | null
        }
        Insert: {
          accumulated_earnings?: number | null
          allow_messages_from?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          followers_count?: never
          following_count?: never
          level?: string | null
          name_verified?: boolean | null
          points?: number | null
          public_id?: string | null
          streak?: number | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          user_id?: string | null
        }
        Update: {
          accumulated_earnings?: number | null
          allow_messages_from?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          followers_count?: never
          following_count?: never
          level?: string | null
          name_verified?: boolean | null
          points?: number | null
          public_id?: string | null
          streak?: number | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_set_premium: {
        Args: {
          _target_user_id: string
          _tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Returns: boolean
      }
      calculate_billing_amount: {
        Args: { _active_days: number }
        Returns: number
      }
      calculate_discount: { Args: { _active_days: number }; Returns: number }
      complete_mission: { Args: { _mission_id: string }; Returns: boolean }
      get_monthly_active_days: {
        Args: { _month?: number; _user_id: string; _year?: number }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      unlock_achievement: {
        Args: { _achievement_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      post_category: "reflexão" | "estratégia" | "estoicismo" | "prática"
      subscription_tier: "free" | "premium"
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
      app_role: ["admin", "moderator", "user"],
      post_category: ["reflexão", "estratégia", "estoicismo", "prática"],
      subscription_tier: ["free", "premium"],
    },
  },
} as const
