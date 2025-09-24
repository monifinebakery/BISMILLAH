import { supabase } from '@/integrations/supabase/client';import { OpenRouterService } from './openrouter/OpenRouterService';

// System prompt for accurate chatbot responses
const CHATBOT_SYSTEM_PROMPT = `You are a helpful bakery management assistant for HPP by Monifine. You ONLY answer questions about bakery data and operations. You MUST be accurate and never make up information.

## What you CAN do:
- Answer questions about warehouse inventory (bahan baku)
- Show order information and search orders
- Display sales reports and financial summaries
- Explain business rules and guidelines
- Provide help about using the bakery management system

## What you CANNOT do:
- Create, update, or delete any data
- Perform any actions (like creating orders, updating stock)
- Give advice outside of bakery management
- Answer questions about topics other than the bakery system
- Make up or invent data that doesn't exist

## How to respond:
- Always check if the requested data exists before responding
- If data doesn't exist, say so clearly (e.g., "Belum ada data bahan baku")
- Use the exact data from the database queries
- Format numbers as Indonesian Rupiah (Rp XXX,XXX)
- Be polite and helpful in Indonesian language
- Keep responses concise and accurate
- If user asks for something you can't do, politely explain what you can help with

## Business Context:
- This is HPP by Monifine - Progressive Web App for bakery HPP calculations
- Focus on accurate cost calculations for Indonesian bakery businesses
- Support UMKM (small businesses) with professional bakery management

Remember: Accuracy is more important than being comprehensive. If you're not sure about something, it's better to admit it than guess.`;

export class ChatbotService {
  private openRouter: OpenRouterService;
  private history: Array<{role: 'user' | 'assistant', content: string, timestamp: number, importance: number}> = [];
  private businessName: string = 'Bisnis Anda';
  private ownerName: string = 'Kak';
  private readonly userId?: string;
  private readonly historyStorageKey: string;
  private readonly businessNameStorageKey: string;
  private readonly ownerNameStorageKey: string;

  private analytics = {
    totalConversations: 0,
    popularCommands: new Map<string, number>(),
    responseTimes: [],
  };

  constructor(userId?: string) {
    this.userId = userId;
    const storageSuffix = userId ? `_${userId}` : '_anonymous';
    this.historyStorageKey = `chatbot_history${storageSuffix}`;
    this.businessNameStorageKey = `chatbot_business_name${storageSuffix}`;
    this.ownerNameStorageKey = `chatbot_owner_name${storageSuffix}`;
    this.openRouter = new OpenRouterService();
    this.loadPersistedData();
  }

  // Helper method to create message objects with metadata
  private createMessage(role: 'user' | 'assistant', content: string, importance: number = 1) {
    return {
      role,
      content,
      timestamp: Date.now(),
      importance
    };
  }

  // Load persisted chat data
  private loadPersistedData() {
    try {
      const savedHistory = localStorage.getItem(this.historyStorageKey);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          this.history = parsedHistory;
        }
      }

      const savedBusinessName = localStorage.getItem(this.businessNameStorageKey);
      if (savedBusinessName) {
        this.businessName = savedBusinessName;
      }

