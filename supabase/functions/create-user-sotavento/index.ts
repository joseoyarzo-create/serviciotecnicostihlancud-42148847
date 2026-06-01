import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const email = "sotavento@taller.local";
    const password = "pudeto351";

    const { data: list } = await supabase.auth.admin.listUsers();
    const exists = list?.users?.find((u) => u.email === email);
    if (exists) {
      return new Response(JSON.stringify({ ok: true, msg: "already exists" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, user: data.user?.id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
