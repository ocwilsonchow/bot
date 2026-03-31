import { Hono } from "hono"
import { waitUntil } from "@vercel/functions"
import bot from "../lib/bot"
import { cronSecretAuth } from "../middleware/cron-secret"

const discord = new Hono()

discord.use("*", cronSecretAuth)

discord.get("/gateway", async (c) => {
  // Keep in sync with Cron in sst.config.ts: schedule must be longer than this (one gateway per bot token).
  const durationMs = 600 * 1000 // 10 minutes
  const webhookUrl = `https://devbot.slchow.com/api/webhooks/discord`

  await bot.initialize()

  return bot
    .getAdapter("discord")
    .startGatewayListener({ waitUntil }, durationMs, undefined, webhookUrl)
})

export default discord
