export type Game = {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  isFavorite: boolean;
};

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  confidence?: 'High' | 'Medium' | 'Low'; // Optional confidence level for AI responses
  sources?: MessageSources; // Add sources to Message interface
}

export interface BaseSource {
  id: string;
  contentType: 'rule' | 'card' | 'faq' | 'errata';
  title: string;
}

export interface RuleSource extends BaseSource {
  contentType: 'rule';
  bookName: string;
  headings: string[];
  sourceHeading: string;
  pageNumber?: number;
}

export interface CardSource extends BaseSource {
  contentType: 'card';
  cardId: string;
  cardName: string;
}

export type Source = RuleSource | CardSource;

export interface MessageSources {
  count: number;
  sources: Source[];
}
