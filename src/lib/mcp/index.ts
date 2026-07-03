import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listFichasTool from "./tools/list-fichas";
import searchClienteTool from "./tools/search-cliente";
import searchRepuestoTool from "./tools/search-repuesto";
import updateFichaEstadoTool from "./tools/update-ficha-estado";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "stihl-ancud-mcp",
  title: "STIHL Ancud - Taller",
  version: "0.1.0",
  instructions:
    "Herramientas del sistema de taller STIHL Ancud. Permite consultar fichas técnicas, buscar clientes y repuestos, y actualizar el estado de una ficha (TALLER, ESPERA_REPUESTO, LISTO, ENTREGADA). Todas las operaciones se ejecutan como el usuario autenticado.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listFichasTool, searchClienteTool, searchRepuestoTool, updateFichaEstadoTool],
});
