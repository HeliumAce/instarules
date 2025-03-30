-- Create the chat_messages table
create table chat_messages (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    game_id text not null,
    content text not null,
    is_user boolean not null default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index chat_messages_user_id_idx on chat_messages(user_id);
create index chat_messages_game_id_idx on chat_messages(game_id);
create index chat_messages_created_at_idx on chat_messages(created_at desc);

-- Enable Row Level Security
alter table chat_messages enable row level security;

-- Create policies
-- Allow users to read their own messages for their games
create policy "Users can read their own messages"
    on chat_messages for select
    using (auth.uid() = user_id);

-- Allow users to insert their own messages
create policy "Users can insert their own messages"
    on chat_messages for insert
    with check (auth.uid() = user_id);

-- Prevent updates to messages
create policy "No updates allowed"
    on chat_messages for update
    using (false);

-- Allow users to delete their own messages (optional, comment out if not needed)
create policy "Users can delete their own messages"
    on chat_messages for delete
    using (auth.uid() = user_id);
