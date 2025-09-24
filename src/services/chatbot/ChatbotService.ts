import { supabase } from '@/integrations/supabase/client';
import { OpenRouterService } from './openrouter/OpenRouterService';

export class ChatbotService {
  private openRouter: OpenRouterService;
  private history: Array<{role: 'user' | 'assistant', content: string, timestamp: number, importance: number}> = [];
  private businessName: string = 'Bisnis Anda';
  private ownerName: string = 'Kak'; // Default owner name
  private readonly userId?: string;
  private readonly historyStorageKey: string;
  private readonly businessNameStorageKey: string;
  private readonly ownerNameStorageKey: string;

  // Conversation context for NLP understanding
  private conversationContext: {
    currentTopic: string;
    lastIntent: string;
    activeEntities: Record<string, any>;
    conversationState: 'general' | 'inventory_focus' | 'order_focus' | 'report_focus' | 'emergency';
    confidence: number;
  } = {
    currentTopic: 'general',
    lastIntent: 'general',
    activeEntities: {},
    conversationState: 'general',
    confidence: 0.5
  };

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
    this.ownerNameStorageKey = `chatbot_owner_name${storageSuffix}`;
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

      // Load owner name
      const savedOwnerName = localStorage.getItem(this.ownerNameStorageKey);
      if (savedOwnerName) {
        this.ownerName = savedOwnerName;
      }

