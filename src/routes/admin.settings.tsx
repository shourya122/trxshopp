import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Card, PageHeader } from "@/components/admin/ui";
import { adminUpdateUsdRate, getPublicSettings } from "@/lib/settings.functions";

export const Route = createFileRoute("/admin/settings")({ component: Settings });

function CurrencyCard() {
  const settingsFn = useServerFn(getPublicSettings);
  const saveFn = useServerFn(adminUpdateUsdRate);
  const { data, isLoading, refetch } = useQuery({ queryKey: ["public-settings"], queryFn: () => settingsFn() });
  const [rate, setRate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.usdInrRate != null) setRate(String(data.usdInrRate));
  }, [data?.usdInrRate]);

  const save = async () => {
    const n = Number(rate);
    if (!Number.isFinite(n) || n <= 0) { toast.error("Enter a valid rate greater than 0"); return; }
    setSaving(true);
    try {
      await saveFn({ data: { rate: n } });
      await refetch();
      toast.success(`Dollar rate saved — $1 = ₹${n}`);
    } catch (e) {
      toast.error((e as Error)?.message || "Couldn't save the rate");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-3 p-5">
      <h3 className="text-[14px] font-semibold text-white">Currency</h3>
      <p className="mt-1 text-[12px] text-[#A1A1AA]">
        Dollar prices shown to shoppers are converted from rupees with this rate. Customers are always charged in rupees.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] text-[#D4D4D8]">$1 =</span>
        <span className="text-[12.5px] text-[#D4D4D8]">₹</span>
        <input
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          inputMode="decimal"
          placeholder={isLoading ? "…" : "88"}
          className="h-9 w-28 rounded-md border border-white/[0.1] bg-black px-3 text-[13px] text-white outline-none focus:border-white/30"
        />
        <button
          onClick={save}
          disabled={saving || isLoading}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-white px-4 text-[12.5px] font-semibold text-black disabled:opacity-50"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
        </button>
      </div>
    </Card>
  );
}

const groups = [
  { title: "Workspace", desc: "Name, branding and timezone", items: ["Store name", "Logo & favicon", "Timezone", "Currency"] },
  { title: "Payments", desc: "Providers and payout schedule", items: ["Stripe", "PayPal", "Apple Pay", "Payout schedule"] },
  { title: "Team", desc: "Invite admins and manage roles", items: ["Members", "Roles", "Audit log"] },
  { title: "Notifications", desc: "Email, Slack and webhook alerts", items: ["Email digests", "Slack channel", "Webhooks"] },
  { title: "API", desc: "Personal tokens and API access", items: ["API keys", "Rate limits", "IP allowlist"] },
  { title: "Danger zone", desc: "Irreversible actions", items: ["Transfer ownership", "Delete workspace"] },
];

function Settings() {
  const onClick = (group: string, item: string) =>
    group === "Danger zone"
      ? toast(item, {
          description: "This action is irreversible.",
          action: { label: "Confirm", onClick: () => toast.success(`${item} queued`) },
        })
      : toast(`${item}`, { description: `Opening ${group.toLowerCase()} settings` });

  return (
    <div>
      <PageHeader title="Settings" description="Configure your workspace and integrations." />
      <CurrencyCard />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {groups.map((g) => (
          <Card key={g.title} className="p-5">
            <h3 className="text-[14px] font-semibold text-white">{g.title}</h3>
            <p className="mt-1 text-[12px] text-[#A1A1AA]">{g.desc}</p>
            <ul className="mt-4 divide-y divide-white/[0.04]">
              {g.items.map((it) => (
                <li key={it}>
                  <button
                    onClick={() => onClick(g.title, it)}
                    className="flex w-full items-center justify-between py-2.5 text-left text-[12.5px] text-[#D4D4D8] transition hover:text-white"
                  >
                    <span>{it}</span>
                    <span className="text-[#52525B] transition group-hover:text-white">→</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}