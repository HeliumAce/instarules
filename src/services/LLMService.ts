import axios from 'axios';

class LLMService {
  private apiKey: string;
  private apiEndpoint: string;
  private cache: Map<string, string> = new Map();
  
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    this.apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
  }
  
  async getCompletion(prompt: string, modelPreference?: string): Promise<string> {
    const cacheKey = this.hashString(prompt);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    if (!this.apiKey) {
      return this.getMockResponse(prompt);
    }
    
    try {
      const model = modelPreference || 'anthropic/claude-3-sonnet:beta';
      
      const response = await axios.post(
        this.apiEndpoint,
        {
          model: model,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://instarules.com', // Replace with your actual domain
            'X-Title': 'InstaRules'
          }
        }
      );
      
      this.cache.set(cacheKey, response.data.choices[0].message.content);
      return response.data.choices[0].message.content;
    } catch (error: any) {
      throw new Error('Failed to get response from AI: ' + (error.message || 'Unknown error'));
    }
  }
  
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }
  
  private getMockResponse(prompt: string): string {
    return `This is a mock response to: "${prompt}". In production, this would be answered by an LLM through OpenRouter.`;
  }
}

export default new LLMService(); 