import { supabase } from '@/integrations/supabase/client';
import { OpenRouterService } from './openrouter/OpenRouterService';
import { formatCurrency as formatCurrencyUtil } from '@/lib/shared/formatters';

// Get system prompt with dynamic currency support
const getChatbotSystemPrompt = (currencySymbol: string = 'Rp') => `You are a helpful bakery management assistant for HPP by Monifine. You ONLY answer questions about bakery data and operations. You MUST be accurate and never make up information.

What you CAN do:
- Answer questions about warehouse inventory (bahan baku)
- Show order information and search orders
- Display sales reports and financial summaries
- Explain business rules and guidelines
- Provide business strategy advice based on your data
- Analyze performance and suggest improvements
- Answer questions about bakery operations and management

What you CANNOT do:
- Create, update, or delete any data
- Perform any actions (like creating orders, updating stock)
- Give advice outside of bakery management
- Answer questions about topics other than the bakery system
- Make up or invent data that does not exist

How to respond:
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
- Format numbers as currency (${currencySymbol} XXX,XXX)
- Be polite and helpful in Indonesian language
- Keep responses concise and accurate

Business Context:
- This is HPP by Monifine - Progressive Web App for bakery HPP calculations
- Focus on accurate cost calculations for Indonesian bakery businesses
- Support UMKM (small businesses) with professional bakery management
- Provide data-driven insights and strategic recommendations
- Help optimize operations, reduce costs, and increase profitability

Remember: Accuracy is more important than being comprehensive. If you are not sure about something, it is better to admit it than guess.

IMPORTANT: When responding, use the provided data context to give accurate information. If the data shows no records, clearly state that. Always maintain the friendly, conversational tone.`;

export class ChatbotService {
  private openRouter: OpenRouterService;
  private history: Array<{role: 'user' | 'assistant', content: string, timestamp: number, importance: number}> = [];
  private businessName: string = 'Bisnis Anda';
  private ownerName: string = 'Kak';
  private currencySymbol: string = 'Rp';
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

  // Set currency symbol for personalization
  setCurrencySymbol(symbol: string) {
    this.currencySymbol = symbol || 'Rp';
    this.savePersistedData();
  }

  // Format currency with current symbol
  private formatCurrency(amount: number): string {
    const formatter = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${this.currencySymbol} ${formatter.format(amount)}`;
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
        // Get data context for AI
        const dataContext = await this.getDataContext(intent, userId || '');

        // Generate AI response with context
        const aiResponse = await this.openRouter.generateResponse(message, {
          systemPrompt: getChatbotSystemPrompt(this.currencySymbol),
          context: {
            intent: intent,
            ownerName: this.ownerName || 'Kak',
            businessName: this.businessName,
            currencySymbol: this.currencySymbol,
            data: dataContext,
            conversationHistory: this.getRecentHistory()
          }
        });

        const responseTime = Date.now() - startTime;
        this.analytics.responseTimes.push(responseTime);

        // Add response to history
        if (aiResponse && aiResponse.text) {
          this.history.push(this.createMessage('assistant', aiResponse.text));
          this.savePersistedData();
        }

        return {
          text: aiResponse.text,
          type: intent,
          data: dataContext
        };

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

  // Get data context for AI responses
  private async getDataContext(intent: string, userId: string): Promise<any> {
    try {
      switch (intent) {
        case 'inventory':
          return await this.getInventoryData(userId);
        case 'orderSearch':
          return await this.getOrderData(userId);
        case 'report':
          return await this.getReportData(userId);
        case 'rules':
          return { rules: this.getRulesData() };
        default:
          return {};
      }
    } catch (error) {
      console.error('Error getting data context:', error);
      return { error: 'Failed to load data' };
    }
  }

  // Get recent conversation history for context
  private getRecentHistory(): Array<{role: string, content: string}> {
    return this.history.slice(-5).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  // Helper methods for data context
  private async getInventoryData(userId: string) {
    try {
      const { data: materials, error } = await supabase
        .from('bahan_baku')
        .select('nama, stok, satuan, minimum, harga_satuan')
        .eq('user_id', userId)
        .limit(15);

      if (error) return { error: error.message, items: [], totalItems: 0 };

      const lowStock = materials?.filter((item: any) => item.stok <= (item.minimum || 0)) || [];

      return {
        totalItems: materials?.length || 0,
        lowStockCount: lowStock.length,
        items: materials || [],
        hasData: (materials?.length || 0) > 0,
        summary: `Total ${materials?.length || 0} bahan baku, ${lowStock.length} perlu restock`
      };
    } catch (error: any) {
      return { error: error.message, items: [], totalItems: 0 };
    }
  }

  private async getOrderData(userId: string) {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('nomor_pesanan, nama_pelanggan, total_pesanan, status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) return { error: error.message, orders: [], totalOrders: 0 };

      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_pesanan || 0), 0) || 0;

      return {
        totalOrders: orders?.length || 0,
        totalRevenue: totalRevenue,
        orders: orders || [],
        hasData: (orders?.length || 0) > 0,
        summary: `${orders?.length || 0} pesanan, ${this.formatCurrency(totalRevenue)} total`
      };
    } catch (error: any) {
      return { error: error.message, orders: [], totalOrders: 0 };
    }
  }

  private async getReportData(userId: string) {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);

      const { data: sales, error: salesError } = await supabase
        .from('orders')
        .select('total_pesanan')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('created_at', currentMonth + '-01T00:00:00')
        .lt('created_at', currentMonth + '-32T00:00:00');

      if (salesError) return { error: salesError.message, sales: 0 };

      const totalSales = sales?.reduce((sum, order) => sum + (order.total_pesanan || 0), 0) || 0;
      const orderCount = sales?.length || 0;
      const averageOrder = orderCount > 0 ? totalSales / orderCount : 0;

      return {
        totalSales: totalSales,
        orderCount: orderCount,
        averageOrder: averageOrder,
        month: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        hasData: totalSales > 0,
        summary: `${this.formatCurrency(totalSales)} dari ${orderCount} pesanan`
      };
    } catch (error: any) {
      return { error: error.message, sales: 0, orderCount: 0 };
    }
  }

  private getRulesData() {
    return {
      hppRules: [
        'Hitung berdasarkan resep yang akurat',
        'Waste factor maksimal 50%',
        'Biaya operasional proporsional',
        'Margin minimal 10%',
        'Harga jual = HPP × (1 + margin target %)',
      ],
      dataValidation: [
        'Bahan baku wajib nama, satuan, harga',
        'Stok gak boleh minus',
        'Update harga supplier bulanan',
        'Catat biaya operasional tepat waktu',
        'Monitor profit margin per resep',
      ],
      tips: [
        'Konsistensi kualitas > diskon',
        'Build loyal customer dengan service excellent',
        'Monitor kompetitor tapi tetap unik',
        'Expand pelan tapi steady dengan data akurat',
      ]
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
