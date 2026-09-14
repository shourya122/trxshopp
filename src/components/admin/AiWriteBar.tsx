import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { adminGenerateDescription } from "@/lib/ai-description.functions";
import { sanitizeHtml } from "@/components/admin/RichTextEditor";

type Target = "description" | "product_details" | "terms_conditions";

/**
 * Small prompt bar that generates rich-text copy with AI and hands back
 * sanitized HTML. Replaces or appends to the field it sits above.
 */
export function AiWriteBar({
  target,
  title,
  category,
  hasContent,
  onResult,
  placeholder,
}: {
  target: Target;
  title?: string | null;
  category?: string | null;
  hasContent: boolean;
  onResult: (html: string, mode: "replace" | "append") => void;
  placeholder?: string;
}) {
  const generate = useServerFn(adminGenerateDescription);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (mode: "replace" | "append") => {
    const p = prompt.trim();
    if (p.length < 3) {
      toast.error("Write a short prompt first (a few words is enough).");
      return;
    }
    setBusy(true);
    const id = toast.loading("Writing with AI…");
    try {
      const res = await generate({
        data: { target, prompt: p, title: title ?? undefined, category: category ?? undefined },
      });
      onResult(sanitizeHtml(res.html), mode);
      toast.success("Copy generated", { id });
    } catch (e) {
      toast.error((e as Error).message || "Could not generate copy", { id });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#111113] p-2.5">
      <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-[#71717A]">
        <Wand2 className="h-3 w-3 text-[#2563EB]" /> Generate with AI
      </div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!busy) void run("replace"); }
          }}
          placeholder={placeholder ?? "e.g. 1-month Prime Video, instant delivery, works on any device"}
          className="h-8 flex-1 rounded-md border border-white/[0.06] bg-[#0B0B0E] px-2.5 text-[12.5px] text-white outline-none placeholder:text-[#52525B] focus:border-white/15"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void run("replace")}
            disabled={busy}
            className="flex h-8 items-center gap-1.5 rounded-md bg-[#2563EB] px-3 text-[12px] font-medium text-white transition hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
            {hasContent ? "Replace" : "Generate"}
          </button>
          {hasContent && (
            <button
              type="button"
              onClick={() => void run("append")}
              disabled={busy}
              className="h-8 rounded-md border border-white/[0.06] px-3 text-[12px] text-[#D4D4D8] transition hover:bg-white/[0.04] disabled:opacity-60"
            >
              Append
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
