import ZAI from 'z-ai-web-dev-sdk';

const system = `You are the Visual Director. Return STRICT JSON only, no fences:
{"mode":"diagram","subject":"...","title":"...","subtitle":"...","whisper":"...","explanation":"...","discernment":"...","aspect":"wide","artworkPrompt":"...","panels":[{"heading":"...","body":"..."}],"diagram":{"nodes":[{"id":"n1","label":"...","x":50,"y":30}],"edges":[["n1","n2"]]},"annotations":[{"x":20,"y":40,"label":"..."}],"slides":[]}
Rules: 4 panels, 5 diagram nodes, 4 annotations, artworkPrompt 40-90 words, all visitor strings in English.`;

const zai = await ZAI.create();
const completion = await zai.chat.completions.create({
  messages: [
    { role: 'system', content: system },
    { role: 'user', content: 'THE VISITOR ASKS TO SEE:\nShow me a scientific diagram of a black hole.' },
  ],
  thinking: { type: 'disabled' },
  max_tokens: 4096,
});
const msg = completion.choices[0]?.message;
const raw = (msg?.content ?? '').trim();
console.log('finish_reason:', completion.choices[0]?.finish_reason);
console.log('usage:', JSON.stringify(completion.usage ?? null));
console.log('raw length:', raw.length);
console.log('raw:', raw);
try { const p = JSON.parse(raw); console.log('PARSE OK, keys:', Object.keys(p).join(',')); } catch (e) { console.log('PARSE FAIL:', e.message.slice(0,200)); }
