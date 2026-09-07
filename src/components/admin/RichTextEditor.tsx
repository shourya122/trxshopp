import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link as LinkIcon,
  Baseline,
} from "lucide-react";

/**
 * Small black rich-text editor (contentEditable) used by the admin product editor.
 * Emits sanitized HTML through `onChange`.
 */

const BLOCKS = [
  { label: "Paragraph", tag: "p" },
  { label: "Heading 1", tag: "h1" },
  { label: "Heading 2", tag: "h2" },
  { label: "Heading 3", tag: "h3" },
] as const;

const COLORS = ["#FFFFFF", "#A1A1AA", "#2563EB", "#22C55E", "#F59E0B", "#EF4444"];

const ALIGN = [
  { cmd: "justifyLeft", label: "Left", Icon: AlignLeft },
  { cmd: "justifyCenter", label: "Center", Icon: AlignCenter },
  { cmd: "justifyRight", label: "Right", Icon: AlignRight },
] as const;

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, "");
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [block, setBlock] = useState("p");
  const [menu, setMenu] = useState<null | "block" | "color" | "align">(null);

  // Load external value only when it differs from the live DOM (avoids caret jumps).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const incoming = value || "";
    if (el.innerHTML !== incoming) el.innerHTML = incoming;
  }, [value]);

  const emit = () => {
    const el = ref.current;
    if (el) onChange(sanitizeHtml(el.innerHTML));
  };

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
    setMenu(null);
    syncBlock();
  };

  const syncBlock = () => {
    try {
      const v = document.queryCommandValue("formatBlock").toLowerCase();
      setBlock(BLOCKS.some((b) => b.tag === v) ? v : "p");
    } catch { /* ignore */ }
  };

  const addLink = () => {
    const url = window.prompt("Link URL?", "https://");
    if (!url || /^javascript:/i.test(url)) return;
    exec("createLink", url);
  };

  const isEmpty = !value || value === "<br>" || value.replace(/<[^>]*>/g, "").trim() === "";

  const btn =
    "grid h-7 w-7 place-items-center rounded-md text-[#D4D4D8] transition hover:bg-white/[0.08] hover:text-white";

  return (
    <div className="overflow-hidden rounded-md border border-white/[0.08] bg-[#111113]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-white/[0.06] bg-[#16161A] px-2 py-1.5">
        {/* Block format */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenu(menu === "block" ? null : "block")}
            className="flex h-7 items-center gap-1 rounded-md px-2 text-[12px] text-[#D4D4D8] hover:bg-white/[0.08] hover:text-white"
          >
            {BLOCKS.find((b) => b.tag === block)?.label ?? "Paragraph"}
            <ChevronDown className="h-3 w-3" />
          </button>
          {menu === "block" && (
            <div className="absolute left-0 top-8 z-50 w-40 overflow-hidden rounded-md border border-white/[0.08] bg-[#111113] py-1 shadow-xl">
              {BLOCKS.map((b) => (
                <button
                  key={b.tag}
                  type="button"
                  onClick={() => exec("formatBlock", `<${b.tag}>`)}
                  className="block w-full px-3 py-1.5 text-left text-[12px] text-[#D4D4D8] hover:bg-white/[0.06] hover:text-white"
                >
                  {b.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="mx-1 h-4 w-px bg-white/[0.1]" />

        <button type="button" title="Bold" onClick={() => exec("bold")} className={btn}><Bold className="h-3.5 w-3.5" /></button>
        <button type="button" title="Italic" onClick={() => exec("italic")} className={btn}><Italic className="h-3.5 w-3.5" /></button>
        <button type="button" title="Underline" onClick={() => exec("underline")} className={btn}><Underline className="h-3.5 w-3.5" /></button>

        {/* Color */}
        <div className="relative">
          <button
            type="button"
            title="Text colour"
            onClick={() => setMenu(menu === "color" ? null : "color")}
            className="flex h-7 items-center gap-0.5 rounded-md px-1.5 text-[#D4D4D8] hover:bg-white/[0.08] hover:text-white"
          >
            <Baseline className="h-3.5 w-3.5" />
            <ChevronDown className="h-3 w-3" />
          </button>
          {menu === "color" && (
            <div className="absolute left-0 top-8 z-50 flex gap-1.5 rounded-md border border-white/[0.08] bg-[#111113] p-2 shadow-xl">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => exec("foreColor", c)}
                  style={{ background: c }}
                  className="h-5 w-5 rounded-full border border-white/20"
                  title={c}
                />
              ))}
            </div>
          )}
        </div>

        <span className="mx-1 h-4 w-px bg-white/[0.1]" />

        {/* Align */}
        <div className="relative">
          <button
            type="button"
            title="Alignment"
            onClick={() => setMenu(menu === "align" ? null : "align")}
            className="flex h-7 items-center gap-0.5 rounded-md px-1.5 text-[#D4D4D8] hover:bg-white/[0.08] hover:text-white"
          >
            <AlignLeft className="h-3.5 w-3.5" />
            <ChevronDown className="h-3 w-3" />
          </button>
          {menu === "align" && (
            <div className="absolute left-0 top-8 z-50 flex gap-1 rounded-md border border-white/[0.08] bg-[#111113] p-1.5 shadow-xl">
              {ALIGN.map(({ cmd, label, Icon }) => (
                <button key={cmd} type="button" title={label} onClick={() => exec(cmd)} className={btn}>
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        <button type="button" title="Bulleted list" onClick={() => exec("insertUnorderedList")} className={btn}><List className="h-3.5 w-3.5" /></button>
        <button type="button" title="Numbered list" onClick={() => exec("insertOrderedList")} className={btn}><ListOrdered className="h-3.5 w-3.5" /></button>
        <button type="button" title="Link" onClick={addLink} className={btn}><LinkIcon className="h-3.5 w-3.5" /></button>
      </div>

      {/* Surface */}
      <div className="relative">
        {isEmpty && (
          <span className="pointer-events-none absolute left-3 top-2.5 text-[12.5px] text-[#52525B]">
            {placeholder ?? "Write a description…"}
          </span>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          onKeyUp={syncBlock}
          onMouseUp={syncBlock}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
            emit();
          }}
          className="trx-rte min-h-[160px] w-full overflow-y-auto px-3 py-2 text-[12.5px] leading-[1.6] text-white outline-none"
        />
      </div>
    </div>
  );
}
