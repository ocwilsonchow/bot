import { Resource } from "sst"
import { Chat } from "chat"
import { createDiscordAdapter } from "@chat-adapter/discord"
import { createRedisState } from "@chat-adapter/state-redis"
import { createGateway, ToolLoopAgent } from "ai"
import {
  DISCORD_MAX_MESSAGE_CONTENT_LENGTH,
  findDiscordChunkEnd,
} from "./discord-chunk-text"

const bot = new Chat({
  userName: "luthen",
  adapters: {
    // slack: createSlackAdapter(),
    discord: createDiscordAdapter({
      botToken: Resource.DISCORD_BOT_TOKEN.value,
      publicKey: Resource.DISCORD_PUBLIC_KEY.value,
      applicationId: Resource.DISCORD_APPLICATION_ID.value,
    }),
  },
  state: createRedisState({
    url: Resource.REDIS_URL.value,
  }),
})

// Respond when someone @mentions the bot
bot.onNewMention(async (thread) => {
  await thread.subscribe()
  await thread.startTyping()
  await thread.post("Hello! I'm listening to this thread now.")
})

const gateway = createGateway({
  apiKey: Resource.AI_GATEWAY_API_KEY.value,
})

const agent = new ToolLoopAgent({
  model: gateway("alibaba/qwen3.5-flash"),
  instructions: "You are a helpful assistant.",
})

// Respond to follow-up messages in subscribed threads
bot.onSubscribedMessage(async (thread, message) => {
  await thread.startTyping()

  const result = await agent.stream({ prompt: message.text })

  let buffer = ""
  for await (const delta of result.textStream) {
    buffer += delta
    while (buffer.length > DISCORD_MAX_MESSAGE_CONTENT_LENGTH) {
      const end = findDiscordChunkEnd(buffer)
      const chunk = buffer.slice(0, end)
      buffer = buffer.slice(end)
      if (chunk.length > 0) await thread.post(chunk)
    }
  }
  if (buffer.length > 0) await thread.post(buffer)
})

export default bot
