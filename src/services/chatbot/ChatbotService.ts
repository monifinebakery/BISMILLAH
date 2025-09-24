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
      // Debug: Log incoming parameters
      console.log('🤖 ChatbotService.processMessage called:', {
        message,
        userId,
        userIdType: typeof userId,
        userIdLength: userId?.length,
        hasUserId: !!userId
      });

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
          systemPrompt: CHATBOT_SYSTEM_PROMPT,          history: this.getContextHistory(), // Smart context window
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
    // Use keyword-based intent detection for reliable matching
    // Direct keyword matching approach
    return this.detectIntentSimple(message);
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

  private detectIntentSimple(message: string): string {
    const msg = message.toLowerCase();

    // Simple keyword matching
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
}    }


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
