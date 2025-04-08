import axios from 'axios';

const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';

// Simple hash function for strings (can be removed if not needed elsewhere)
const hashString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

// Fallback mock response generator
const getMockResponse = (prompt: string): string => {
  return `This is a mock response to: \"${prompt}\". In production, this would be answered by an LLM through OpenRouter.`;
};

interface GetCompletionParams {
  prompt: string;
  modelPreference?: string;
}

/**
 * Fetches a completion from the OpenRouter API.
 */
export const getLLMCompletion = async ({ prompt, modelPreference }: GetCompletionParams): Promise<string> => {
  // Note: TanStack Query will handle caching, so the internal cache is removed.
  // const cacheKey = hashString(prompt); // Can remove hashing if cache not needed here

  if (!apiKey) {
    // Return mock response if API key is missing
    return getMockResponse(prompt);
  }

  try {
    const model = modelPreference || 'anthropic/claude-3-sonnet:beta';

    const response = await axios.post(
      apiEndpoint,
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
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://instarules.com', // Replace with your actual domain
          'X-Title': 'InstaRules'
        }
      }
    );

    // Directly return the content
    return response.data.choices[0].message.content;
  } catch (error: any) {
    // Re-throw a more specific error or handle as needed
    throw new Error('Failed to get response from AI: ' + (error.message || 'Unknown error'));
  }
}; 