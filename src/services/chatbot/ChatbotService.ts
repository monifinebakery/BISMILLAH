import { supabase } from '@/integrations/supabase/client';

// System prompt for accurate chatbot responses
const CHATBOT_SYSTEM_PROMPT = `You are a helpful bakery management assistant for HPP by Monifine. You ONLY answer questions about bakery data and operations. You MUST be accurate and never make up information.

## What you CAN do:
- Answer questions about warehouse inventory (bahan baku)
- Show order information and search orders
- Display sales reports and financial summaries
- Explain business rules and guidelines
- Provide business strategy advice based on your data
- Analyze performance and suggest improvements
- Answer questions about bakery operations and management

## What you CANNOT do:
- Create, update, or delete any data
- Perform any actions (like creating orders, updating stock)
- Give advice outside of bakery management
- Answer questions about topics other than the bakery system
- Make up or invent data that does not exist

## How to respond:
- Always use friendly, conversational Indonesian language
- Address the user as "Kak [owner name]" in a friendly, conversational way
- Use Indonesian language naturally, like chatting with a good friend
- Be enthusiastic, supportive, and engaging with appropriate emojis
- Keep responses concise but warm and encouraging
- Show genuine interest in their bakery business success
- End responses with questions to continue conversation when appropriate
- Celebrate successes and empathize with challenges
- Use casual Indonesian (ngobrol santai) - avoid formal language
- Make responses feel personal and caring, not robotic
- Adapt your response style based on the data context provided
- If no data is available, guide the user on how to add data or use features
- Always check if the requested data exists before responding
- If data does not exist, say so clearly (e.g., "Belum ada data bahan baku, Kak")
- Use the exact data from the database queries
- Format numbers as Indonesian Rupiah (Rp XXX,XXX)
- Be polite and helpful in Indonesian language
- Keep responses concise and accurate

## Business Context:
- This is HPP by Monifine - Progressive Web App for bakery HPP calculations
- Focus on accurate cost calculations for Indonesian bakery businesses
- Support UMKM (small businesses) with professional bakery management
- Provide data-driven insights and strategic recommendations
- Help optimize operations, reduce costs, and increase profitability

Remember: Accuracy is more important than being comprehensive. If you are not sure about something, it is better to admit it than guess.`;

