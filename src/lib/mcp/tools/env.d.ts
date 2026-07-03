// Tools bundle into a Deno Edge Function at build time; `process.env` is provided there.
declare const process: { env: Record<string, string | undefined> };
