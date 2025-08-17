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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      archived_loads: {
        Row: {
          archived_at: string
          archived_reason: string | null
          created_at: string
          deadhead_miles: number | null
          destination: string
          fsc: number | null
          fuel_cost: number | null
          id: string
          miles: number
          notes: string | null
          origin: string
          original_created_at: string
          original_load_id: string
          profit: number
          quality: string
          rate: number
          rpm: number
          tags: string[] | null
          tolls: number | null
          user_id: string
          weight: number | null
        }
        Insert: {
          archived_at?: string
          archived_reason?: string | null
          created_at?: string
          deadhead_miles?: number | null
          destination: string
          fsc?: number | null
          fuel_cost?: number | null
          id?: string
          miles: number
          notes?: string | null
          origin: string
          original_created_at: string
          original_load_id: string
          profit: number
          quality: string
          rate: number
          rpm: number
          tags?: string[] | null
          tolls?: number | null
          user_id: string
          weight?: number | null
        }
        Update: {
          archived_at?: string
          archived_reason?: string | null
          created_at?: string
          deadhead_miles?: number | null
          destination?: string
          fsc?: number | null
          fuel_cost?: number | null
          id?: string
          miles?: number
          notes?: string | null
          origin?: string
          original_created_at?: string
          original_load_id?: string
          profit?: number
          quality?: string
          rate?: number
          rpm?: number
          tags?: string[] | null
          tolls?: number | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      business_setup: {
        Row: {
          admin_fee_flat: number | null
          admin_fee_percentage: number | null
          carrier_company_name: string | null
          created_at: string
          deadhead_compensation_rate: number | null
          deadhead_compensation_type: string | null
          deadhead_minimum_miles: number | null
          detention_minimum_hours: number | null
          detention_pay_rate: number | null
          extra_stop_rate: number | null
          factoring_fee_percentage: number | null
          fsc_handling: string | null
          fsc_split_percentage: number | null
          fuel_card_provided: boolean | null
          fuel_reimbursement_rate: number | null
          fuel_responsibility: string | null
          id: string
          insurance_responsibility: string | null
          layover_pay_rate: number | null
          loading_unloading_pay: number | null
          maintenance_coverage: string | null
          maintenance_deductible: number | null
          maintenance_max_coverage: number | null
          notes: string | null
          other_weekly_deductions: number | null
          pay_structure_type: string | null
          performance_bonus_amount: number | null
          performance_bonus_criteria: string | null
          revenue_split_percentage: number | null
          safety_bonus_amount: number | null
          setup_completed_at: string | null
          special_arrangements: string | null
          tarping_pay: number | null
          toll_responsibility: string | null
          updated_at: string
          user_id: string
          weekly_escrow_payment: number | null
          weekly_insurance_payment: number | null
          weekly_truck_payment: number | null
        }
        Insert: {
          admin_fee_flat?: number | null
          admin_fee_percentage?: number | null
          carrier_company_name?: string | null
          created_at?: string
          deadhead_compensation_rate?: number | null
          deadhead_compensation_type?: string | null
          deadhead_minimum_miles?: number | null
          detention_minimum_hours?: number | null
          detention_pay_rate?: number | null
          extra_stop_rate?: number | null
          factoring_fee_percentage?: number | null
          fsc_handling?: string | null
          fsc_split_percentage?: number | null
          fuel_card_provided?: boolean | null
          fuel_reimbursement_rate?: number | null
          fuel_responsibility?: string | null
          id?: string
          insurance_responsibility?: string | null
          layover_pay_rate?: number | null
          loading_unloading_pay?: number | null
          maintenance_coverage?: string | null
          maintenance_deductible?: number | null
          maintenance_max_coverage?: number | null
          notes?: string | null
          other_weekly_deductions?: number | null
          pay_structure_type?: string | null
          performance_bonus_amount?: number | null
          performance_bonus_criteria?: string | null
          revenue_split_percentage?: number | null
          safety_bonus_amount?: number | null
          setup_completed_at?: string | null
          special_arrangements?: string | null
          tarping_pay?: number | null
          toll_responsibility?: string | null
          updated_at?: string
          user_id: string
          weekly_escrow_payment?: number | null
          weekly_insurance_payment?: number | null
          weekly_truck_payment?: number | null
        }
        Update: {
          admin_fee_flat?: number | null
          admin_fee_percentage?: number | null
          carrier_company_name?: string | null
          created_at?: string
          deadhead_compensation_rate?: number | null
          deadhead_compensation_type?: string | null
          deadhead_minimum_miles?: number | null
          detention_minimum_hours?: number | null
          detention_pay_rate?: number | null
          extra_stop_rate?: number | null
          factoring_fee_percentage?: number | null
          fsc_handling?: string | null
          fsc_split_percentage?: number | null
          fuel_card_provided?: boolean | null
          fuel_reimbursement_rate?: number | null
          fuel_responsibility?: string | null
          id?: string
          insurance_responsibility?: string | null
          layover_pay_rate?: number | null
          loading_unloading_pay?: number | null
          maintenance_coverage?: string | null
          maintenance_deductible?: number | null
          maintenance_max_coverage?: number | null
          notes?: string | null
          other_weekly_deductions?: number | null
          pay_structure_type?: string | null
          performance_bonus_amount?: number | null
          performance_bonus_criteria?: string | null
          revenue_split_percentage?: number | null
          safety_bonus_amount?: number | null
          setup_completed_at?: string | null
          special_arrangements?: string | null
          tarping_pay?: number | null
          toll_responsibility?: string | null
          updated_at?: string
          user_id?: string
          weekly_escrow_payment?: number | null
          weekly_insurance_payment?: number | null
          weekly_truck_payment?: number | null
        }
        Relationships: []
      }
      lane_history: {
        Row: {
          avg_rpm: number
          created_at: string
          destination: string
          id: string
          last_updated: string
          load_count: number
          origin: string
          total_miles: number
          total_revenue: number
          user_id: string
        }
        Insert: {
          avg_rpm: number
          created_at?: string
          destination: string
          id?: string
          last_updated?: string
          load_count?: number
          origin: string
          total_miles: number
          total_revenue: number
          user_id: string
        }
        Update: {
          avg_rpm?: number
          created_at?: string
          destination?: string
          id?: string
          last_updated?: string
          load_count?: number
          origin?: string
          total_miles?: number
          total_revenue?: number
          user_id?: string
        }
        Relationships: []
      }
      loads: {
        Row: {
          created_at: string
          deadhead_miles: number | null
          destination: string
          fsc: number | null
          fuel_cost: number | null
          id: string
          miles: number
          notes: string | null
          origin: string
          profit: number
          quality: string
          rate: number
          rpm: number
          tags: string[] | null
          tolls: number | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          deadhead_miles?: number | null
          destination: string
          fsc?: number | null
          fuel_cost?: number | null
          id?: string
          miles: number
          notes?: string | null
          origin: string
          profit: number
          quality: string
          rate: number
          rpm: number
          tags?: string[] | null
          tolls?: number | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          deadhead_miles?: number | null
          destination?: string
          fsc?: number | null
          fuel_cost?: number | null
          id?: string
          miles?: number
          notes?: string | null
          origin?: string
          profit?: number
          quality?: string
          rate?: number
          rpm?: number
          tags?: string[] | null
          tolls?: number | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      negotiation_settings: {
        Row: {
          anchor_offset: number
          created_at: string
          floor_offset: number
          heavy_enabled: boolean
          heavy_method: string
          heavy_value: number
          heavy_weight_threshold: number
          id: string
          multi_stop_enabled: boolean
          multi_stop_method: string
          multi_stop_value: number
          premium_freight_enabled: boolean
          premium_freight_method: string
          premium_freight_value: number
          rush_enabled: boolean
          rush_method: string
          rush_threshold_hours: number
          rush_value: number
          updated_at: string
          user_id: string
          weekend_enabled: boolean
          weekend_method: string
          weekend_value: number
        }
        Insert: {
          anchor_offset?: number
          created_at?: string
          floor_offset?: number
          heavy_enabled?: boolean
          heavy_method?: string
          heavy_value?: number
          heavy_weight_threshold?: number
          id?: string
          multi_stop_enabled?: boolean
          multi_stop_method?: string
          multi_stop_value?: number
          premium_freight_enabled?: boolean
          premium_freight_method?: string
          premium_freight_value?: number
          rush_enabled?: boolean
          rush_method?: string
          rush_threshold_hours?: number
          rush_value?: number
          updated_at?: string
          user_id: string
          weekend_enabled?: boolean
          weekend_method?: string
          weekend_value?: number
        }
        Update: {
          anchor_offset?: number
          created_at?: string
          floor_offset?: number
          heavy_enabled?: boolean
          heavy_method?: string
          heavy_value?: number
          heavy_weight_threshold?: number
          id?: string
          multi_stop_enabled?: boolean
          multi_stop_method?: string
          multi_stop_value?: number
          premium_freight_enabled?: boolean
          premium_freight_method?: string
          premium_freight_value?: number
          rush_enabled?: boolean
          rush_method?: string
          rush_threshold_hours?: number
          rush_value?: number
          updated_at?: string
          user_id?: string
          weekend_enabled?: boolean
          weekend_method?: string
          weekend_value?: number
        }
        Relationships: []
      }
      negotiations: {
        Row: {
          anchor_rate: number
          created_at: string
          final_rate: number | null
          floor_rate: number
          id: string
          iterations: number
          load_id: string | null
          message_sent: string | null
          notes: string | null
          original_offer: number
          outcome: string | null
          response_time_minutes: number | null
          strategy_used: string
          target_rate: number
          updated_at: string
          user_id: string
        }
        Insert: {
          anchor_rate: number
          created_at?: string
          final_rate?: number | null
          floor_rate: number
          id?: string
          iterations?: number
          load_id?: string | null
          message_sent?: string | null
          notes?: string | null
          original_offer: number
          outcome?: string | null
          response_time_minutes?: number | null
          strategy_used: string
          target_rate: number
          updated_at?: string
          user_id: string
        }
        Update: {
          anchor_rate?: number
          created_at?: string
          final_rate?: number | null
          floor_rate?: number
          id?: string
          iterations?: number
          load_id?: string | null
          message_sent?: string | null
          notes?: string | null
          original_offer?: number
          outcome?: string | null
          response_time_minutes?: number | null
          strategy_used?: string
          target_rate?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "negotiations_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          business_setup_completed: boolean | null
          business_setup_completed_at: string | null
          created_at: string
          enable_fuel_cost_tracking: boolean
          fuel_price: number
          id: string
          mpg: number
          plan: string
          preferred_lanes: string[] | null
          rpm_threshold_excellent: number
          rpm_threshold_fair: number
          rpm_threshold_good: number
          setup_completion_percentage: number | null
          show_setup_reminders: boolean | null
          updated_at: string
          user_id: string
          weight_limit: number
        }
        Insert: {
          business_setup_completed?: boolean | null
          business_setup_completed_at?: string | null
          created_at?: string
          enable_fuel_cost_tracking?: boolean
          fuel_price?: number
          id?: string
          mpg?: number
          plan?: string
          preferred_lanes?: string[] | null
          rpm_threshold_excellent?: number
          rpm_threshold_fair?: number
          rpm_threshold_good?: number
          setup_completion_percentage?: number | null
          show_setup_reminders?: boolean | null
          updated_at?: string
          user_id: string
          weight_limit?: number
        }
        Update: {
          business_setup_completed?: boolean | null
          business_setup_completed_at?: string | null
          created_at?: string
          enable_fuel_cost_tracking?: boolean
          fuel_price?: number
          id?: string
          mpg?: number
          plan?: string
          preferred_lanes?: string[] | null
          rpm_threshold_excellent?: number
          rpm_threshold_fair?: number
          rpm_threshold_good?: number
          setup_completion_percentage?: number | null
          show_setup_reminders?: boolean | null
          updated_at?: string
          user_id?: string
          weight_limit?: number
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
