import { useState, useRef, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { SendHorizontal, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGameContext } from '@/context/GameContext';
import { Message } from '@/types/game';
import { useGameRules } from '@/hooks/useGameRules';
import { useChatMessages } from '@/hooks/useChatMessages';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReloadIcon } from '@radix-ui/react-icons';
import { useAuth } from '@/context/AuthContext';

const GameChat = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { getGameById } = useGameContext();
  const { user } = useAuth();
  const game = gameId ? getGameById(gameId) : undefined;
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { askQuestion } = useGameRules(gameId || '');
  const { messages, loading, error, saveMessage } = useChatMessages(gameId || '');
  const welcomeShownRef = useRef(false);

  useEffect(() => {
    const showWelcomeMessage = async () => {
      if (!welcomeShownRef.current && !loading && messages.length === 0 && game && user) {
        welcomeShownRef.current = true;
        await saveMessage(
          `Hi! I'm your rules assistant for ${game.title}. Ask me any questions about the rules, setup, or gameplay.`,
          false
        );
      }
    };
    
    showWelcomeMessage();
  }, [loading, messages.length, game, saveMessage, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!game) {
    return <Navigate to="/" />;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      // Save user message
      await saveMessage(input, true);
      setInput('');
      setIsTyping(true);

      // Get AI response
      const response = await askQuestion(input);
      
      // Save AI response
      await saveMessage(response, false);
    } catch (error) {
      console.error('Error in chat interaction:', error);
      
      // Save error message
      await saveMessage(
        "Sorry, I couldn't process your question. Please try again.",
        false
      );
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-border bg-background p-4">
        <h1 className="text-xl font-semibold text-white">{game.title} Rules</h1>
      </header>

      {/* Main chat container with reverse scroll */}
      <div className="flex-1 overflow-y-auto">
        {/* Inner container to maintain bottom alignment and proper spacing */}
        <div className="flex min-h-full flex-col justify-end">
          <div className="mx-auto max-w-3xl space-y-6 px-4 w-full py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  Error loading messages. Please try refreshing the page.
                </AlertDescription>
              </Alert>
            )}
            
            {loading ? (
              <div className="flex justify-center py-4">
                <ReloadIcon className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={cn(
                        "w-full rounded-xl p-4",
                        message.isUser
                          ? "bg-accent/90 text-white"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {message.isUser ? (
                        <p className="text-sm md:text-base">{message.content}</p>
                      ) : (
                        <div className="text-sm md:text-base prose prose-invert max-w-none">
                          <ReactMarkdown>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="w-full rounded-xl bg-muted p-4">
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
      </div>

      <footer className="border-t border-border bg-background p-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="relative flex items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isTyping ? "Processing your question..." : "Ask about rules, setup, or gameplay..."}
              className="flex-1 bg-muted text-foreground pr-12"
              disabled={isTyping}
            />
            <Button 
              type="submit" 
              disabled={isTyping || !input.trim()} 
              className="absolute right-2 p-2 h-auto"
              variant="ghost"
            >
              {isTyping ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <SendHorizontal size={18} />
              )}
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
