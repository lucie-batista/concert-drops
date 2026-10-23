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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      artist_affinity: {
        Row: {
          artist_id: string
          captured_at: string
          rank: number | null
          source: string
        }
        Insert: {
          artist_id: string
          captured_at?: string
          rank?: number | null
          source: string
        }
        Update: {
          artist_id?: string
          captured_at?: string
          rank?: number | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_affinity_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          genres: string[]
          id: string
          image_url: string | null
          name: string
          spotify_id: string
          ticketmaster_attraction_id: string | null
          ticketmaster_match: string
          updated_at: string
        }
        Insert: {
          genres?: string[]
          id?: string
          image_url?: string | null
          name: string
          spotify_id: string
          ticketmaster_attraction_id?: string | null
          ticketmaster_match?: string
          updated_at?: string
        }
        Update: {
          genres?: string[]
          id?: string
          image_url?: string | null
          name?: string
          spotify_id?: string
          ticketmaster_attraction_id?: string | null
          ticketmaster_match?: string
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          country_code: string | null
          geoname_id: number | null
          id: string
          latitude: number
          longitude: number
          name: string
          radius_miles: number
          refreshed_at: string | null
          region: string | null
          time_zone: string
        }
        Insert: {
          country_code?: string | null
          geoname_id?: number | null
          id: string
          latitude: number
          longitude: number
          name: string
          radius_miles?: number
          refreshed_at?: string | null
          region?: string | null
          time_zone: string
        }
        Update: {
          country_code?: string | null
          geoname_id?: number | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          radius_miles?: number
          refreshed_at?: string | null
          region?: string | null
          time_zone?: string
        }
        Relationships: []
      }
      event_artists: {
        Row: {
          artist_id: string
          event_id: string
        }
        Insert: {
          artist_id: string
          event_id: string
        }
        Update: {
          artist_id?: string
          event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_artists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          city_id: string
          genre: string | null
          has_my_artists: boolean
          id: string
          image_url: string | null
          local_date: string | null
          name: string
          performers: Json
          starts_at: string | null
          status: string | null
          subgenre: string | null
          updated_at: string
          url: string | null
          venue_id: string | null
        }
        Insert: {
          city_id: string
          genre?: string | null
          has_my_artists?: boolean
          id: string
          image_url?: string | null
          local_date?: string | null
          name: string
          performers?: Json
          starts_at?: string | null
          status?: string | null
          subgenre?: string | null
          updated_at?: string
          url?: string | null
          venue_id?: string | null
        }
        Update: {
          city_id?: string
          genre?: string | null
          has_my_artists?: boolean
          id?: string
          image_url?: string | null
          local_date?: string | null
          name?: string
          performers?: Json
          starts_at?: string | null
          status?: string | null
          subgenre?: string | null
          updated_at?: string
          url?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_runs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: number
          started_at: string
          status: string
          summary: Json | null
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: never
          started_at?: string
          status?: string
          summary?: Json | null
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: never
          started_at?: string
          status?: string
          summary?: Json | null
        }
        Relationships: []
      }
      reminder_sends: {
        Row: {
          sale_window_id: string
          sent_at: string
          slot: string
        }
        Insert: {
          sale_window_id: string
          sent_at?: string
          slot: string
        }
        Update: {
          sale_window_id?: string
          sent_at?: string
          slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_sends_sale_window_id_fkey"
            columns: ["sale_window_id"]
            isOneToOne: false
            referencedRelation: "sale_windows"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_windows: {
        Row: {
          description: string | null
          ends_at: string | null
          event_id: string
          id: string
          kind: string
          name: string
          starts_at: string
          url: string | null
        }
        Insert: {
          description?: string | null
          ends_at?: string | null
          event_id: string
          id?: string
          kind: string
          name: string
          starts_at: string
          url?: string | null
        }
        Update: {
          description?: string | null
          ends_at?: string | null
          event_id?: string
          id?: string
          kind?: string
          name?: string
          starts_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_windows_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_items: {
        Row: {
          created_at: string
          sale_window_id: string
        }
        Insert: {
          created_at?: string
          sale_window_id: string
        }
        Update: {
          created_at?: string
          sale_window_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_items_sale_window_id_fkey"
            columns: ["sale_window_id"]
            isOneToOne: true
            referencedRelation: "sale_windows"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          current_city_id: string
          id: boolean
          owner_user_id: string | null
        }
        Insert: {
          current_city_id: string
          id?: boolean
          owner_user_id?: string | null
        }
        Update: {
          current_city_id?: string
          id?: boolean
          owner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_current_city_id_fkey"
            columns: ["current_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      spotify_credentials: {
        Row: {
          authorized_at: string
          id: boolean
          refresh_token: string
          updated_at: string
        }
        Insert: {
          authorized_at: string
          id?: boolean
          refresh_token: string
          updated_at?: string
        }
        Update: {
          authorized_at?: string
          id?: boolean
          refresh_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          capacity: number | null
          city: string | null
          country_code: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          state_code: string | null
          time_zone: string | null
        }
        Insert: {
          capacity?: number | null
          city?: string | null
          country_code?: string | null
          id: string
          latitude?: number | null
          longitude?: number | null
          name: string
          state_code?: string | null
          time_zone?: string | null
        }
        Update: {
          capacity?: number | null
          city?: string | null
          country_code?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          state_code?: string | null
          time_zone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_owner: { Args: never; Returns: boolean }
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
