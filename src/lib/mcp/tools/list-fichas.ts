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
  name: "list_fichas",
  title: "Listar fichas técnicas",
  description:
    "Lista las fichas técnicas del taller. Permite filtrar por estado (TALLER, ESPERA_REPUESTO, LISTO, ENTREGADA) y limitar la cantidad.",
  inputSchema: {
    estado: z
      .enum(["TALLER", "ESPERA_REPUESTO", "LISTO", "ENTREGADA"])
      .optional()
      .describe("Filtrar por estado de la ficha"),
    limit: z.number().int().min(1).max(200).optional().describe("Máximo de resultados (por defecto 50)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ estado, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };

    const sb = supabaseForUser(ctx);
    let q = sb
      .from("fichas")
      .select("id, numero_boleta, cliente_nombre, modelo_maquina, mecanico, cliente_direccion, fecha_ingreso, fecha_entrega")
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (estado) q = q.eq("cliente_direccion", estado);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { fichas: data ?? [] },
    };
  },
});
