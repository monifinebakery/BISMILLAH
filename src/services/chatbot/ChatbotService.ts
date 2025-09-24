import { OpenRouterService } from './openrouter/OpenRouterService';

export class ChatbotService {
  private openRouter: OpenRouterService;
  private history: Array<{role: 'user' | 'assistant', content: string}> = [];
  private businessName: string = 'Bisnis Anda'; // Default fallback

  // Analytics tracking
  private analytics = {
    totalConversations: 0,
    popularCommands: new Map<string, number>(),
    responseTimes: [],
    emergencyCount: 0
  };

  constructor() {
    this.openRouter = new OpenRouterService();
  }

  // Set business name for personalization
  setBusinessName(name: string) {
    this.businessName = name || 'Bisnis Anda';
    console.log('🤖 Chatbot business name set to:', this.businessName);
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
      const dataIntents = ['orderSearch', 'inventory', 'report', 'cost'];
      if (dataIntents.includes(intent) && userId) {
        try {
          const dbResponse = await this.queryDatabase(intent, message, userId);
          if (dbResponse && dbResponse.type !== 'error') {
            // Add to history
            this.history.push({ role: 'user', content: message });
            this.history.push({ role: 'assistant', content: dbResponse.text });
            return dbResponse;
          }
        } catch (error) {
          console.warn('Database query failed, falling back to AI:', error);
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

      // Get auth token - this assumes user is authenticated
      const token = localStorage.getItem('sb-access-token');
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/chatbot-query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent,
          message,
          context: {
            currentPage: this.detectCurrentPage(),
            businessName: this.businessName
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  clearHistory() {
    this.history = [];
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
