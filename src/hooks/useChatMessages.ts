import { useEffect, useState } from 'react';
import { useSupabase } from '@/context/SupabaseContext';
import { useAuth } from '@/context/AuthContext';
import { Message, MessageSources } from '@/types/game';

export function useChatMessages(gameId: string) {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Parse confidence from messages
  const parseConfidence = (content: string): 'High' | 'Medium' | 'Low' | undefined => {
    // Look for "Confidence: [Level]" at the end of the message
    const matches = content.match(/Confidence:\s*(High|Medium|Low)\s*$/i);
    if (matches && matches[1]) {
      return matches[1] as 'High' | 'Medium' | 'Low';
    }
    return undefined;
  };

  // Remove confidence indicator from display content
  const removeConfidenceText = (content: string): string => {
    return content.replace(/Confidence:\s*(High|Medium|Low)\s*$/i, '').trim();
  };

  // Load messages on mount
  useEffect(() => {
    let mounted = true;
    
    const loadMessages = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('game_id', gameId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (!mounted) return;

        setMessages(
          data.map((msg) => {
            const content = msg.content;
            const confidence = !msg.is_user ? parseConfidence(content) : undefined;
            const displayContent = !msg.is_user ? removeConfidenceText(content) : content;
            
            return {
              id: msg.id,
              content: displayContent,
              isUser: msg.is_user,
              timestamp: new Date(msg.created_at),
              confidence,
            };
          })
        );
      } catch (err) {
        console.error('Error loading messages:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load messages'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up real-time subscription
    const channel = supabase
      .channel(`chat_messages_${gameId}_${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `game_id=eq.${gameId} AND user_id=eq.${user?.id}`,
        },
        (payload) => {
          if (!mounted) return;
          const newMessage = payload.new as any;
          const content = newMessage.content;
          const confidence = !newMessage.is_user ? parseConfidence(content) : undefined;
          const displayContent = !newMessage.is_user ? removeConfidenceText(content) : content;
          
          setMessages((prev) => [
            ...prev,
            {
              id: newMessage.id,
              content: displayContent,
              isUser: newMessage.is_user,
              timestamp: new Date(newMessage.created_at),
              confidence,
            },
          ]);
        }
      )
      .subscribe();

    loadMessages();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [gameId, supabase, user]);

  // Save a new message
  const saveMessage = async (
    content: string, 
    isUser: boolean,
    sources?: MessageSources
  ): Promise<Message> => {
    if (!user) {
      throw new Error('You must be signed in to send messages');
    }

    try {
      // For AI responses, preserve the original content in the database
      const dbContent = content;
      
      // For display, we want to parse and remove the confidence text
      const confidence = !isUser ? parseConfidence(content) : undefined;
      const displayContent = !isUser ? removeConfidenceText(content) : content;
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([
          {
            game_id: gameId,
            user_id: user.id,
            content: dbContent, // Store original in database
            is_user: isUser,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const newMessage: Message = {
        id: data.id,
        content: displayContent,
        isUser: data.is_user,
        timestamp: new Date(data.created_at),
        confidence,
        sources
      };

      // Optimistically update the messages state
      setMessages(prev => [...prev, newMessage]);

      return newMessage;
    } catch (err) {
      console.error('Error saving message:', err);
      throw err instanceof Error ? err : new Error('Failed to save message');
    }
  };

  // Clear all messages
  const clearMessages = async () => {
    if (!user) {
      throw new Error('You must be signed in to clear messages');
    }

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('game_id', gameId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Clear local state
      setMessages([]);
    } catch (err) {
      console.error('Error clearing messages:', err);
      throw err instanceof Error ? err : new Error('Failed to clear messages');
    }
  };

  return {
    messages,
    loading,
    error,
    saveMessage,
    clearMessages,
  };
} 