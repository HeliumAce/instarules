import axios from 'axios';

class LLMService {
  private apiKey: string;
  private apiEndpoint: string;
  private cache: Map<string, string> = new Map();
  
  constructor() {
    console.log('LLMService initialized');
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    console.log('API Key loaded:', this.apiKey ? 'Yes (length: ' + this.apiKey.length + ')' : 'No');
    this.apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
  }
  
  async getCompletion(prompt: string, modelPreference?: string): Promise<string> {
    console.log('getCompletion called, prompt length:', prompt.length);
    
    // Generate a simple hash for the prompt to use as cache key
    const cacheKey = this.hashString(prompt);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log('Using cached response');
      return this.cache.get(cacheKey)!;
    }
    
    if (!this.apiKey) {
      console.warn('API key not configured. Using mock response.');
      return this.getMockResponse(prompt);
    }
    
    try {
      const model = modelPreference || 'google/gemini-2.5-pro-exp-03-25:free';
      console.log('Using model:', model);
      
      console.log('Making API request to OpenRouter');
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
      
      console.log('API response received, status:', response.status);
      
      // Cache the response before returning
      this.cache.set(cacheKey, response.data.choices[0].message.content);
      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('Error calling OpenRouter API:', error);
      console.error('Error details:', error.response?.data || 'No response data');
      throw new Error('Failed to get response from AI: ' + (error.message || 'Unknown error'));
    }
  }
  
  // Simple hash function for strings
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }
  
  // Fallback for development or when API key isn't available
  private getMockResponse(prompt: string): string {
    console.log('Using mock response');
    return `This is a mock response to: "${prompt}". In production, this would be answered by an LLM through OpenRouter.`;
  }
}

export default new LLMService(); 