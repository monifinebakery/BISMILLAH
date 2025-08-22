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
          harga_satuan: number
          harga_rata_rata: number | null
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
          harga_satuan?: number
          harga_rata_rata?: number | null
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
          harga_satuan?: number
          harga_rata_rata?: number | null
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
      financial_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
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
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hpp_recipes: {
        Row: {
          biaya_overhead: number
          biaya_tenaga_kerja: number
          created_at: string
          deskripsi: string | null
          harga_jual_per_porsi: number
          hpp_per_porsi: number
          id: string
          ingredients: Json
          margin_keuntungan: number
          nama_resep: string
          porsi: number
          total_hpp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          biaya_overhead?: number
          biaya_tenaga_kerja?: number
          created_at?: string
          deskripsi?: string | null
          harga_jual_per_porsi?: number
          hpp_per_porsi?: number
          id?: string
          ingredients?: Json
          margin_keuntungan?: number
          nama_resep: string
          porsi?: number
          total_hpp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          biaya_overhead?: number
          biaya_tenaga_kerja?: number
          created_at?: string
          deskripsi?: string | null
          harga_jual_per_porsi?: number
          hpp_per_porsi?: number
          id?: string
          ingredients?: Json
          margin_keuntungan?: number
          nama_resep?: string
          porsi?: number
          total_hpp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hpp_results: {
        Row: {
          biaya_overhead: number
          biaya_tenaga_kerja: number
          created_at: string
          harga_jual_per_porsi: number
          hpp_per_porsi: number
          id: string
          ingredients: Json
          jumlah_porsi: number
          margin_keuntungan: number
          nama: string
          total_hpp: number
          user_id: string
        }
        Insert: {
          biaya_overhead?: number
          biaya_tenaga_kerja?: number
          created_at?: string
          harga_jual_per_porsi?: number
          hpp_per_porsi?: number
          id?: string
          ingredients?: Json
          jumlah_porsi?: number
          margin_keuntungan?: number
          nama: string
          total_hpp?: number
          user_id: string
        }
        Update: {
          biaya_overhead?: number
          biaya_tenaga_kerja?: number
          created_at?: string
          harga_jual_per_porsi?: number
          hpp_per_porsi?: number
          id?: string
          ingredients?: Json
          jumlah_porsi?: number
          margin_keuntungan?: number
          nama?: string
          total_hpp?: number
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
          items: Json
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
          items?: Json
          nama_pelanggan: string
          nomor_pesanan: string
          status?: string
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
          items?: Json
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
          user_id: string
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
          user_id: string
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
          user_id?: string
        }
        Relationships: []
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const