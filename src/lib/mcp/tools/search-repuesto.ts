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
  name: "search_repuesto",
  title: "Buscar repuesto",
  description: "Busca repuestos por nombre o código (coincidencia parcial). Devuelve código, nombre y precio.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Nombre o código del repuesto"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };

    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("repuestos")
      .select("id, codigo, nombre, precio")
      .or(`nombre.ilike.%${query}%,codigo.ilike.%${query}%`)
      .order("nombre")
      .limit(50);

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { repuestos: data ?? [] },
    };
  },
});
