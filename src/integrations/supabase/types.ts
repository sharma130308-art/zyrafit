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
      food_entries: {
        Row: {
          barcode: string | null
          calories: number
          carbs: number
          created_at: string
          date: string
          fat: number
          id: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          name: string
          photo_url: string | null
          protein: number
          quantity: number
          source: Database["public"]["Enums"]["food_source"]
          user_id: string
        }
        Insert: {
          barcode?: string | null
          calories?: number
          carbs?: number
          created_at?: string
          date?: string
          fat?: number
          id?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          name: string
          photo_url?: string | null
          protein?: number
          quantity?: number
          source?: Database["public"]["Enums"]["food_source"]
          user_id: string
        }
        Update: {
          barcode?: string | null
          calories?: number
          carbs?: number
          created_at?: string
          date?: string
          fat?: number
          id?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          name?: string
          photo_url?: string | null
          protein?: number
          quantity?: number
          source?: Database["public"]["Enums"]["food_source"]
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          age: number | null
          apple_health_connected: boolean
          created_at: string
          gender: string | null
          goal: string | null
          id: string
          obstacles: string | null
          onboarding_completed: boolean
          target_bmi: number | null
          target_body_fat_percent: number | null
          target_weight_kg: number | null
          updated_at: string
          user_id: string
          weight_kg: number | null
          workout_days_per_week: number | null
        }
        Insert: {
          age?: number | null
          apple_health_connected?: boolean
          created_at?: string
          gender?: string | null
          goal?: string | null
          id?: string
          obstacles?: string | null
          onboarding_completed?: boolean
          target_bmi?: number | null
          target_body_fat_percent?: number | null
          target_weight_kg?: number | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
          workout_days_per_week?: number | null
        }
        Update: {
          age?: number | null
          apple_health_connected?: boolean
          created_at?: string
          gender?: string | null
          goal?: string | null
          id?: string
          obstacles?: string | null
          onboarding_completed?: boolean
          target_bmi?: number | null
          target_body_fat_percent?: number | null
          target_weight_kg?: number | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
          workout_days_per_week?: number | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          breakfast_time: string
          carbs_goal: number
          created_at: string
          daily_calorie_goal: number
          dinner_time: string
          fat_goal: number
          id: string
          lunch_time: string
          protein_goal: number
          reminders_enabled: boolean
          snack_reminder_enabled: boolean
          snack_time: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          breakfast_time?: string
          carbs_goal?: number
          created_at?: string
          daily_calorie_goal?: number
          dinner_time?: string
          fat_goal?: number
          id?: string
          lunch_time?: string
          protein_goal?: number
          reminders_enabled?: boolean
          snack_reminder_enabled?: boolean
          snack_time?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          breakfast_time?: string
          carbs_goal?: number
          created_at?: string
          daily_calorie_goal?: number
          dinner_time?: string
          fat_goal?: number
          id?: string
          lunch_time?: string
          protein_goal?: number
          reminders_enabled?: boolean
          snack_reminder_enabled?: boolean
          snack_time?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          bmi: number | null
          body_fat_mass_kg: number | null
          body_fat_percent: number | null
          created_at: string
          height_m: number | null
          id: string
          logged_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          bmi?: number | null
          body_fat_mass_kg?: number | null
          body_fat_percent?: number | null
          created_at?: string
          height_m?: number | null
          id?: string
          logged_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          bmi?: number | null
          body_fat_mass_kg?: number | null
          body_fat_percent?: number | null
          created_at?: string
          height_m?: number | null
          id?: string
          logged_at?: string
          user_id?: string
          weight_kg?: number
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
      food_source: "manual" | "barcode" | "ai"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
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
      food_source: ["manual", "barcode", "ai"],
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
    },
  },
} as const
