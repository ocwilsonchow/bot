import type { MiddlewareHandler } from "hono"
import { Resource } from "sst"

export const cronSecretAuth: MiddlewareHandler = async (c, next) => {
  const cronSecret = Resource.CRON_SECRET.value
  if (!cronSecret) {
    return c.text("CRON_SECRET is not set", 500)
  }

  const authHeader = c.req.header("Authorization")
  if (authHeader !== `Bearer ${cronSecret}`) {
    return c.text("Unauthorized", 401)
  }

  await next()
}
