import { Resource } from "sst"
import { Chat, emoji } from "chat"
import { createDiscordAdapter } from "@chat-adapter/discord"
import { createRedisState } from "@chat-adapter/state-redis"

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
// Respond to follow-up messages in subscribed threads
bot.onSubscribedMessage(async (thread, message) => {
  await thread.startTyping()
  await thread.post(`You said: ${message.text}`)
})

export default bot
