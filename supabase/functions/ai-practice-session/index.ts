import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleRequest } from "./handler.js";

Deno.serve(handleRequest);