export class ChatbotService {
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
    const storageSuffix = userId ? '_' + userId : '_anonymous';
    this.historyStorageKey = 'chatbot_history' + storageSuffix;
    this.businessNameStorageKey = 'chatbot_business_name' + storageSuffix;
    this.ownerNameStorageKey = 'chatbot_owner_name' + storageSuffix;
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
          text: 'Halo Kak! Untuk lihat data asli, Kakak harus login dulu ya. Login dulu biar bisa akses semua fitur keren! 🔐',
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
              text: 'Halo Kak ' + (this.ownerName || 'Kak') + '! 😊 Saya asisten bakery HPP by Monifine nih, siap bantu kelola bisnis Kakak!\n\nSaya bisa bantu Kakak dengan:\n🍞 **Cek stok bahan baku:** "cek stok bahan baku"\n📋 **Cari data pesanan:** "cari pesanan"\n📊 **Laporan penjualan:** "laporan bulan ini"\n📋 **Aturan bisnis:** "aturan"\n🎯 **Strategi & tips:** "strategi bisnis saya"\n\nCoba ketik salah satu perintah di atas ya Kak! Mau mulai dari mana nih? 🚀'
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
          text: 'Wah Kak, ada error nih. Coba lagi ya! Kalau masih error, bilang ke tim support ya! 😅',
          type: 'error'
        };
      }
    } catch (error) {
      console.error('Process message error:', error);
      return {
        text: 'Wah Kak, ada error nih. Coba lagi ya! Kalau masih error, bilang ke tim support ya! 😅',
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

    if (msg.includes('strategi') || msg.includes('strategy') || msg.includes('bisnis') || msg.includes('optimasi') || msg.includes('analisis') || msg.includes('cara') || msg.includes('bagaimana')) {
      return 'strategy';
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
          text: 'Halo Kak ' + (this.ownerName || 'Kak') + '! 📦 Belum ada data bahan baku di warehouse Kakak nih.\n\nYuk tambahin dulu ya! Buka menu "Warehouse" terus klik "Tambah Bahan Baku". Saya siap bantu cek stoknya kalau udah ada datanya! 😊'
        };
      }

      const list = materials.map((item: any) =>
        '• ' + item.nama + ': ' + item.stok + ' ' + item.satuan
      ).join('\n');

      const lowStock = materials.filter((item: any) => item.stok <= (item.minimum || 0));

      return {
        type: 'inventory',
        text: 'Halo Kak ' + (this.ownerName || 'Kak') + '! 👀 Ini nih status warehouse bahan baku Kakak:\n\n' + list + '\n\n' +
              (lowStock.length > 0 ? '⚠️ Wah Kak, ada ' + lowStock.length + ' bahan yang perlu direstock segera ya! Segera cek dan restock biar produksi lancar! 💪' : '✅ Wah keren Kak! Semua stok aman, produksi bisa jalan lancar! 🎉') + '\n\nAda lagi yang mau dicek Kak? 😊',
        data: materials
      };

    } catch (error: any) {
      console.error('Inventory query error:', error);
      return {
        type: 'error',
        text: '❌ Wah Kak, gagal akses data warehouse nih. Coba lagi ya! ' + error.message
      };
    }
  }

  private async queryOrders(userId: string) {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('nomor_pesanan, nama_pelanggan, total_pesanan, status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (!orders || orders.length === 0) {
        return {
          type: 'orderSearch',
          text: 'Halo Kak ' + (this.ownerName || 'Kak') + '! 📋 Belum ada data pesanan nih.\n\nYuk mulai jualan roti yang enak-enak! Customer pasti suka. Mau tau cara tambah pesanan? 😊'
        };
      }

      const list = orders.map((order: any) =>
        '• ' + order.nomor_pesanan + ': ' + order.nama_pelanggan + ' - Rp ' + order.total_pesanan.toLocaleString('id-ID')
      ).join('\n');

      return {
        type: 'orderSearch',
        text: 'Halo Kak ' + (this.ownerName || 'Kak') + '! 📋 Ini nih pesanan terbaru Kakak:\n\n' + list + '\n\nWah Kak, bisnisnya lagi rame ya! 🎉 Mau lihat detail pesanan tertentu? Bilang aja nomor pesanannya! 😊',
        data: orders
      };

    } catch (error: any) {
      console.error('Order search error:', error);
      return {
        type: 'error',
        text: '❌ Wah Kak, gagal cari data pesanan nih. Coba lagi ya! ' + error.message
      };
    }
  }

  private async queryReport(userId: string) {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);

      const { data: sales, error: salesError } = await supabase
        .from('orders')
        .select('total_pesanan')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('created_at', currentMonth + '-01T00:00:00')
        .lt('created_at', currentMonth + '-32T00:00:00');

      if (salesError) throw salesError;

      const totalSales = sales?.reduce((sum, order) => sum + (order.total_pesanan || 0), 0) || 0;

      return {
        type: 'report',
        text: 'Halo Kak ' + (this.ownerName || 'Kak') + '! 📊 Nih laporan penjualan bulan ini:\n\n💰 **Total Penjualan:** Rp ' + totalSales.toLocaleString('id-ID') + '\n\n' +
              (totalSales > 0 ? 'Wah Kak, bagus banget performanya! 💪 Kalau mau lihat detail per hari atau per produk, bilang aja ya! 📈' : 'Belum ada penjualan bulan ini Kak. Yuk mulai promosi roti yang enak-enak! Semangat ya! 🚀') + '\n\nAda yang mau ditanyain lagi Kak? 😊',
        data: { totalSales }
      };

    } catch (error: any) {
      console.error('Report query error:', error);
      return {
        type: 'error',
        text: '❌ Wah Kak, gagal bikin laporan nih. Coba lagi ya! ' + error.message
      };
    }
  }

  private getRules() {
    return {
      type: 'rules',
      text: 'Halo Kak ' + (this.ownerName || 'Kak') + '! 📋 Nih aturan bisnis HPP by Monifine yang bisa bantu Kakak sukses:\n\n🧮 **Kalkulasi HPP:**\n1. Hitung berdasarkan resep yang akurat ya Kak!\n2. Waste factor maksimal 50%, jangan lebih\n3. Biaya operasional harus proporsional\n4. Margin minimal 10% biar sustainable\n5. Harga jual = HPP × (1 + margin target %)\n\n✅ **Validasi Data:**\n1. Bahan baku wajib ada nama, satuan, harga\n2. Stok gak boleh minus ya Kak\n3. Update harga supplier tiap bulan\n4. Catat biaya operasional tepat waktu\n5. Monitor profit margin per resep\n\n💡 **Tips Sukses Kak:**\n• Konsistensi kualitas lebih penting dari diskon\n• Build loyal customer dengan service excellent\n• Monitor kompetitor tapi tetap unik\n• Expand pelan tapi steady dengan data akurat\n\nSemangat ya Kak! 💪 Ada yang mau ditanyain? 😊'
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
