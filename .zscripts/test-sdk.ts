import ZAI from "z-ai-web-dev-sdk";

async function main() {
  try {
    const zai = await ZAI.create();
    const r = await zai.chat.completions.create({
      messages: [{ role: "user", content: "say hi in 3 words" }],
    });
    console.log("OK:", JSON.stringify(r.choices?.[0]?.message?.content ?? r).slice(0, 200));
  } catch (e: unknown) {
    console.log("ERR:", String(e instanceof Error ? e.message : e).slice(0, 300));
  }
  process.exit(0);
}

void main();
