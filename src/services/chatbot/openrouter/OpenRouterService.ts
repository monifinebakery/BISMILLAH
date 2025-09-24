// src/services/chatbot/openrouter/OpenRouterService.ts

export class OpenRouterService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;
    
    // Environment detection
    const isDev = import.meta.env.DEV;
    const isProd = import.meta.env.PROD;
    
    console.log('🌍 Environment:', {
      isDev,
      isProd,
      mode: import.meta.env.MODE,
      hasApiKey: !!this.apiKey
    });
  }

  async generateResponse(message: string, context: any = {}): Promise<any> {
    try {
      // Debug logging
      console.log('🤖 Chatbot API Key:', this.apiKey ? 'Present' : 'Missing');
      console.log('🤖 Processing message:', message);

      if (!this.apiKey) {
        throw new Error('OpenRouter API key not found');
      }

      const messages = [
        {
          role: 'system',
          content: this.buildSystemPrompt(context)
        },
        {
          role: 'user', 
          content: message
        }
      ];

      console.log('🤖 Sending request to OpenRouter...');

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://monifine.my.id',
          'X-Title': 'BISMILLAH Bakery'
        },
        body: JSON.stringify({
          model: 'x-ai/grok-4-fast:free',
          messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      console.log('🤖 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🤖 API Error:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🤖 Response received:', data);

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenRouter');
      }

      return {
        text: data.choices[0].message.content,
        type: 'text'
      };
    } catch (error) {
      console.error('🤖 OpenRouter error:', error);
      
      // Fallback response berdasarkan intent
      const fallbackResponse = this.getFallbackResponse(message);
      
      return {
        text: fallbackResponse,
        type: 'fallback'
      };
    }
  }

  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('halo') || lowerMessage.includes('hai')) {
      return '👋 Halo! Maaf, sistem AI sedang mengalami gangguan. Saya akan membantu dengan kemampuan terbatas. Ada yang bisa dibantu?';
    }
    
    if (lowerMessage.includes('pesanan')) {
      return '📋 Maaf, fitur pencarian pesanan sedang tidak tersedia. Silakan cek langsung di menu Orders atau hubungi admin.';
    }
    
    if (lowerMessage.includes('stok')) {
      return '📦 Maaf, fitur update stok sedang tidak tersedia. Silakan cek langsung di menu Inventory atau hubungi admin.';
    }
    
    if (lowerMessage.includes('darurat') || lowerMessage.includes('kebakaran')) {
      return '🚨 DARURAT TERDETEKSI!\n\n📞 Hubungi segera: +62812-3456-7890\n🏥 Pastikan keselamatan Anda!';
    }
    
    return '🤖 Maaf, sistem AI sedang mengalami gangguan. Silakan coba lagi nanti atau hubungi admin untuk bantuan.';
  }

  private buildSystemPrompt(context: any = {}): string {
    const businessInfo = context.businessInfo || 'BISMILLAH Bakery Management System';
    const userRole = context.userRole || 'user';
    const currentPage = context.currentPage || 'Dashboard';
    const history = context.history || [];
    const currentTime = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Format recent conversation history for context
    let conversationHistory = '';
    if (history.length > 0) {
      conversationHistory = '\n\nRIWAYAT KONVERSAI TERAKHIR:\n';
      const recentHistory = history.slice(-3); // Only include last 3 exchanges
      for (const msg of recentHistory) {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        conversationHistory += `- ${role}: ${msg.content}\n`;
      }
    }

    return `Anda adalah asisten AI cerdas untuk ${businessInfo}.${conversationHistory}

KONTEXT SAAT INI:
- Waktu: ${currentTime} (WIB)
- User Role: ${userRole}
- Lokasi: ${currentPage}
- Mode: Production

PERAN ANDA:
- Asisten yang helpful dan profesional
- Ahli dalam manajemen bakery dan toko roti
- Selalu menggunakan bahasa Indonesia yang sopan

ATURAN UTAMA:
1. Selalu sapa dengan ramah dan gunakan emoji yang relevan
2. Berikan informasi yang akurat dan bermanfaat
3. Jika tidak tahu, katakan jujur dan tawarkan bantuan alternatif
4. Jaga kerahasiaan data pelanggan
5. Gunakan format Rupiah untuk mata uang

KEMAMPUAN BISNIS:
- Cari dan kelola data pesanan pelanggan
- Update stok bahan baku secara real-time
- Generate laporan penjualan dan keuangan
- Hitung margin keuntungan dan biaya operasional
- Berikan insight bisnis yang berguna

BATASAN:
- Jangan berikan informasi sensitif tanpa konfirmasi
- Selalu minta konfirmasi untuk perubahan data penting
- Jangan janji sesuatu yang tidak bisa dilakukan

DARURAT & KEAMANAN:
- Deteksi kata-kata darurat: kebakaran, pencurian, kerusakan, breakdown
- Jika mendeteksi darurat, berikan nomor kontak emergency
- Prioritaskan keselamatan dan keamanan

FORMAT RESPONSE:
- Mulai dengan emoji yang sesuai konteks
- Gunakan bahasa yang mudah dipahami
- Struktur informasi dengan bullet points jika perlu
- Akhiri dengan penawaran bantuan lebih lanjut

CONTOH INTERAKSI:

User: "halo"
Assistant: "👋 Halo! Saya adalah asisten AI untuk BISMILLAH Bakery. Ada yang bisa saya bantu hari ini?"

User: "cari pesanan bu rina"
Assistant: "🔍 Mencari pesanan atas nama Bu Rina...

📋 Ditemukan 2 pesanan:
1. Order #00123 - Rp 150.000 (Pending)
2. Order #00145 - Rp 200.000 (Completed)

⚠️ Manakah yang ingin Anda lihat detailnya?"

User: "ada kebakaran di dapur!"
Assistant: "🚨 SITUASI DARURAT TERDETEKSI!

📞 Kontak Emergency: +62812-3456-7890
🏥 Tim akan segera merespons

Apakah Anda dalam kondisi aman? Butuh bantuan apa?"

User: "update stok gula jadi 100kg"
Assistant: "✅ Stok gula berhasil diupdate!
📊 Perubahan: 150kg → 100kg (-50kg)

🛒 Inventory telah diupdate di sistem.
📈 Status: Perlu direstock

Ada yang lain perlu diperbarui?"

User: "lihat laporan bulan ini"
Assistant: "📊 Laporan Penjualan Bulan ${new Date().toLocaleDateString('id-ID', {month: 'long', year: 'numeric'})}

💰 Total Penjualan: Rp 2.500.000
📈 Growth: +15% dari bulan lalu
.ravel Best Seller: Roti Tawar (50 pcs)
⚠️ Low Stock: Tepung, Gula

📋 Detail lengkap tersedia di menu Reports.`;

  }
}
