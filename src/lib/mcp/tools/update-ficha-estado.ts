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
  name: "update_ficha_estado",
  title: "Actualizar estado de ficha",
  description:
    "Cambia el estado de una ficha técnica. Si el nuevo estado es ENTREGADA, registra la fecha de entrega automáticamente.",
  inputSchema: {
    id: z.string().uuid().describe("ID de la ficha"),
    estado: z.enum(["TALLER", "ESPERA_REPUESTO", "LISTO", "ENTREGADA"]),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  handler: async ({ id, estado }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "No autenticado" }], isError: true };

    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("fichas")
      .update({
        cliente_direccion: estado,
        fecha_entrega: estado === "ENTREGADA" ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .select("id, numero_boleta, cliente_direccion, fecha_entrega");

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Ficha actualizada: ${JSON.stringify(data?.[0])}` }],
      structuredContent: { ficha: data?.[0] },
    };
  },
});
