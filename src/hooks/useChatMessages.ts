import { useEffect, useState } from 'react';
import { useSupabase } from '@/context/SupabaseContext';
import { useAuth } from '@/context/AuthContext';
import { Message } from '@/types/game';

export function useChatMessages(gameId: string) {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
          data.map((msg) => ({
            id: msg.id,
            content: msg.content,
            isUser: msg.is_user,
            timestamp: new Date(msg.created_at),
          }))
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
          setMessages((prev) => [
            ...prev,
            {
              id: newMessage.id,
              content: newMessage.content,
              isUser: newMessage.is_user,
              timestamp: new Date(newMessage.created_at),
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
  const saveMessage = async (content: string, isUser: boolean): Promise<Message> => {
    if (!user) {
      throw new Error('You must be signed in to send messages');
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([
          {
            game_id: gameId,
            user_id: user.id,
            content,
            is_user: isUser,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const newMessage: Message = {
        id: data.id,
        content: data.content,
        isUser: data.is_user,
        timestamp: new Date(data.created_at),
      };

      // Optimistically update the messages state
      setMessages(prev => [...prev, newMessage]);

      return newMessage;
    } catch (err) {
      console.error('Error saving message:', err);
      throw err instanceof Error ? err : new Error('Failed to save message');
    }
  };

  return {
    messages,
    loading,
    error,
    saveMessage,
  };
} 