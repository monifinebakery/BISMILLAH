import { supabase } from '@/integrations/supabase/client';
import { OpenRouterService } from './openrouter/OpenRouterService';

export class ChatbotService {
  private openRouter: OpenRouterService;
  private history: Array<{role: 'user' | 'assistant', content: string, timestamp: number, importance: number}> = [];
  private businessName: string = 'Bisnis Anda';
  private readonly userId?: string;
  private readonly historyStorageKey: string;
  private readonly businessNameStorageKey: string;

  // Enhanced memory management
  private memoryConfig = {
    maxHistorySize: 100, // Maximum messages in memory
    persistentHistorySize: 30, // Messages saved to localStorage
    contextWindowSize: 8, // Messages sent to AI
    compressionThreshold: 50, // Compress messages older than this
    cleanupInterval: 5 * 60 * 1000, // 5 minutes cleanup interval
    maxStorageSize: 2 * 1024 * 1024, // 2MB max localStorage usage
  };

  private lastCleanup: number = Date.now();

  // Chat persistence key
  // Analytics tracking
  private analytics = {
    totalConversations: 0,
    popularCommands: new Map<string, number>(),
    responseTimes: [],
    emergencyCount: 0,
    memoryUsage: {
      totalMessages: 0,
      compressedMessages: 0,
      storageSize: 0,
      lastCleanup: Date.now()
    }
  };

  constructor(userId?: string) {
    this.userId = userId;
    const storageSuffix = userId ? `_${userId}` : '_anonymous';
    this.historyStorageKey = `chatbot_history${storageSuffix}`;
    this.businessNameStorageKey = `chatbot_business_name${storageSuffix}`;
    this.openRouter = new OpenRouterService();
    this.loadPersistedData();
  }

  // Helper method to create message objects with metadata
  private createMessage(role: 'user' | 'assistant', content: string, importance: number = 1): {role: 'user' | 'assistant', content: string, timestamp: number, importance: number} {
    return {
      role,
      content,
      timestamp: Date.now(),
      importance
    };
  }

  // Calculate message importance based on content
  private calculateImportance(content: string): number {
    let importance = 1; // Base importance

    // Higher importance for action-related messages
    if (content.includes('✅') || content.includes('berhasil') || content.includes('created') || content.includes('updated')) {
      importance += 2; // Successful actions
    }

    // High importance for errors or warnings
    if (content.includes('❌') || content.includes('error') || content.includes('gagal') || content.includes('warning')) {
      importance += 3;
    }

    // Medium importance for questions or requests
    if (content.includes('?') || content.includes('tolong') || content.includes('bisa') || content.includes('gimana')) {
      importance += 1;
    }

    // Low importance for greetings and acknowledgments
    if (content.includes('👋') || content.includes('halo') || content.includes('iya') || content.includes('oke')) {
      importance = Math.max(0.5, importance - 1);
    }

    return importance;
  }

  // Load persisted chat data
  private loadPersistedData() {
    try {
      // Load chat history
      const savedHistory = localStorage.getItem(this.historyStorageKey);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          this.history = parsedHistory;
        }
      }

      // Load business name
      const savedBusinessName = localStorage.getItem(this.businessNameStorageKey);
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
      localStorage.setItem(this.historyStorageKey, JSON.stringify(recentHistory));
      
      // Save business name
      localStorage.setItem(this.businessNameStorageKey, this.businessName);
      
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

      console.log('🤖 Processing message:', { intent, userId, normalizedMessage, serviceUserId: this.userId });

      // Check if this intent requires database query (read operations)
      const readIntents = ['orderSearch', 'inventory', 'report', 'cost'];
      const actionIntents = ['purchase', 'orderCreate', 'orderDelete', 'inventoryUpdate', 'recipeCreate', 'promoCreate'];

      // Always try to get AI response first for natural conversation
      // But prioritize database actions if intent is clearly actionable
      if (actionIntents.includes(intent) && userId) {
        console.log('🤖 Detected actionable intent, trying database action first:', intent);
        try {
          const actionResponse = await this.performDatabaseAction(intent, message, userId);
          if (actionResponse && actionResponse.type !== 'error') {
            const userImportance = this.calculateImportance(message);
            const assistantImportance = this.calculateImportance(actionResponse.text);
            
            this.history.push(this.createMessage('user', message, userImportance));
            this.history.push(this.createMessage('assistant', actionResponse.text, assistantImportance));
            this.savePersistedData();
            this.performMemoryCleanup();
            console.log('🤖 Action completed successfully');
            return actionResponse;
          }
        } catch (error) {
          console.warn('Database action failed, falling back to AI:', error);
          // Continue to AI response
        }
      } else if (readIntents.includes(intent) && userId) {
        console.log('🤖 Detected read intent, trying database query:', intent);
        try {
          const dbResponse = await this.queryDatabase(intent, message, userId);
          if (dbResponse && dbResponse.type !== 'error') {
            this.history.push(this.createMessage('user', message));
            this.history.push(this.createMessage('assistant', dbResponse.text));
            this.savePersistedData();
            this.performMemoryCleanup();
            console.log('🤖 Database query successful');
            return dbResponse;
          }
        } catch (error) {
          console.warn('Database query failed, falling back to AI:', error);
          // Continue to AI response
        }
      }

