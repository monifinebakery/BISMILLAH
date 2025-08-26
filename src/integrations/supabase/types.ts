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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          description: string
          id: string
          title: string
          type: string
          user_id: string
          value: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          title: string
          type: string
          user_id: string
          value?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          title?: string
          type?: string
          user_id?: string
          value?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          operasional_per_pcs: number
          overhead_per_pcs: number
          target_output_monthly: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          operasional_per_pcs?: number
          overhead_per_pcs?: number
          target_output_monthly?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          operasional_per_pcs?: number
          overhead_per_pcs?: number
          target_output_monthly?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      allocation_settings: {
        Row: {
          created_at: string
          metode: string
          nilai: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          metode?: string
          nilai?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          metode?: string
          nilai?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_updates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          release_date: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          release_date?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          release_date?: string
          title?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          created_at: string
          depresiasi: number
          deskripsi: string | null
          id: string
          kategori: string
          kondisi: string
          lokasi: string
          nama: string
          nilai_awal: number
          nilai_sekarang: number
          tanggal_beli: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          depresiasi?: number
          deskripsi?: string | null
          id?: string
          kategori: string
          kondisi: string
          lokasi: string
          nama: string
          nilai_awal?: number
          nilai_sekarang?: number
          tanggal_beli: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          depresiasi?: number
          deskripsi?: string | null
          id?: string
          kategori?: string
          kondisi?: string
          lokasi?: string
          nama?: string
          nilai_awal?: number
          nilai_sekarang?: number
          tanggal_beli?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bahan_baku: {
        Row: {
          created_at: string
          harga_rata_rata: number | null
          harga_satuan: number
          id: string
          kategori: string
          minimum: number
          nama: string
          satuan: string
          stok: number
          supplier: string | null
          tanggal_kadaluwarsa: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          harga_rata_rata?: number | null
          harga_satuan?: number
          id?: string
          kategori: string
          minimum?: number
          nama: string
          satuan: string
          stok?: number
          supplier?: string | null
          tanggal_kadaluwarsa?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          harga_rata_rata?: number | null
          harga_satuan?: number
          id?: string
          kategori?: string
          minimum?: number
          nama?: string
          satuan?: string
          stok?: number
          supplier?: string | null
          tanggal_kadaluwarsa?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          browser: string | null
          created_at: string | null
          device_id: string
          device_name: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          is_current: boolean | null
          last_active: string | null
          os: string | null
          refresh_token_hash: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_id: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_active?: string | null
          os?: string | null
          refresh_token_hash?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_id?: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_active?: string | null
          os?: string | null
          refresh_token_hash?: string | null
          user_id?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          related_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          date: string
          description: string
          id?: string
          related_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          related_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      followup_templates: {
        Row: {
          created_at: string
          id: string
          status: string
          template: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status: string
          template: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          template?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          auto_archive_days: number | null
          created_at: string
          daily_reports: boolean
          financial_alerts: boolean
          financial_notifications: boolean
          inventory_alerts: boolean
          inventory_notifications: boolean
          low_stock_alerts: boolean
          low_stock_threshold: number | null
          monthly_reports: boolean
          order_alerts: boolean
          order_notifications: boolean
          payment_alerts: boolean
          payment_notifications: boolean
          push_notifications: boolean
          reminder_notifications: boolean
          security_alerts: boolean
          stock_alerts: boolean
          stock_notifications: boolean
          system_notifications: boolean
          updated_at: string
          user_id: string
          weekly_reports: boolean
        }
        Insert: {
          auto_archive_days?: number | null
          created_at?: string
          daily_reports?: boolean
          financial_alerts?: boolean
          financial_notifications?: boolean
          inventory_alerts?: boolean
          inventory_notifications?: boolean
          low_stock_alerts?: boolean
          low_stock_threshold?: number | null
          monthly_reports?: boolean
          order_alerts?: boolean
          order_notifications?: boolean
          payment_alerts?: boolean
          payment_notifications?: boolean
          push_notifications?: boolean
          reminder_notifications?: boolean
          security_alerts?: boolean
          stock_alerts?: boolean
          stock_notifications?: boolean
          system_notifications?: boolean
          updated_at?: string
          user_id: string
          weekly_reports?: boolean
        }
        Update: {
          auto_archive_days?: number | null
          created_at?: string
          daily_reports?: boolean
          financial_alerts?: boolean
          financial_notifications?: boolean
          inventory_alerts?: boolean
          inventory_notifications?: boolean
          low_stock_alerts?: boolean
          low_stock_threshold?: number | null
          monthly_reports?: boolean
          order_alerts?: boolean
          order_notifications?: boolean
          payment_alerts?: boolean
          payment_notifications?: boolean
          push_notifications?: boolean
          reminder_notifications?: boolean
          security_alerts?: boolean
          stock_alerts?: boolean
          stock_notifications?: boolean
          system_notifications?: boolean
          updated_at?: string
          user_id?: string
          weekly_reports?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          expires_at: string | null
          icon: string | null
          id: string
          is_archived: boolean
          is_read: boolean
          message: string
          metadata: Json | null
          priority: number
          related_id: string | null
          related_type: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean
          is_read?: boolean
          message: string
          metadata?: Json | null
          priority?: number
          related_id?: string | null
          related_type?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean
          is_read?: boolean
          message?: string
          metadata?: Json | null
          priority?: number
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      operational_costs: {
        Row: {
          cost_category: string | null
          created_at: string
          deskripsi: string | null
          effective_date: string | null
          group: string
          id: string
          jenis: string
          jumlah_per_bulan: number
          nama_biaya: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_category?: string | null
          created_at?: string
          deskripsi?: string | null
          effective_date?: string | null
          group?: string
          id?: string
          jenis: string
          jumlah_per_bulan?: number
          nama_biaya: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_category?: string | null
          created_at?: string
          deskripsi?: string | null
          effective_date?: string | null
          group?: string
          id?: string
          jenis?: string
          jumlah_per_bulan?: number
          nama_biaya?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          alamat_pengiriman: string | null
          catatan: string | null
          created_at: string
          email_pelanggan: string | null
          id: string
          items: Json | null
          nama_pelanggan: string
          nomor_pesanan: string
          status: string
          tanggal: string
          telepon_pelanggan: string
          total_pesanan: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alamat_pengiriman?: string | null
          catatan?: string | null
          created_at?: string
          email_pelanggan?: string | null
          id?: string
          items?: Json | null
          nama_pelanggan: string
          nomor_pesanan: string
          status: string
          tanggal?: string
          telepon_pelanggan: string
          total_pesanan?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alamat_pengiriman?: string | null
          catatan?: string | null
          created_at?: string
          email_pelanggan?: string | null
          id?: string
          items?: Json | null
          nama_pelanggan?: string
          nomor_pesanan?: string
          status?: string
          tanggal?: string
          telepon_pelanggan?: string
          total_pesanan?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pemakaian_bahan: {
        Row: {
          bahan_baku_id: string
          created_at: string
          harga_efektif: number | null
          hpp_value: number | null
          id: string
          keterangan: string | null
          qty_base: number
          source_id: string | null
          source_type: string | null
          tanggal: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bahan_baku_id: string
          created_at?: string
          harga_efektif?: number | null
          hpp_value?: number | null
          id?: string
          keterangan?: string | null
          qty_base?: number
          source_id?: string | null
          source_type?: string | null
          tanggal?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bahan_baku_id?: string
          created_at?: string
          harga_efektif?: number | null
          hpp_value?: number | null
          id?: string
          keterangan?: string | null
          qty_base?: number
          source_id?: string | null
          source_type?: string | null
          tanggal?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pemakaian_bahan_bahan_baku_id_fkey"
            columns: ["bahan_baku_id"]
            isOneToOne: false
            referencedRelation: "bahan_baku"
            referencedColumns: ["id"]
          },
        ]
      }
      promos: {
        Row: {
          calculation_result: Json | null
          created_at: string
          data_promo: Json | null
          deskripsi: string | null
          id: string
          nama_promo: string
          status: string
          tanggal_mulai: string | null
          tanggal_selesai: string | null
          tipe_promo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calculation_result?: Json | null
          created_at?: string
          data_promo?: Json | null
          deskripsi?: string | null
          id?: string
          nama_promo: string
          status?: string
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          tipe_promo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calculation_result?: Json | null
          created_at?: string
          data_promo?: Json | null
          deskripsi?: string | null
          id?: string
          nama_promo?: string
          status?: string
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          tipe_promo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          catatan: string | null
          created_at: string
          id: string
          items: Json | null
          metode_perhitungan: string | null
          status: string | null
          supplier: string | null
          tanggal: string
          total_nilai: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          id?: string
          items?: Json | null
          metode_perhitungan?: string | null
          status?: string | null
          supplier?: string | null
          tanggal: string
          total_nilai?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          id?: string
          items?: Json | null
          metode_perhitungan?: string | null
          status?: string | null
          supplier?: string | null
          tanggal?: string
          total_nilai?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          bahan_resep: Json | null
          biaya_overhead: number
          biaya_tenaga_kerja: number
          created_at: string
          deskripsi: string | null
          foto_url: string | null
          harga_jual_per_pcs: number
          harga_jual_porsi: number
          hpp_per_pcs: number
          hpp_per_porsi: number
          id: string
          jumlah_pcs_per_porsi: number
          jumlah_porsi: number
          kategori_resep: string | null
          margin_keuntungan_persen: number
          nama_resep: string
          total_hpp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bahan_resep?: Json | null
          biaya_overhead?: number
          biaya_tenaga_kerja?: number
          created_at?: string
          deskripsi?: string | null
          foto_url?: string | null
          harga_jual_per_pcs?: number
          harga_jual_porsi?: number
          hpp_per_pcs?: number
          hpp_per_porsi?: number
          id?: string
          jumlah_pcs_per_porsi?: number
          jumlah_porsi?: number
          kategori_resep?: string | null
          margin_keuntungan_persen?: number
          nama_resep: string
          total_hpp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bahan_resep?: Json | null
          biaya_overhead?: number
          biaya_tenaga_kerja?: number
          created_at?: string
          deskripsi?: string | null
          foto_url?: string | null
          harga_jual_per_pcs?: number
          harga_jual_porsi?: number
          hpp_per_pcs?: number
          hpp_per_porsi?: number
          id?: string
          jumlah_pcs_per_porsi?: number
          jumlah_porsi?: number
          kategori_resep?: string | null
          margin_keuntungan_persen?: number
          nama_resep?: string
          total_hpp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          alamat: string | null
          catatan: string | null
          created_at: string
          email: string | null
          id: string
          kontak: string | null
          nama: string
          telepon: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alamat?: string | null
          catatan?: string | null
          created_at?: string
          email?: string | null
          id?: string
          kontak?: string | null
          nama: string
          telepon?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alamat?: string | null
          catatan?: string | null
          created_at?: string
          email?: string | null
          id?: string
          kontak?: string | null
          nama?: string
          telepon?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_payments: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_paid: boolean
          name: string | null
          order_id: string | null
          payment_status: string
          pg_reference_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_paid?: boolean
          name?: string | null
          order_id?: string | null
          payment_status?: string
          pg_reference_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_paid?: boolean
          name?: string | null
          order_id?: string | null
          payment_status?: string
          pg_reference_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_seen_updates: {
        Row: {
          id: string
          seen_at: string
          update_id: string
          user_id: string
        }
        Insert: {
          id?: string
          seen_at?: string
          update_id: string
          user_id: string
        }
        Update: {
          id?: string
          seen_at?: string
          update_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_seen_updates_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "app_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          address: string | null
          backup_settings: Json
          business_name: string
          created_at: string
          currency: string
          email: string | null
          id: string
          language: string
          notifications: Json
          owner_name: string
          phone: string | null
          security_settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          backup_settings?: Json
          business_name?: string
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          language?: string
          notifications?: Json
          owner_name?: string
          phone?: string | null
          security_settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          backup_settings?: Json
          business_name?: string
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          language?: string
          notifications?: Json
          owner_name?: string
          phone?: string | null
          security_settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      pemakaian_bahan_daily_mv: {
        Row: {
          date: string | null
          source_types: string | null
          total_hpp: number | null
          usage_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_overhead: {
        Args: { p_material_cost: number; p_user_id: string }
        Returns: number
      }
      calculate_realtime_profit: {
        Args: { p_period: string; p_user_id: string }
        Returns: {
          calculated_at: string
          cogs_materials: Json
          opex_costs: Json
          revenue_transactions: Json
          total_cogs: number
          total_opex: number
          total_revenue: number
        }[]
      }
      can_complete_order: {
        Args: { p_order_id: string }
        Returns: {
          available_ingredients: number
          can_complete: boolean
          insufficient_stock: Json
          total_ingredients: number
        }[]
      }
      complete_order_and_deduct_stock: {
        Args: { p_order_id: string }
        Returns: Json
      }
      create_new_order: {
        Args: { order_data: Json }
        Returns: string
      }
      get_order_statistics: {
        Args: { p_user_id: string }
        Returns: {
          average_order_value: number
          cancelled_orders: number
          completed_orders: number
          pending_orders: number
          total_orders: number
          total_revenue: number
        }[]
      }
      get_profit_trend: {
        Args: {
          p_end_period: string
          p_start_period: string
          p_user_id: string
        }
        Returns: {
          gross_profit: number
          net_profit: number
          period: string
          total_cogs: number
          total_opex: number
          total_revenue: number
        }[]
      }
      get_revenue_breakdown: {
        Args: { p_period: string; p_user_id: string }
        Returns: {
          amount: number
          category: string
          transaction_count: number
        }[]
      }
      get_total_costs: {
        Args: { p_user_id: string }
        Returns: number
      }
      is_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      record_material_usage: {
        Args: {
          p_bahan_baku_id: string
          p_harga_efektif?: number
          p_keterangan?: string
          p_qty_base: number
          p_source_id?: string
          p_source_type?: string
          p_tanggal?: string
        }
        Returns: string
      }
      refresh_pemakaian_daily_mv: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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
