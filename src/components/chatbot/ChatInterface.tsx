// src/components/chatbot/ChatInterface.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, MessageCircle, X, RefreshCw, Send, MessageSquare } from 'lucide-react';
import { getChatbotService } from '@/services/chatbot/ChatbotService';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get user data for personalization
  const { settings } = useUserSettings();
  const { user } = useAuth();
  
  // Get chatbot service for current user
  const chatbotService = getChatbotService(user?.id);

  // Set business name for personalization
  useEffect(() => {
    if (settings.businessName && chatbotService) {
      chatbotService.setBusinessName(settings.businessName);
    }
  }, [settings.businessName, chatbotService, user?.id]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (content: string, sender: 'user' | 'bot') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  const updateMessage = (id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(msg =>
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message
    addMessage(userMessage, 'user');

    // Add loading message
    const loadingId = addMessage('Sedang memproses...', 'bot');
    updateMessage(loadingId, { isLoading: true });

    try {
      const response = await chatbotService.processMessage(userMessage, user?.id);

      // Replace loading message with actual response
      setMessages(prev => {
        // Remove loading message and add response in one update
        const filteredMessages = prev.filter(msg => msg.id !== loadingId);
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          content: response.text,
          sender: 'bot',
          timestamp: new Date()
        };
        return [...filteredMessages, newMessage];
      });

    } catch (error) {
      console.error('Chat error:', error);
      // Replace loading message with error response
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => msg.id !== loadingId);
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
          sender: 'bot',
          timestamp: new Date()
        };
        return [...filteredMessages, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    chatbotService.clearHistory();
    addWelcomeMessage();
  };

  const addWelcomeMessage = () => {
    const businessName = settings.businessName || 'Bisnis Anda';
    const isAuthenticated = !!user;

    const welcomeMessage = `👋 Halo! Saya adalah asisten AI untuk ${businessName}.

${isAuthenticated ? 
  'Saya bisa membantu Anda dengan:\n• Mencari dan mengelola pesanan\n• Update stok bahan baku\n• Generate laporan penjualan\n• Tambah biaya operasional' :
  'Untuk fitur lengkap seperti mengakses data pesanan, stok, dan laporan, silakan login terlebih dahulu.\n\nSaya masih bisa membantu dengan:\n• Pertanyaan umum tentang bakery\n• Tips manajemen bisnis\n• Panduan penggunaan aplikasi'
}

Silakan ketik pertanyaan Anda!`;
    addMessage(welcomeMessage, 'bot');
  };

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addWelcomeMessage();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 md:bottom-4 md:right-4">
      <Card className="w-[calc(100vw-3rem)] max-w-[450px] h-[calc(100vh-8rem)] max-h-[700px] shadow-xl border-2 border-orange-200 md:w-[450px] md:h-[700px]">
        {/* Header */}
        <CardHeader className="pb-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <CardTitle className="text-lg">{settings.businessName || 'Bisnis Anda'} Assistant</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title="Clear chat"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title="Close chat"
              >
                ×
              </Button>
            </div>
          </div>
          <div className="text-sm opacity-90">
            AI Assistant untuk manajemen bakery
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-[calc(100vh-16rem)] md:h-96 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Avatar */}
                  <Avatar className={`h-8 w-8 ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                    <AvatarFallback className={
                      message.sender === 'user'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-500 text-white'
                    }>
                      {message.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.sender === 'user'
                        ? 'bg-orange-500 text-white order-1'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Sedang memproses...</span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-orange-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ketik pesan Anda..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
              className="px-3"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Status indicator */}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>
              {isLoading ? 'Sedang memproses...' : 'Siap menerima pesan'}
            </span>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>AI Assistant</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
