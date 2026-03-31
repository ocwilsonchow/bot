#!/usr/bin/env bun
/**
 * GET /discord/gateway with CRON_SECRET to start the Discord gateway listener
 * (same behavior as the Cron Lambda and src/routes/discord.ts).
 *
 * Requires SST-linked secrets: run via `bun run start:gateway` (uses `sst shell`).
 */

import { Resource } from "sst"

const DEFAULT_GATEWAY_URL = "https://devbot.slchow.com/discord/gateway"

function cronSecret(): string {
  try {
    const v = Resource.CRON_SECRET.value
    if (!v) {
      console.error("[start:gateway] CRON_SECRET is empty for this stage")
      process.exit(1)
    }
    return v
  } catch {
    console.error(
      "[start:gateway] CRON_SECRET unavailable — run with SST dev/shell active (e.g. `bun run start:gateway`)",
    )
    process.exit(1)
  }
}

async function main(): Promise<void> {
  const url = process.env.DISCORD_GATEWAY_URL ?? DEFAULT_GATEWAY_URL
  const secret = cronSecret()

  const maxAttempts = 60
  const delayMs = 5000

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${secret}` },
      })

      if (res.status === 401 || res.status === 403) {
        console.error("[start:gateway] unauthorized — check CRON_SECRET")
        process.exit(1)
      }

      if (res.ok) {
        console.log("[start:gateway] listener request accepted (holding connection)")
        void res.text().catch(() => {})
        return
      }

      const errBody = await res.text()
      console.log(
        `[start:gateway] attempt ${attempt}/${maxAttempts} — ${res.status} ${errBody.slice(0, 120)}`,
      )
    } catch (e) {
      console.log(
        `[start:gateway] attempt ${attempt}/${maxAttempts} —`,
        e instanceof Error ? e.message : e,
      )
    }

    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }

  console.error("[start:gateway] API did not become ready in time")
  process.exit(1)
}

void main()
