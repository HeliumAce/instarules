
export interface Game {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  isFavorite?: boolean;
}

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}
