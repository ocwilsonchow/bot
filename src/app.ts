import { Hono } from "hono"
import discord from "./routes/discord"
import root from "./routes/root"
import webhooks from "./routes/webhooks"

const app = new Hono()

app.route("/", root)
app.route("/discord", discord)
app.route("/api/webhooks", webhooks)

export default app
