/// <reference path="./.sst/platform/config.d.ts" />

/** Keys read from root `.env` during `sst dev` / deploy (SST loads it into `process.env` here only). */
const HONO_ENV_KEYS = [
  "SLACK_BOT_TOKEN",
  "SLACK_SIGNING_SECRET",
  "SLACK_CLIENT_ID",
  "SLACK_CLIENT_SECRET",
  "SLACK_ENCRYPTION_KEY",
  "DISCORD_BOT_TOKEN",
  "DISCORD_PUBLIC_KEY",
  "DISCORD_APPLICATION_ID",
  "DISCORD_MENTION_ROLE_IDS",
  "CRON_SECRET",
  "REDIS_URL",
  "AI_GATEWAY_API_KEY",
] as const

function honoEnvironment(): Record<string, string> {
  const env: Record<string, string> = {}
  for (const key of HONO_ENV_KEYS) {
    const value = process.env[key]
    if (value !== undefined) env[key] = value
  }
  return env
}

export default $config({
  app(input) {
    return {
      name: "bot",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          version: "7.20.0",
          profile: "sinlongchow",
          region: "ap-east-1",
        },
      },
    }
  },
  async run() {
    // Secrets
    const DISCORD_BOT_TOKEN = new sst.Secret("DISCORD_BOT_TOKEN")
    const DISCORD_PUBLIC_KEY = new sst.Secret("DISCORD_PUBLIC_KEY")
    const DISCORD_APPLICATION_ID = new sst.Secret("DISCORD_APPLICATION_ID")
    const CRON_SECRET = new sst.Secret("CRON_SECRET")
    const REDIS_URL = new sst.Secret("REDIS_URL")
    const AI_GATEWAY_API_KEY = new sst.Secret("AI_GATEWAY_API_KEY")

    // Lambda function (/discord/gateway keeps a Discord WS open for durationMs in src/routes/discord.ts)
    const hono = new sst.aws.Function("Hono", {
      handler: "src/lambda.handler",
      timeout: "15 minutes",
      link: [
        CRON_SECRET,
        DISCORD_BOT_TOKEN,
        DISCORD_PUBLIC_KEY,
        DISCORD_APPLICATION_ID,
        REDIS_URL,
        AI_GATEWAY_API_KEY,
      ],
    })

    // API Gateway
    const api = new sst.aws.ApiGatewayV2("Api", {
      domain: {
        name: `devbot.slchow.com`,
      },
    })

    api.route("$default", hono.arn)

    // Cron Function
    const cron = new sst.aws.Function("Cron", {
      handler: "src/cron.handler",
      link: [CRON_SECRET]
    })

    // Refresh gateway after listener ends (must be > discord route durationMs to avoid two sessions / one token).
    // Verify in CloudWatch: one listener start per cron tick, not a second login while the prior 10m window should still run.
    new sst.aws.CronV2("CronJob", {
      function: cron.arn,
      // EventBridge `rate()` only supports minutes/hours/days (not seconds). Minimum is 1 minute.
      schedule: "rate(11 minutes)",
    })
  },
})