      console.log('🤖 Loaded persisted chat data:', { 
        messages: this.history.length, 
        businessName: this.businessName,
        ownerName: this.ownerName
      });
    } catch (error) {
      console.warn('🤖 Failed to load persisted chat data:', error);
      // Reset to defaults if loading fails
      this.history = [];
      this.businessName = 'Bisnis Anda';
      this.ownerName = 'Kak';
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

      // Save owner name
      localStorage.setItem(this.ownerNameStorageKey, this.ownerName);
      
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

  // Set owner name for personalization
  setOwnerName(name: string) {
    this.ownerName = name || 'Kak';
    console.log('🤖 Chatbot owner name set to:', this.ownerName);
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
      const intent = await this.detectIntent(normalizedMessage);

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

      try {
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

        // Add response to history only if response is valid
        if (response && response.text) {
          this.history.push(this.createMessage('assistant', response.text));
          this.savePersistedData();
          this.performMemoryCleanup();
        }

        return response;
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

  private normalizeMessage(message: string): string {
    return message
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ') // Remove special chars
      .replace(/\s+/g, ' '); // Normalize spaces
  }

  private detectIntent(message: string): string {
    // First try AI-powered intent detection for more natural understanding
    // Fall back to keyword matching if AI fails
    return this.detectIntentWithAI(message);
  }

  private async detectIntentWithAI(message: string): Promise<string> {
    try {
      console.log('🧠 Analyzing intent with AI for message:', message);

      const intentAnalysis = await this.openRouter.generateIntentAnalysis(message, {
        history: this.getContextHistory(),
        currentPage: this.detectCurrentPage(),
        businessName: this.businessName,
        availableActions: {
          canCreateOrders: true,
          canUpdateInventory: true,
          canCreateRecipes: true,
          canCreatePromos: true,
          canSearchOrders: true,
          canGenerateReports: true
        },
        // Enhanced context for better NLP understanding
        conversationContext: {
          currentTopic: this.conversationContext.currentTopic,
          lastIntent: this.conversationContext.lastIntent,
          conversationState: this.conversationContext.conversationState,
          activeEntities: this.conversationContext.activeEntities
        },
        systemPrompt: `You are an AI intent classifier for a bakery management chatbot. Analyze the user's message and determine the most appropriate intent considering the conversation context.

Available intents:
- greeting: General greetings and hello messages
- orderSearch: Finding, searching, or viewing existing orders
- inventory: Checking stock levels, warehouse status, or material availability
- purchase: Adding new purchases or buying materials
- orderCreate: Creating new customer orders
- orderDelete: Canceling or deleting orders
- inventoryUpdate: Updating stock levels or material quantities
- recipeCreate: Adding new recipes or products
- promoCreate: Creating promotional offers
- report: Generating sales reports, financial summaries, or analytics
- cost: Managing operational costs or expenses
- help: Asking for help, instructions, or guidance
- emergency: Urgent situations, emergencies, or critical issues
- general: General conversation, questions, or unclear requests

Current conversation context:
- Topic: ${this.conversationContext.currentTopic}
- Last intent: ${this.conversationContext.lastIntent}
- State: ${this.conversationContext.conversationState}

Consider context, synonyms, and natural language variations. Return only the intent name that best matches the user's message in the current conversation context.`
      });

      console.log('🤖 AI Intent Analysis Result:', intentAnalysis);

      // Extract intent from AI response
      if (intentAnalysis && intentAnalysis.intent) {
        const detectedIntent = intentAnalysis.intent.toLowerCase().trim();

        // Validate that the intent is one of our supported intents
        const validIntents = [
          'greeting', 'orderSearch', 'inventory', 'purchase', 'orderCreate',
          'orderDelete', 'inventoryUpdate', 'recipeCreate', 'promoCreate',
          'report', 'cost', 'help', 'emergency', 'general'
        ];

        if (validIntents.includes(detectedIntent)) {
          console.log('✅ AI-detected intent:', detectedIntent);

          // Update conversation context
          this.updateConversationContext(detectedIntent, message, intentAnalysis.confidence || 0.8);

          return detectedIntent;
        }
      }

      // Fallback to keyword matching if AI fails or returns invalid intent
      console.log('⚠️ AI intent detection failed, falling back to keyword matching');
      const keywordIntent = this.detectIntentWithKeywords(message);
      this.updateConversationContext(keywordIntent, message, 0.5);
      return keywordIntent;

    } catch (error) {
      console.warn('🧠 AI intent detection error, using keyword fallback:', error);
      const keywordIntent = this.detectIntentWithKeywords(message);
      this.updateConversationContext(keywordIntent, message, 0.5);
      return keywordIntent;
    }
  }

  private updateConversationContext(intent: string, message: string, confidence: number): void {
    // Update conversation state based on intent
    switch (intent) {
      case 'inventory':
      case 'inventoryUpdate':
        this.conversationContext.conversationState = 'inventory_focus';
        this.conversationContext.currentTopic = 'inventory_management';
        break;
      case 'orderCreate':
      case 'orderSearch':
      case 'orderDelete':
        this.conversationContext.conversationState = 'order_focus';
        this.conversationContext.currentTopic = 'order_management';
        break;
      case 'report':
        this.conversationContext.conversationState = 'report_focus';
        this.conversationContext.currentTopic = 'business_analytics';
        break;
      case 'emergency':
        this.conversationContext.conversationState = 'emergency';
        this.conversationContext.currentTopic = 'emergency_response';
        break;
      default:
        this.conversationContext.conversationState = 'general';
        this.conversationContext.currentTopic = 'general_conversation';
    }

    this.conversationContext.lastIntent = intent;
    this.conversationContext.confidence = confidence;

    // Extract and store entities from message (simple implementation)
    this.extractEntitiesFromMessage(message);

    console.log('📝 Updated conversation context:', {
      topic: this.conversationContext.currentTopic,
      state: this.conversationContext.conversationState,
      intent: this.conversationContext.lastIntent,
      confidence: this.conversationContext.confidence,
      entities: Object.keys(this.conversationContext.activeEntities)
    });
  }

  private extractEntitiesFromMessage(message: string): void {
    const lowerMessage = message.toLowerCase();

    // Extract numbers (quantities, amounts)
    const numberMatches = message.match(/\d+(\.\d+)?/g);
    if (numberMatches) {
      this.conversationContext.activeEntities.quantities = numberMatches.map(n => parseFloat(n));
    }

    // Extract material names (simple pattern)
    const materialPattern = /(tepung|gula|telur|margarin|susu|ragi|garam)/gi;
    const materials = message.match(materialPattern);
    if (materials) {
      this.conversationContext.activeEntities.materials = materials;
    }

    // Extract customer names (capitalized words)
    const customerPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
    const customers = message.match(customerPattern);
    if (customers) {
      this.conversationContext.activeEntities.customers = customers;
    }
  }

  private detectIntentWithKeywords(message: string): string {
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
    const isLoggedIn = !!currentUserId;
    const greeting = this.ownerName ? `Halo ${this.ownerName}! 👋` : 'Halo Kak! 👋';
    const businessRef = this.businessName ? `bakery ${this.businessName}` : 'bakery Kakak';

    return `${greeting} Saya adalah asisten AI untuk ${businessRef}. Saya di sini untuk bantu ${this.ownerName || 'Kakak'} kelola bisnis bakery dengan cara yang simpel dan asik!

CARA KERJA SAYA:
${isLoggedIn ? `
✅ KALAU ${this.ownerName || 'KAKAK'} SUDAH LOGIN, SAYA BISA:
- Bikin pesanan baru: "Buat pesanan donat untuk Bu Ani 5000 rupiah"
- Update stok bahan: "Tambah stok tepung jadi 50 kg"
- Bikin resep baru: "Tambah resep kue coklat harganya 15rb"
- Promo diskon: "Buat promo diskon 20% untuk roti"
- Cari data pesanan: "Tampilkan pesanan hari ini"
- Laporan penjualan: "Laporan bulan ini dong"

✅ SAYA AKAN LANGSUNG EKSEKUSI PERINTAH ${this.ownerName || 'KAKAK'}:
- Bikin pesanan → langsung masuk database orders
- Update stok → langsung update warehouse
- Buat resep → langsung tambah ke katalog
- Ga pernah cuma ngomong doang, tapi BENAR-BENAR ngeksekusi!

✅ KALAU ADA YANG SALAH, SAYA BAKAL BILANG JUJUR:
- "Maaf ${this.ownerName || 'Kak'}, informasi kurang lengkap nih. Coba sebut nama customer dan harganya ya"
- "Waduh ${this.ownerName || 'Kak'}, bahan 'tepung' ga ketemu di warehouse. Cek lagi nama bahannya ya"
` : `
❌ KALAU ${this.ownerName || 'KAKAK'} BELUM LOGIN, SAYA CUMA BISA:
- Ngobrol santai tentang bakery
- Kasih tips bisnis
- Jelasin cara pake aplikasi

Tapi untuk fitur keren kayak bikin pesanan, update stok, dll → ${this.ownerName || 'Kakak'} harus login dulu ya! 😊
`}

GAYA NGOBROL SAYA:
- Selalu pakai nama ${this.ownerName || 'Kakak'} untuk panggil ${this.ownerName || 'Kakak'}
- Bahasa santai tapi tetap sopan, kayak temen deket
- Pakai emoji yang relevan biar lebih asik
- Kalau berhasil: "Sip ${this.ownerName || 'Kak'}! Udah berhasil nih 🎉"
- Kalau ada masalah: "Maaf ${this.ownerName || 'Kak'}, ada yang salah nih 😅"
- Selalu kasih penawaran bantuan: "Ada lagi yang bisa dibantu, ${this.ownerName || 'Kak'}?"

BISNIS KITA:
- Produk: donat, roti, kue, cake, pastry - semua enak!
- Fokus: kelola pesanan, stok bahan, resep, dan promosi
- Target: bantu ${this.ownerName || 'Kakak'} sukses kelola bakery dengan mudah

PRINSIP SAYA:
1. Jujur dan transparan - ga pernah bohong
2. Cepat dan akurat - langsung eksekusi perintah
3. Ramah dan membantu - selalu siap bantu ${this.ownerName || 'Kakak'}
4. Aman dan reliable - data ${this.ownerName || 'Kakak'} aman di tangan saya

${this.ownerName || 'Kakak'} butuh bantuan apa hari ini? 😊`;
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