      // For all other cases (including unclear intents), use AI with enhanced context
      console.log('🤖 Using AI response for natural conversation');

      // Track analytics
      this.analytics.totalConversations++;
      this.analytics.popularCommands.set(
        intent,
        (this.analytics.popularCommands.get(intent) || 0) + 1
      );

      // Add to history
      this.history.push(this.createMessage('user', message));

      const startTime = Date.now();

      // Get enhanced AI response with action awareness
      const response = await this.openRouter.generateResponse(message, {
        history: this.getContextHistory(), // Smart context window
        intent: intent,
        currentPage: this.detectCurrentPage(),
        businessName: this.businessName,
        // Enhanced context for natural action detection
        availableActions: {
          canCreateOrders: !!userId,
          canUpdateInventory: !!userId,
          canCreateRecipes: !!userId,
          canCreatePromos: !!userId,
          canSearchOrders: !!userId,
          canGenerateReports: !!userId
        },
        systemPrompt: this.getEnhancedSystemPrompt(userId) // Pass userId to system prompt
      });

      const responseTime = Date.now() - startTime;
      this.analytics.responseTimes.push(responseTime);

      // Add response to history
      this.history.push(this.createMessage('assistant', response.text));
      this.savePersistedData();
      this.performMemoryCleanup();

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
      orderSearch: ['cari pesanan', 'lihat pesanan', 'find order', 'search order', 'cek pesanan', 'daftar pesanan'],
      inventory: ['stok', 'inventory', 'stock', 'update stok', 'cek stok', 'inventory'],
      purchase: ['tambah pembelian', 'beli bahan', 'purchase', 'add purchase', 'buat pembelian'],
      orderCreate: ['tambah pesanan', 'buat pesanan', 'create order', 'add order', 'pesan', 'order', 'beli donat', 'beli roti', 'beli kue'],
      orderDelete: ['hapus pesanan', 'delete order', 'remove order', 'cancel order'],
      inventoryUpdate: ['update stok', 'ubah stok', 'change stock', 'modify inventory'],
      recipeCreate: ['tambah resep', 'buat resep', 'add recipe', 'create recipe'],
      promoCreate: ['tambah promo', 'buat promo', 'add promo', 'create promo'],
      report: ['laporan', 'report', 'sales', 'penjualan', 'keuangan', 'profit'],
      emergency: ['darurat', 'urgent', 'emergency', 'kebakaran', 'pencurian', 'kerusakan', 'breakdown'],
      cost: ['biaya', 'cost', 'operational', 'tambah biaya', 'add cost'],
      help: ['help', 'bantuan', 'tolong', 'cara', 'how to']
    };

    // Special handling for order creation - more flexible detection
    const orderCreateKeywords = ['tambah pesanan', 'buat pesanan', 'create order', 'add order', 'pesan', 'order baru'];
    if (orderCreateKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      return 'orderCreate';
    }

    // Check for product ordering patterns
    const productOrderPattern = /(?:beli|pesan)\s+(?:donat|roti|kue|produk|cake)/i;
    if (productOrderPattern.test(message) && (message.includes('untuk') || message.includes('senilai') || /\d+/.test(message))) {
      return 'orderCreate';
    }

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
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        return {
          text: 'Untuk mengakses data asli, silakan login terlebih dahulu.',
          type: 'error'
        };
      }

      // Call the Edge Function - Supabase will automatically include auth headers
      const { data, error } = await supabase.functions.invoke('chatbot-query', {
        body: {
          intent,
          message,
          userId,
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
      localStorage.removeItem(this.historyStorageKey);
      localStorage.removeItem(this.businessNameStorageKey);
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

  // Advanced memory management with sliding window and compression
  private performMemoryCleanup() {
    const now = Date.now();

    // Periodic cleanup check
    if (now - this.lastCleanup > this.memoryConfig.cleanupInterval) {
      console.log('🧹 Performing memory cleanup...');

      // 1. Trim history to maximum size
      if (this.history.length > this.memoryConfig.maxHistorySize) {
        // Keep most important messages when trimming
        this.history = this.history
          .sort((a, b) => b.importance - a.importance) // Sort by importance
          .slice(0, this.memoryConfig.maxHistorySize) // Keep top messages
          .sort((a, b) => a.timestamp - b.timestamp); // Re-sort by time

        console.log(`🗂️ Trimmed history to ${this.history.length} messages`);
      }

      // 2. Compress old messages
      const compressionThreshold = now - (this.memoryConfig.compressionThreshold * 60 * 1000); // Convert to milliseconds
      let compressedCount = 0;

      this.history.forEach(msg => {
        if (msg.timestamp < compressionThreshold && !msg.content.startsWith('[COMPRESSED]')) {
          // Compress long messages
          if (msg.content.length > 200) {
            msg.content = `[COMPRESSED] ${msg.content.substring(0, 100)}...`;
            compressedCount++;
          }
        }
      });

      if (compressedCount > 0) {
        console.log(`🗜️ Compressed ${compressedCount} old messages`);
      }

      // 3. Check storage size
      const storageSize = this.calculateStorageSize();
      if (storageSize > this.memoryConfig.maxStorageSize) {
        console.log(`💾 Storage size (${(storageSize / 1024 / 1024).toFixed(2)}MB) exceeds limit, reducing persistent history`);

        // Reduce persistent history size
        this.memoryConfig.persistentHistorySize = Math.max(10, this.memoryConfig.persistentHistorySize - 5);

        // Force save with reduced size
        this.savePersistedData();
      }

      // Update analytics
      this.analytics.memoryUsage = {
        totalMessages: this.history.length,
        compressedMessages: compressedCount,
        storageSize,
        lastCleanup: now
      };

      this.lastCleanup = now;
      console.log('✅ Memory cleanup completed');
    }
  }

  // Calculate approximate storage size
  private calculateStorageSize(): number {
    try {
      const data = JSON.stringify({
        history: this.history.slice(-this.memoryConfig.persistentHistorySize),
        businessName: this.businessName
      });
      return new Blob([data]).size;
    } catch {
      return 0;
    }
  }

  // Smart context window that considers importance and recency
  private getContextHistory(): Array<{role: 'user' | 'assistant', content: string}> {
    if (this.history.length <= this.memoryConfig.contextWindowSize) {
      return this.history.map(msg => ({ role: msg.role, content: msg.content }));
    }

    // Get recent messages (last 5)
    const recentMessages = this.history.slice(-5);

    // Get important messages from earlier (top 5 by importance)
    const earlierMessages = this.history.slice(0, -5)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5)
      .sort((a, b) => a.timestamp - b.timestamp); // Re-sort by time

    // Combine and return as simple format for AI
    return [...earlierMessages, ...recentMessages]
      .map(msg => ({ role: msg.role, content: msg.content }));
  }

  // Enhanced system prompt for natural conversation with action awareness
  private getEnhancedSystemPrompt(currentUserId?: string): string {
    const isLoggedIn = !!currentUserId; // Use current userId instead of this.userId

    return `You are a helpful AI assistant for ${this.businessName}, a bakery management system.

CAPABILITIES:
${isLoggedIn ? `
✅ CAN perform database actions:
- Create new orders (tambah pesanan/buat pesanan)
- Update inventory stock (update stok)
- Create new recipes (tambah resep)
- Create promotions (tambah promo)
- Search existing orders (cari pesanan)
- Generate reports (laporan)
- Add operational costs (tambah biaya)

✅ ALWAYS execute database actions when users request them naturally:
- "Buatkan pesanan donat untuk Bu Rika 5000 rupiah" → Create order in database
- "Tambah stok tepung 10 kg" → Update inventory in database
- "Buat resep baru kue coklat" → Create recipe in database

✅ For orders, extract: customer name, amount, product type
✅ For inventory, extract: material name, quantity change
✅ For recipes, extract: recipe name, selling price

❌ NEVER simulate actions - ALWAYS perform real database operations
❌ NEVER give fake order numbers - use real ones from database
❌ NEVER say "I would create" - actually CREATE it
` : `
❌ CANNOT perform database actions (user not logged in)
- Only provide information and guidance
- Suggest logging in for full features
`}

RESPONSE STYLE:
- Be natural and conversational in Indonesian
- Use emoji appropriately
- For successful actions, show real database results
- For errors, explain clearly what went wrong
- Always confirm when actions are completed

BUSINESS CONTEXT:
- This is a bakery management system
- Products: donat, roti, kue, cake, pastry
- Focus on order management, inventory, recipes, promotions
- Support Indonesian language primarily

If user asks to perform an action, DO IT through the database system. Don't just talk about it.`;
  }

  private async performDatabaseAction(intent: string, message: string, userId: string): Promise<any> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        return {
          text: 'Silakan login untuk menjalankan aksi pada data Anda.',
          type: 'error'
        };
      }

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
}

// Singleton instances per user
const chatbotInstances: Map<string, ChatbotService> = new Map();

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
