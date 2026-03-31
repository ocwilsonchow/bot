import { Hono } from "hono"
import { waitUntil } from "@vercel/functions"
import bot from "../lib/bot"

const webhooks = new Hono()

webhooks.post("/discord", async (c) => {
  const handler = bot.webhooks.discord
  if (!handler) {
    return c.text("Discord adapter not configured", 404)
  }

  return handler(c.req.raw, { waitUntil })
})

export default webhooks