      const savedOwnerName = localStorage.getItem(this.ownerNameStorageKey);
      if (savedOwnerName) {
        this.ownerName = savedOwnerName;
      }
    } catch (error) {
      console.warn('Failed to load persisted chat data:', error);
      this.history = [];
      this.businessName = 'Bisnis Anda';
      this.ownerName = 'Kak';
    }
  }

  // Save chat data to localStorage
  private savePersistedData() {
    try {
      const recentHistory = this.history.slice(-50);
      localStorage.setItem(this.historyStorageKey, JSON.stringify(recentHistory));
      localStorage.setItem(this.businessNameStorageKey, this.businessName);
      localStorage.setItem(this.ownerNameStorageKey, this.ownerName);
    } catch (error) {
      console.warn('Failed to save chat data:', error);
    }
  }

  // Set business name for personalization
  setBusinessName(name: string) {
    this.businessName = name || 'Bisnis Anda';
    this.savePersistedData();
  }

  // Set owner name for personalization
  setOwnerName(name: string) {
    this.ownerName = name || 'Kak';
    this.savePersistedData();
  }

  async processMessage(message: string, userId?: string): Promise<any> {
    try {
      if (!message.trim()) {
        return { text: 'Pesan tidak boleh kosong.', type: 'error' };
      }

      // Detect intent using keywords
      const intent = this.detectIntentSimple(message);

      // Check authentication for database queries
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session && ['inventory', 'orderSearch', 'report'].includes(intent)) {
        return {
          text: 'Untuk mengakses data asli, silakan login terlebih dahulu.',
          type: 'error'
        };
      }

      // Add to history
      this.history.push(this.createMessage('user', message));

      const startTime = Date.now();

      try {
        // Query database based on intent
        let result: any = null;

        switch (intent) {
          case 'inventory':
            result = await this.queryInventory(userId!);
            break;
          case 'orderSearch':
            result = await this.queryOrders(userId!);
            break;
          case 'report':
            result = await this.queryReport(userId!);
            break;
          case 'rules':
            result = this.getRules();
            break;
          default:
            result = {
              type: 'general',
              text: `Halo! Saya bisa membantu Anda dengan:
• Cek stok bahan baku: "cek stok bahan baku"
• Cari pesanan: "cari pesanan"
• Laporan penjualan: "laporan bulan ini"
• Aturan bisnis: "aturan"

Coba ketik salah satu perintah di atas! 😊`
            };
        }

        const responseTime = Date.now() - startTime;
        this.analytics.responseTimes.push(responseTime);

        // Add response to history
        if (result && result.text) {
          this.history.push(this.createMessage('assistant', result.text));
          this.savePersistedData();
        }

        return result;

      } catch (error) {
        console.error('Chatbot error:', error);
        return {
          text: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
          type: 'error'
        };
      }
    } catch (error) {
      console.error('Process message error:', error);
      return {
        text: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        type: 'error'
      };
    }
  }

  private detectIntentSimple(message: string): string {
    const msg = message.toLowerCase();

    if (msg.includes('cek stok') || msg.includes('inventory') || msg.includes('bahan baku') || msg.includes('warehouse')) {
      return 'inventory';
    }

    if (msg.includes('cari pesanan') || msg.includes('lihat pesanan') || msg.includes('order') || msg.includes('pesanan')) {
      return 'orderSearch';
    }

    if (msg.includes('laporan') || msg.includes('report') || msg.includes('penjualan') || msg.includes('sales')) {
      return 'report';
    }

    if (msg.includes('aturan') || msg.includes('rules') || msg.includes('panduan')) {
      return 'rules';
    }

    return 'general';
  }

  private async queryInventory(userId: string) {
    try {
      const { data: materials, error } = await supabase
        .from('bahan_baku')
        .select('nama, stok, satuan, harga_satuan')
        .eq('user_id', userId)
        .limit(10);

      if (error) throw error;

      if (!materials || materials.length === 0) {
        return {
          type: 'inventory',
          text: '📦 Belum ada data bahan baku di warehouse Anda.'
        };
      }

      const list = materials.map((item: any) =>
        `• ${item.nama}: ${item.stok} ${item.satuan}`
      ).join('\n');

      return {
        type: 'inventory',
        text: `📦 Status Bahan Baku:\n\n${list}`,
        data: materials
      };

    } catch (error: any) {
      console.error('Inventory query error:', error);
      return {
        type: 'error',
        text: `❌ Gagal mengakses data warehouse: ${error.message}`
      };
    }
  }

  private async queryOrders(userId: string) {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('nomor_pesanan, nama_pelanggan, total_harga, status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (!orders || orders.length === 0) {
        return {
          type: 'orderSearch',
          text: '🔍 Tidak ada data pesanan.'
        };
      }

      const list = orders.map((order: any) =>
        `• ${order.nomor_pesanan}: ${order.nama_pelanggan} - Rp ${order.total_harga.toLocaleString('id-ID')}`
      ).join('\n');

      return {
        type: 'orderSearch',
        text: `📋 Pesanan Terbaru:\n\n${list}`,
        data: orders
      };

    } catch (error: any) {
      console.error('Order search error:', error);
      return {
        type: 'error',
        text: `❌ Gagal mencari data pesanan: ${error.message}`
      };
    }
  }

  private async queryReport(userId: string) {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);

      const { data: sales, error: salesError } = await supabase
        .from('orders')
        .select('total_harga')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('created_at', `${currentMonth}-01T00:00:00`)
        .lt('created_at', `${currentMonth}-32T00:00:00`);

      if (salesError) throw salesError;

      const totalSales = sales?.reduce((sum, order) => sum + (order.total_harga || 0), 0) || 0;

      return {
        type: 'report',
        text: `📊 Laporan Bulan Ini:\n\n💰 Total Penjualan: Rp ${totalSales.toLocaleString('id-ID')}`,
        data: { totalSales }
      };

    } catch (error: any) {
      console.error('Report query error:', error);
      return {
        type: 'error',
        text: `❌ Gagal membuat laporan: ${error.message}`
      };
    }
  }

  private getRules() {
    return {
      type: 'rules',
      text: `📋 Aturan Bisnis HPP by Monifine:

1. HPP harus dihitung akurat berdasarkan resep
2. Waste factor minimal 0%, maksimal 50%
3. Biaya operasional dialokasikan proporsional
4. Margin keuntungan minimal 10% untuk sustainability
5. Harga jual = HPP × (1 + margin target %)

6. Semua bahan baku wajib ada nama, satuan, harga
7. Stok bahan tidak boleh negatif
8. Update harga supplier minimal bulanan
9. Catat biaya operasional tepat waktu
10. Monitor profit margin per resep

💡 Tips: Fokus pada akurasi data dan efisiensi operasional!`
    };
  }

  // Public methods
  getHistory() {
    return this.history;
  }

  clearHistory() {
    this.history = [];
    this.savePersistedData();
    console.log('🤖 Chat history cleared');
  }

  clearPersistedData() {
    try {
      localStorage.removeItem(this.historyStorageKey);
      localStorage.removeItem(this.businessNameStorageKey);
      localStorage.removeItem(this.ownerNameStorageKey);
      console.log('🤖 All persisted chat data cleared');
    } catch (error) {
      console.warn('🤖 Failed to clear persisted data:', error);
    }
  }

  getAnalytics() {
    return {
      totalConversations: this.analytics.totalConversations,
      averageResponseTime: this.analytics.responseTimes.length > 0
        ? this.analytics.responseTimes.reduce((a, b) => a + b, 0) / this.analytics.responseTimes.length
        : 0,
      topCommands: Array.from(this.analytics.popularCommands.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    };
  }
}

// Singleton instances per user
const chatbotInstances: Map<string, ChatbotService> = new Map();

export const getChatbotService = (userId?: string): ChatbotService => {
  if (!userId) {
    if (!chatbotInstances.has('anonymous')) {
      chatbotInstances.set('anonymous', new ChatbotService());
    }
    return chatbotInstances.get('anonymous')!;
  }

  if (!chatbotInstances.has(userId)) {
    chatbotInstances.set(userId, new ChatbotService(userId));
  }
  return chatbotInstances.get(userId)!;
};
