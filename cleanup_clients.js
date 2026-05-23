
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bpqqjqeygpqjpykiagtj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwcXFqcWV5Z3BxanB5a2lhZ3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTA5MTYsImV4cCI6MjA4MzI4NjkxNn0.tLTvKyE-C81cTEMj96PVchYl_sZHHycTFWeEn5LHflc";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function deduplicateClients() {
  console.log("Iniciando limpieza de clientes duplicados...");
  
  const { data: clients, error } = await supabase
    .from('clientes')
    .select('*');

  if (error) {
    console.error("Error al obtener clientes:", error.message);
    return;
  }

  const clientMap = new Map();
  const duplicatesToDelete = [];

  for (const client of clients) {
    const normalizedName = client.nombre.trim().toUpperCase();
    if (clientMap.has(normalizedName)) {
      // Es un duplicado
      duplicatesToDelete.push(client.id);
      console.log(`Duplicado encontrado: ${client.nombre} (ID: ${client.id})`);
    } else {
      clientMap.set(normalizedName, client.id);
      // Aprovechamos para normalizar el nombre del original si es necesario
      if (client.nombre !== normalizedName) {
        await supabase
          .from('clientes')
          .update({ nombre: normalizedName })
          .eq('id', client.id);
      }
    }
  }

  if (duplicatesToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('clientes')
      .delete()
      .in('id', duplicatesToDelete);

    if (deleteError) {
      console.error("Error al eliminar duplicados:", deleteError.message);
    } else {
      console.log(`Se eliminaron ${duplicatesToDelete.length} clientes duplicados con éxito.`);
    }
  } else {
    console.log("No se encontraron clientes duplicados para eliminar.");
  }
}

deduplicateClients();
