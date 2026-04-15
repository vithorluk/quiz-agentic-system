/**
 * Convert a topic string to a URL-safe slug
 * Removes emoji, special characters, converts to lowercase, replaces spaces with hyphens
 */
export function slugify(text: string): string {
  return text
    .replace(/[\p{Emoji}]/gu, '') // Remove emoji
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .slice(0, 50); // Limit length
}

/**
 * Example:
 * slugify("🎙️ Pipecat: Real-Time Voice & Multimodal AI Agents")
 * => "pipecat-realtime-voice-multimodal-ai-agents"
 */
