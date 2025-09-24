// src/components/chatbot/FloatingChatbot.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Bot } from 'lucide-react';
import { ChatInterface } from './ChatInterface';

export const FloatingChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={toggleChat}
          size="lg"
          className={`
            h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110
            ${isOpen
              ? 'bg-red-500 hover:bg-red-600 rotate-180'
              : 'bg-blue-500 hover:bg-blue-600'
            }
          `}
          title={isOpen ? 'Tutup chat' : 'Buka chat assistant'}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </Button>

        {/* Status indicator */}
        {!isOpen && (
          <div className="absolute -top-2 -right-2">
            <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center bg-green-500 border-2 border-white">
              <Bot className="h-3 w-3 text-white" />
            </Badge>
          </div>
        )}
      </div>

      {/* Chat Interface */}
      <ChatInterface
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};
