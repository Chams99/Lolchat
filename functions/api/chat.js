/**
 * Cloudflare Pages Function for handling chat API requests
 * This proxies requests to OpenRouter API with the API key stored in environment variables
 */
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    
    // Get API key from environment variables
    const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY;
    
    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: OPENROUTER_API_KEY is not set' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { messages, model = 'openai/gpt-3.5-turbo', temperature = 0.7, max_tokens = 1000 } = body;
    
    // Basic validation
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get origin for the referer header
    const origin = request.headers.get('origin') || 'https://your-app.pages.dev';
    
    // Make request to OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': origin,
        'X-Title': 'League of Legends Chatbot',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API error:', errorData);
      return new Response(
        JSON.stringify({ 
          error: 'API request failed', 
          details: errorData 
        }),
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const data = await response.json();
    
    // Return successful response with CORS headers
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
  } catch (error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

