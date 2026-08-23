/**
 * GeminiClient.js
 * Wrapper for the Google Gemini API.
 * API key is stored in localStorage — never hardcoded.
 */

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-2.0-flash';

export class GeminiClient {
  constructor() {
    this._apiKey = null;
  }

  get apiKey() {
    if (!this._apiKey) {
      this._apiKey = localStorage.getItem('packstudio_gemini_key') || '';
    }
    return this._apiKey;
  }

  setApiKey(key) {
    this._apiKey = key;
    localStorage.setItem('packstudio_gemini_key', key);
  }

  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Generate content (non-streaming).
   * @param {string|object[]} prompt - A string or array of parts
   * @param {object} options
   * @returns {string} Generated text
   */
  async generate(prompt, options = {}) {
    this._requireKey();

    const model = options.model || DEFAULT_MODEL;
    const parts = typeof prompt === 'string'
      ? [{ text: prompt }]
      : prompt;

    const body = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature:     options.temperature     ?? 0.7,
        topP:            options.topP            ?? 0.9,
        maxOutputTokens: options.maxOutputTokens ?? 8192,
        ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',        threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',  threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',  threshold: 'BLOCK_NONE' },
      ],
    };

    const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${this.apiKey}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new GeminiError(
        err?.error?.message || `API error ${resp.status}`,
        resp.status,
        err
      );
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return text;
  }

  /**
   * Generate with JSON output (parsed automatically).
   */
  async generateJson(prompt, options = {}) {
    const text = await this.generate(prompt, { ...options, jsonMode: true });
    try {
      return JSON.parse(text);
    } catch {
      // Sometimes Gemini wraps JSON in markdown code fences
      const match = text.match(/```(?:json)?\s*([\s\S]+?)```/);
      if (match) return JSON.parse(match[1]);
      throw new Error('AI did not return valid JSON. Raw: ' + text.slice(0, 300));
    }
  }

  /**
   * Streaming generate — calls onChunk for each text delta.
   */
  async generateStream(prompt, onChunk, options = {}) {
    this._requireKey();

    const model = options.model || DEFAULT_MODEL;
    const parts = typeof prompt === 'string' ? [{ text: prompt }] : prompt;

    const body = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature:     options.temperature     ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? 8192,
      },
    };

    const url = `${GEMINI_BASE_URL}/models/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new GeminiError(err?.error?.message || `API error ${resp.status}`, resp.status);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;
        try {
          const parsed = JSON.parse(jsonStr);
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) {
            fullText += text;
            onChunk(text, fullText);
          }
        } catch { /* ignore parse errors in stream */ }
      }
    }

    return fullText;
  }

  /**
   * Generate with image parts (for analyzing reference images).
   */
  async generateWithImages(textPrompt, imageDataUris, options = {}) {
    const parts = [
      ...imageDataUris.map(uri => {
        const [header, data] = uri.split(',');
        const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
        return { inlineData: { data, mimeType } };
      }),
      { text: textPrompt },
    ];
    return this.generate(parts, options);
  }

  _requireKey() {
    if (!this.apiKey) {
      throw new GeminiError(
        'Gemini API key not configured. Please add your API key in Settings.',
        401
      );
    }
  }
}

export class GeminiError extends Error {
  constructor(message, status, raw) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
    this.raw = raw;
  }
}

// Singleton
export const gemini = new GeminiClient();
