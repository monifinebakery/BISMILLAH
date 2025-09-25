#!/usr/bin/env node

// Simple test untuk cek keyword detection chatbot
// Jalankan dengan: node test-keyword-detection.cjs

const { getChatbotService } = require('./src/services/chatbot/ChatbotService');

// Test messages
const testMessages = [
  'cek stok bahan baku',
  'lihat inventory',
  'tambah pesanan donat',
  'buat laporan penjualan',
  'update stok tepung',
  'halo',
  'help',
  'apa kabar'
];

console.log('🧪 Testing Keyword Detection\n');

async function testKeywords() {
  const chatbot = getChatbotService();

  for (const message of testMessages) {
    // Use the detectIntentWithKeywords method directly
    const intent = chatbot.detectIntentWithKeywords ? chatbot.detectIntentWithKeywords(message) : 'method not found';

    console.log(`"${message}" → ${intent}`);
  }

  console.log('\n✅ Keyword detection test completed');
}

testKeywords();
