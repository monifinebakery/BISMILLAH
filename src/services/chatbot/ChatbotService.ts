import { OpenRouterService } from './openrouter/OpenRouterService';

export class ChatbotService {
  private openRouter: OpenRouterService;
  private history: Array<{role: 'user' | 'assistant', content: string}> = [];
  private businessName: string = 'Bisnis Anda'; // Default fallback
  
  // Chat persistence key
  private readonly CHAT_HISTORY_KEY = 'chatbot_history';
  private readonly BUSINESS_NAME_KEY = 'chatbot_business_name';
  
  // Analytics tracking
  private analytics = {
    totalConversations: 0,
    popularCommands: new Map<string, number>(),
    responseTimes: [],
    emergencyCount: 0
  };

  constructor() {
    this.openRouter = new OpenRouterService();
    this.loadPersistedData();
  }

  // Load persisted chat data
  private loadPersistedData() {
    try {
      // Load chat history
      const savedHistory = localStorage.getItem(this.CHAT_HISTORY_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          this.history = parsedHistory;
        }
      }

      // Load business name
      const savedBusinessName = localStorage.getItem(this.BUSINESS_NAME_KEY);
      if (savedBusinessName) {
        this.businessName = savedBusinessName;
      }

      console.log('🤖 Loaded persisted chat data:', { 
        messages: this.history.length, 
        businessName: this.businessName 
      });
    } catch (error) {
      console.warn('🤖 Failed to load persisted chat data:', error);
      // Reset to defaults if loading fails
      this.history = [];
      this.businessName = 'Bisnis Anda';
    }
  }

  // Save chat data to localStorage
  private savePersistedData() {
    try {
      // Save chat history (keep only last 50 messages to avoid storage bloat)
      const recentHistory = this.history.slice(-50);
      localStorage.setItem(this.CHAT_HISTORY_KEY, JSON.stringify(recentHistory));
      
      // Save business name
      localStorage.setItem(this.BUSINESS_NAME_KEY, this.businessName);
      
      console.log('🤖 Saved chat data:', { messages: recentHistory.length });
    } catch (error) {
      console.warn('🤖 Failed to save chat data:', error);
    }
  }

  // Set business name for personalization
  setBusinessName(name: string) {
    this.businessName = name || 'Bisnis Anda';
    console.log('🤖 Chatbot business name set to:', this.businessName);
    this.savePersistedData(); // Save after update
  }

  async processMessage(message: string, userId?: string): Promise<any> {
    try {
      // Validate input
      if (!message.trim()) {
        return { text: 'Pesan tidak boleh kosong.', type: 'error' };
      }

      // Pre-processing
      const normalizedMessage = this.normalizeMessage(message);
      const intent = this.detectIntent(normalizedMessage);

      // Check if this intent requires database query
      const readIntents = ['orderSearch', 'inventory', 'report', 'cost'];
      const actionIntents = ['purchase', 'orderCreate', 'orderDelete', 'inventoryUpdate', 'recipeCreate', 'promoCreate'];
      
      if (readIntents.includes(intent) && userId) {
        // Handle read operations
        console.log('🤖 Attempting database read for intent:', intent, 'userId:', userId);
        try {
          const dbResponse = await this.queryDatabase(intent, message, userId);
          console.log('🤖 Database response:', dbResponse);
          if (dbResponse && dbResponse.type !== 'error') {
            this.history.push({ role: 'user', content: message });
            this.history.push({ role: 'assistant', content: dbResponse.text });
            this.savePersistedData();
            console.log('🤖 Returning database response');
            return dbResponse;
          } else {
            console.log('🤖 Database returned error or no data, falling back to AI');
          }
        } catch (error) {
          console.warn('Database query failed, falling back to AI:', error);
        }
      } else if (actionIntents.includes(intent) && userId) {
        // Handle action operations
        console.log('🤖 Attempting database action for intent:', intent, 'userId:', userId);
        try {
          const actionResponse = await this.performDatabaseAction(intent, message, userId);
          console.log('🤖 Action response:', actionResponse);
          if (actionResponse && actionResponse.type !== 'error') {
            this.history.push({ role: 'user', content: message });
            this.history.push({ role: 'assistant', content: actionResponse.text });
            this.savePersistedData();
            console.log('🤖 Action completed successfully');
            return actionResponse;
          } else {
            console.log('🤖 Action failed or returned error');
          }
        } catch (error) {
          console.warn('Database action failed:', error);
          // Return specific error message
          const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan sistem';
          const errorResponse = { 
            text: `❌ Gagal melakukan aksi: ${errorMessage}`, 
            type: 'error' 
          };
          this.history.push({ role: 'user', content: message });
          this.history.push({ role: 'assistant', content: errorResponse.text });
          this.savePersistedData();
          return errorResponse;
        }
      }

      // Track analytics
      this.analytics.totalConversations++;
      this.analytics.popularCommands.set(
        intent,
        (this.analytics.popularCommands.get(intent) || 0) + 1
      );

      // Emergency detection
      if (this.containsEmergencyKeywords(normalizedMessage)) {
        this.analytics.emergencyCount++;
        return this.handleEmergency(message);
      }

      // Add to history
      this.history.push({ role: 'user', content: message });

      const startTime = Date.now();

      // Get response from Grok
      const response = await this.openRouter.generateResponse(message, {
        history: this.history.slice(-10), // Keep last 10 messages
        intent: intent,
        currentPage: this.detectCurrentPage(),
        businessName: this.businessName // Pass business name for personalization
      });

      const responseTime = Date.now() - startTime;
      this.analytics.responseTimes.push(responseTime);

      // Add response to history
      this.history.push({ role: 'assistant', content: response.text });
      this.savePersistedData(); // Save after AI response

      return response;
    } catch (error) {
      console.error('Chatbot error:', error);
      return {
        text: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        type: 'error'
      };
    }
  }

  private normalizeMessage(message: string): string {
    return message
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ') // Remove special chars
      .replace(/\s+/g, ' '); // Normalize spaces
  }

  private detectIntent(message: string): string {
    const intents = {
      greeting: ['halo', 'hai', 'hi', 'selamat', 'pagi', 'siang', 'sore', 'malam', 'hey'],
      orderSearch: ['cari pesanan', 'lihat pesanan', 'find order', 'search order', 'cek pesanan'],
      inventory: ['stok', 'inventory', 'stock', 'update stok', 'cek stok', 'inventory'],
      purchase: ['tambah pembelian', 'beli bahan', 'purchase', 'add purchase', 'buat pembelian'],
      orderCreate: ['tambah pesanan', 'buat pesanan', 'create order', 'add order'],
      orderDelete: ['hapus pesanan', 'delete order', 'remove order', 'cancel order'],
      inventoryUpdate: ['update stok', 'ubah stok', 'change stock', 'modify inventory'],
      recipeCreate: ['tambah resep', 'buat resep', 'add recipe', 'create recipe'],
      promoCreate: ['tambah promo', 'buat promo', 'add promo', 'create promo'],
      report: ['laporan', 'report', 'sales', 'penjualan', 'keuangan', 'profit'],
      emergency: ['darurat', 'urgent', 'emergency', 'kebakaran', 'pencurian', 'kerusakan', 'breakdown'],
      cost: ['biaya', 'cost', 'operational', 'tambah biaya', 'add cost'],
      help: ['help', 'bantuan', 'tolong', 'cara', 'how to']
    };

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return intent;
      }
    }

    return 'general';
  }

  private detectCurrentPage(): string {
    // This would be enhanced with actual routing context
    // For now, return generic
    return 'Dashboard';
  }

  private containsEmergencyKeywords(message: string): boolean {
    const emergencyWords = [
      'darurat', 'urgent', 'emergency', 'kebakaran', 'pencurian', 'kerusakan', 'breakdown',
      'bahaya', 'accident', 'bantuan segera', 'tolong segera', 'critical'
    ];

    return emergencyWords.some(word => message.includes(word));
  }

  private handleEmergency(message: string): any {
    return {
      text: `🚨 SITUASI DARURAT TERDETEKSI!

📞 Kontak Emergency: +62812-3456-7890
🏥 Tim akan segera merespons
📍 Lokasi: BISMILLAH Bakery

Apakah Anda dalam kondisi aman? Butuh bantuan apa?

⚠️ PESAN DARURAT INI SUDAH DICATAT DI SISTEM`,
      type: 'emergency',
      emergency: true,
      actions: ['call_emergency', 'notify_team', 'log_incident']
    };
  }

  private async queryDatabase(intent: string, message: string, userId: string): Promise<any> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }

      // Use Supabase client to make authenticated request to Edge Function
      // Import dynamically to avoid bundle issues
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Call the Edge Function - Supabase will automatically include auth headers
      const { data, error } = await supabase.functions.invoke('chatbot-query', {
        body: {
          intent,
          message,
          context: {
            currentPage: this.detectCurrentPage(),
            businessName: this.businessName
          }
        }
      });

      if (error) {
        throw error;
      }

      return data;

    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  clearHistory() {
    this.history = [];
    this.savePersistedData(); // Save empty history
    console.log('🤖 Chat history cleared');
  }

  // Clear all persisted data
  clearPersistedData() {
    try {
      localStorage.removeItem(this.CHAT_HISTORY_KEY);
      localStorage.removeItem(this.BUSINESS_NAME_KEY);
      console.log('🤖 All persisted chat data cleared');
    } catch (error) {
      console.warn('🤖 Failed to clear persisted data:', error);
    }
  }

  getHistory() {
    return this.history;
  }

  getAnalytics() {
    return {
      ...this.analytics,
      averageResponseTime: this.analytics.responseTimes.length > 0
        ? this.analytics.responseTimes.reduce((a, b) => a + b, 0) / this.analytics.responseTimes.length
        : 0,
      topCommands: Array.from(this.analytics.popularCommands.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    };
  }

  // Auto-adjust rules based on analytics
  private adjustRulesBasedOnAnalytics() {
    const avgResponseTime = this.analytics.responseTimes.reduce((a, b) => a + b, 0) / this.analytics.responseTimes.length;

    if (avgResponseTime > 5000) { // Slow responses
      console.warn('⚠️ AI responses are slow. Consider using faster model.');
    }

    if (this.analytics.emergencyCount > 10) { // High emergency count
      console.warn('🚨 High emergency count detected. Review safety protocols.');
    }
  }

  private async performDatabaseAction(intent: string, message: string, userId: string): Promise<any> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }

      // Use Supabase client to make authenticated request to Edge Function
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Call the Edge Function for actions
      const { data, error } = await supabase.functions.invoke('chatbot-action', {
        body: {
          intent,
          message,
          userId, // Add userId for database operations
          context: {
            currentPage: this.detectCurrentPage(),
            businessName: this.businessName
          }
        }
      });

      if (error) {
        throw error;
      }

      return data;

    } catch (error) {
      console.error('Database action error:', error);
      throw error;
    }
}

// Singleton instances per user
const chatbotInstances = new Map<string, ChatbotService>();

export const getChatbotService = (userId?: string): ChatbotService => {
  if (!userId) {
    // Fallback for anonymous users
    if (!chatbotInstances.has('anonymous')) {
      chatbotInstances.set('anonymous', new ChatbotService());
    }
    return chatbotInstances.get('anonymous')!;
  }

  if (!chatbotInstances.has(userId)) {
    chatbotInstances.set(userId, new ChatbotService());
  }
  return chatbotInstances.get(userId)!;
};

// Legacy method for backward compatibility (but should use getChatbotService(userId))
let chatbotInstance: ChatbotService | null = null;
export const getChatbotServiceLegacy = (): ChatbotService => {
  if (!chatbotInstance) {
    chatbotInstance = new ChatbotService();
  }
  return chatbotInstance;
};
