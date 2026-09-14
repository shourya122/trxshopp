// AI product description generator for the admin product editor.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  prompt: z.string().min(3).max(1200),
  title: z.string().max(200).optional(),
  category: z.string().max(120).optional(),
  target: z.enum(["description", "product_details", "terms_conditions"]).default("description"),
});

const GUIDES: Record<string, string> = {
  description:
    "Write a compelling storefront product description: one short hook paragraph, then a <ul> of 4-6 concrete benefit bullets. Keep it under 160 words.",
  product_details:
    "Write a 'Product Details' section: a <ul> or <ol> of 5-8 short factual points (what's included, delivery method, platform, validity, requirements). No marketing fluff.",
  terms_conditions:
    "Write a short 'Terms & Conditions' section as a <ul> of 4-6 clear points about digital delivery, refunds, account sharing and support. Keep it plain and fair.",
};

export const adminGenerateDescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }): Promise<{ html: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: role } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("Forbidden");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured yet. Add the AI key in Cloud settings.");

    const system = [
      "You are a copywriter for TRXSHOP, a store selling digital game keys, software and streaming subscriptions in India.",
      GUIDES[data.target],
      "Return ONLY clean HTML using <p>, <strong>, <em>, <ul>, <ol>, <li>, <h3>. No markdown, no code fences, no <html>/<body> wrapper, no inline styles.",
    ].join(" ");

    const user = [
      data.title ? `Product title: ${data.title}` : null,
      data.category ? `Category: ${data.category}` : null,
      `Brief from the store owner: ${data.prompt}`,
    ].filter(Boolean).join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      let message = body;
      try { message = JSON.parse(body)?.error?.message ?? body; } catch { /* keep raw */ }
      if (res.status === 429) throw new Error("Too many requests right now — try again in a moment.");
      if (res.status === 402 || res.status === 403) throw new Error(message || "AI usage is blocked for this workspace.");
      throw new Error(message || `AI request failed (${res.status})`);
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    let html = (json.choices?.[0]?.message?.content ?? "").trim();
    html = html.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/, "").trim();
    if (!html) throw new Error("The AI returned an empty description. Try a more detailed prompt.");
    return { html };
  });
