import aiohttp
import asyncio
loop = asyncio.get_event_loop()
session = aiohttp.ClientSession(loop=loop)
print("Fetching...")
async def main():
    async with session.get("https://discordsbestbots.xyz/api/profiles/302604426781261824") as resp:
        json = await resp.json()
        print(json)
    await session.close()
loop.run_until_complete(main())
loop.close()