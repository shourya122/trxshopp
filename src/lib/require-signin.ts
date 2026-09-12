import { supabase } from "@/integrations/supabase/client";

/**
 * Returns true when a signed-in user exists.
 * Returns false otherwise (caller should stop and send the user to sign in).
 */
export async function isSignedIn(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getUser();
    return !error && !!data.user;
  } catch {
    return false;
  }
}
