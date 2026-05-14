 
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
      app_version: {
        Row: {
          change_log: string | null
          id: string
          updated_at: string | null
          version_number: number
        }
        Insert: {
          change_log?: string | null
          id?: string
          updated_at?: string | null
          version_number?: number
        }
        Update: {
          change_log?: string | null
          id?: string
          updated_at?: string | null
          version_number?: number
        }
        Relationships: []
      }
      github_connections: {
        Row: {
          access_token: string
          avatar_url: string | null
          connected_at: string | null
          created_at: string | null
          id: string
          last_sync_at: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          access_token: string
          avatar_url?: string | null
          connected_at?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          access_token?: string
          avatar_url?: string | null
          connected_at?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      issues: {
        Row: {
          assignees: Json | null
          body: string | null
          closed_at: string | null
          created_at: string | null
          github_id: number
          html_url: string | null
          id: string
          labels: Json | null
          number: number
          repository_id: string | null
          state: string
          synced_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assignees?: Json | null
          body?: string | null
          closed_at?: string | null
          created_at?: string | null
          github_id: number
          html_url?: string | null
          id?: string
          labels?: Json | null
          number: number
          repository_id?: string | null
          state: string
          synced_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assignees?: Json | null
          body?: string | null
          closed_at?: string | null
          created_at?: string | null
          github_id?: number
          html_url?: string | null
          id?: string
          labels?: Json | null
          number?: number
          repository_id?: string | null
          state?: string
          synced_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      repositories: {
        Row: {
          connection_id: string | null
          created_at: string | null
          description: string | null
          full_name: string
          github_id: number
          id: string
          is_private: boolean | null
          is_tracked: boolean | null
          last_synced_at: string | null
          name: string
          owner: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string | null
          description?: string | null
          full_name: string
          github_id: number
          id?: string
          is_private?: boolean | null
          is_tracked?: boolean | null
          last_synced_at?: string | null
          name: string
          owner: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string | null
          description?: string | null
          full_name?: string
          github_id?: number
          id?: string
          is_private?: boolean | null
          is_tracked?: boolean | null
          last_synced_at?: string | null
          name?: string
          owner?: string
        }
        Relationships: [
          {
            foreignKeyName: "repositories_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "github_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          active_github_connection_id: string | null
          app_name: string | null
          created_at: string | null
          github_token: string | null
          id: string
          logo_url: string | null
          selected_repos: Json | null
          theme: string | null
          updated_at: string | null
          user_id: string
          widget_order: Json | null
          widget_visibility: Json | null
          widgets_per_row: number | null
        }
        Insert: {
          active_github_connection_id?: string | null
          app_name?: string | null
          created_at?: string | null
          github_token?: string | null
          id?: string
          logo_url?: string | null
          selected_repos?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
          widget_order?: Json | null
          widget_visibility?: Json | null
          widgets_per_row?: number | null
        }
        Update: {
          active_github_connection_id?: string | null
          app_name?: string | null
          created_at?: string | null
          github_token?: string | null
          id?: string
          logo_url?: string | null
          selected_repos?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
          widget_order?: Json | null
          widget_visibility?: Json | null
          widgets_per_row?: number | null
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
  public: {
    Enums: {},
  },
} as const
