import { Hono } from "hono"
import { waitUntil } from "@vercel/functions"
import bot from "./lib/bot"
import { Resource } from "sst"

const app = new Hono()

app.get("/", (c) => {
  return c.text("Hello Hono!")
})

app.get("/discord/gateway", async (c) => {
  const cronSecret = Resource.CRON_SECRET.value
  if (!cronSecret) {
    return c.text("CRON_SECRET is not set", 500)
  }

  const authHeader = c.req.header("Authorization")
  if (authHeader !== `Bearer ${cronSecret}`) {
    return c.text("Unauthorized", 401)
  }

  const durationMs = 600 * 1000 // 10 minutes
  const webhookUrl = `https://devbot.slchow.com/api/webhooks/discord`

  await bot.initialize()

  return bot
    .getAdapter("discord")
    .startGatewayListener({ waitUntil }, durationMs, undefined, webhookUrl)
})

app.post("/api/webhooks/discord", async (c) => {
  const handler = bot.webhooks.discord
  if (!handler) {
    return c.text("Discord adapter not configured", 404)
  }

  return handler(c.req.raw, { waitUntil })
})

export default app
