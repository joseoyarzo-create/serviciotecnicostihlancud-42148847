declare const process: { env: Record<string, string | undefined> };
import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "search_cliente",
  title: "Buscar cliente",
  description: "Busca clientes por nombre o teléfono (coincidencia parcial, mayúsculas/minúsculas ignoradas).",
  inputSchema: {
    query: z.string().trim().min(1).describe("Nombre o teléfono a buscar"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };

    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("clientes")
      .select("id, nombre, telefono, puntos")
      .or(`nombre.ilike.%${query}%,telefono.ilike.%${query}%`)
      .order("nombre")
      .limit(50);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { clientes: data ?? [] },
    };
  },
});
