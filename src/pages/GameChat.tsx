
import { useState, useRef, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { SendHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGameContext } from '@/context/GameContext';
import { Message } from '@/types/game';
import { getGameResponse } from '@/data/games';

const GameChat = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { getGameById } = useGameContext();
  const game = gameId ? getGameById(gameId) : undefined;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add welcome message when component mounts
    if (game) {
      setMessages([
        {
          id: 'welcome',
          content: `Welcome to the ${game.title} rules assistant! Ask any question about how to play.`,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  }, [game]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!game) {
    return <Navigate to="/" />;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateResponse = (query: string): string => {
    return getGameResponse(gameId!, query);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response with delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateResponse(input),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-border bg-background p-4">
        <h1 className="text-xl font-semibold text-white">{game.title} Rules</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-xl p-4",
                  message.isUser
                    ? "bg-accent/90 text-white"
                    : "bg-muted text-foreground"
                )}
              >
                <p className="text-sm md:text-base">{message.content}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-xl bg-muted p-4">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-foreground"></div>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-foreground animation-delay-200"></div>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-foreground animation-delay-400"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="border-t border-border bg-background p-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about rules, setup, or gameplay..."
              className="flex-1 bg-muted text-foreground"
              disabled={isTyping}
            />
            <Button type="submit" disabled={isTyping || !input.trim()} className="px-3">
              <SendHorizontal size={18} />
            </Button>
          </div>
        </form>
      </footer>
    </div>
  );
};

// Helper for className conditionals
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default GameChat;
