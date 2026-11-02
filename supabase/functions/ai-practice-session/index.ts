import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.110.8";
import { createHandler } from "./handler.js";

Deno.serve(
  createHandler({ createClient, getEnv: (name: string) => Deno.env.get(name) }),
);
