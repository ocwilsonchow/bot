import { Resource } from "sst"

export const handler = async () => {
  await fetch("https://devbot.slchow.com/discord/gateway", {
    headers: {
      Authorization: `Bearer ${Resource.CRON_SECRET.value}`,
    },
  })
}
