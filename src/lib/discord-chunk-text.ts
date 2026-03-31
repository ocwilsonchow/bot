/**
 * Discord message `content` max length matches @chat-adapter/discord (DISCORD_MAX_CONTENT_LENGTH).
 */
export const DISCORD_MAX_MESSAGE_CONTENT_LENGTH = 2000

/**
 * Returns `end` such that `text.slice(0, end)` is one Discord-sized chunk (≤ `maxLen`),
 * preferring `\n\n`, then `\n`, then space; otherwise hard-splits at `maxLen`.
 */
export function findDiscordChunkEnd(
  text: string,
  maxLen = DISCORD_MAX_MESSAGE_CONTENT_LENGTH,
): number {
  if (text.length <= maxLen) return text.length
  const win = text.slice(0, maxLen)
  const para = win.lastIndexOf("\n\n")
  if (para !== -1 && para + 2 <= maxLen) return para + 2
  const line = win.lastIndexOf("\n")
  if (line !== -1 && line + 1 <= maxLen && line > 0) return line + 1
  const sp = win.lastIndexOf(" ")
  if (sp !== -1 && sp + 1 <= maxLen && sp > 0) return sp + 1
  return maxLen
}

/** Split full text into segments safe for sequential `thread.post` calls. */
export function splitTextIntoDiscordMessages(
  text: string,
  maxLen = DISCORD_MAX_MESSAGE_CONTENT_LENGTH,
): string[] {
  const out: string[] = []
  let rest = text
  while (rest.length > 0) {
    const end = findDiscordChunkEnd(rest, maxLen)
    const chunk = rest.slice(0, end)
    rest = rest.slice(end)
    if (chunk.length > 0) out.push(chunk)
  }
  return out
}
