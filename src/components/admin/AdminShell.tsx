import { useState, useEffect, useMemo, useRef } from "react";
import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard, ShoppingBag, Package, Tags, Users, Ticket,
  BarChart3, Star, LifeBuoy, Settings, Search, Bell, Plus,
  ChevronRight, Command as CmdIcon, CircleUser, Menu, X, Check,
  Loader2, ShieldAlert, Inbox, Truck,
} from "lucide-react";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem,
} from "@/components/ui/command";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { adminListNotifications, type AdminNotification } from "@/lib/admin.functions";

const READ_KEY = "trx.admin.notifs.read.v1";
const loadRead = (): Set<string> => {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]")); } catch { return new Set(); }
};
const saveRead = (s: Set<string>) => {
  try { localStorage.setItem(READ_KEY, JSON.stringify(Array.from(s))); } catch {}
};

const timeAgo = (iso: string) => {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60_000) return "just now";
  const m = Math.floor(d / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badge?: string;
};

const nav: NavItem[] = [
  { to: "/260519", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/260519/orders", label: "Orders", icon: ShoppingBag, badge: "24" },
  { to: "/260519/products", label: "Products", icon: Package },
  { to: "/260519/categories", label: "Categories", icon: Tags },
  { to: "/260519/customers", label: "Customers", icon: Users },
  { to: "/260519/coupons", label: "Coupons", icon: Ticket },
  { to: "/260519/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/260519/suppliers", label: "Suppliers", icon: Truck },
  { to: "/260519/reviews", label: "Reviews", icon: Star },
  { to: "/260519/support", label: "Support", icon: LifeBuoy, badge: "3" },
  { to: "/260519/settings", label: "Settings", icon: Settings },
];

const labelFromPath = (p: string) => {
  const seg = p.replace(/^\/admin\/?/, "").split("/")[0];
  if (!seg) return "Dashboard";
  return seg.charAt(0).toUpperCase() + seg.slice(1);
};

export function AdminShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [access, setAccess] = useState<"loading" | "allowed" | "signed-out" | "forbidden">("loading");
  const [adminEmail, setAdminEmail] = useState("");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [time, setTime] = useState("");
  const listNotifsFn = useServerFn(adminListNotifications);
  
  const { data: notifs = [] } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => listNotifsFn(),
    enabled: access === "allowed",
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const [readIds, setReadIds] = useState<Set<string>>(() => (typeof window !== "undefined" ? loadRead() : new Set()));
  const seenRef = useRef<Set<string>>(new Set());
  const firstLoadRef = useRef(true);
  const unread = useMemo(() => notifs.filter((n) => !readIds.has(n.id)).length, [notifs, readIds]);

  // Toast on newly-arrived notifications (skip first load to avoid a flood).
  useEffect(() => {
    if (!notifs.length) return;
    if (firstLoadRef.current) {
      notifs.forEach((n) => seenRef.current.add(n.id));
      firstLoadRef.current = false;
      return;
    }
    const fresh = notifs.filter((n) => !seenRef.current.has(n.id));
    fresh.forEach((n) => {
      seenRef.current.add(n.id);
      const type: "success" | "info" | "warning" | "error" =
        n.kind === "out_of_stock" ? "error"
        : n.kind === "low_stock" ? "warning"
        : n.kind === "customer" ? "info"
        : "success";
      toast[type](n.title, { description: n.description });
    });
  }, [notifs]);

  const markRead = (id: string) => {
    const next = new Set(readIds); next.add(id); setReadIds(next); saveRead(next);
  };
  const markAllRead = () => {
    const next = new Set(readIds); notifs.forEach((n) => next.add(n.id)); setReadIds(next); saveRead(next);
    toast.success("All notifications marked as read");
  };

  useEffect(() => {
    let active = true;

    const redirectToSignIn = () => {
      const redirect = pathname.startsWith("/260519") ? pathname : "/260519";
      window.location.assign(`/signin?redirect=${encodeURIComponent(redirect)}`);
    };

    const checkAccess = async () => {
      setAccess("loading");
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!active) return;
      if (!user) {
        setAccess("signed-out");
        redirectToSignIn();
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!active) return;
      setAdminEmail(user.email ?? "Admin");
      setAccess(!error && data?.role === "admin" ? "allowed" : "forbidden");
    };

    checkAccess();
    return () => { active = false; };
  }, [navigate, pathname]);

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      );
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const go = (to: string) => {
    navigate({ to: to as never });
    setCmdOpen(false);
  };

  if (access === "loading" || access === "signed-out") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#09090B] px-6 text-[#FAFAFA]">
        <div className="flex items-center gap-3 text-sm text-[#A1A1AA]">
          <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" />
          Opening admin…
        </div>
      </div>
    );
  }

  if (access === "forbidden") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#09090B] px-6 text-[#FAFAFA]">
        <div className="w-full max-w-md border border-white/[0.08] bg-[#111113] p-6 text-center">
          <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full bg-[#EF4444]/10 text-[#f87171]">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold">Admin access required</h1>
          <p className="mt-2 text-sm text-[#A1A1AA]">
            Sign in with the admin account, then open /admin again.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.assign("/signin?redirect=%2Fadmin");
              }}
              className="h-9 rounded-md bg-[#2563EB] px-4 text-sm font-medium text-white hover:bg-[#1d4ed8]"
            >
              Sign in as admin
            </button>
            <button
              onClick={() => navigate({ to: "/" })}
              className="h-9 rounded-md border border-white/[0.08] px-4 text-sm text-[#D4D4D8] hover:bg-white/[0.04]"
            >
              Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  const Sidebar = (
    <>
      <div className="flex h-14 items-center gap-2 px-5">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-white text-black text-[11px] font-bold tracking-tight">
          TX
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold tracking-tight">TRXSHOP</span>
          <span className="text-[10.5px] text-[#71717A]">Admin Console</span>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto grid h-7 w-7 place-items-center rounded-md text-[#A1A1AA] md:hidden"
          aria-label="Close menu"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-3 pt-2">
        <button
          onClick={() => setCmdOpen(true)}
          className="flex h-9 w-full items-center gap-2 rounded-lg border border-white/[0.06] bg-[#111113] px-2.5 text-[12.5px] text-[#71717A] transition hover:border-white/10 hover:text-[#A1A1AA]"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search…</span>
          <span className="ml-auto flex items-center gap-1 rounded border border-white/[0.06] px-1.5 py-0.5 text-[10px] text-[#A1A1AA]">
            <CmdIcon className="h-2.5 w-2.5" />K
          </span>
        </button>
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 px-2.5">
        <div className="px-2 pb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[#52525B]">
          Workspace
        </div>
        {nav.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to as never}
              className="group relative flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] text-[#A1A1AA] transition-colors hover:text-white"
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-md bg-white/[0.06]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              {active && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute -left-2.5 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-[#2563EB]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <item.icon className={`relative h-3.5 w-3.5 ${active ? "text-white" : ""}`} />
              <span className={`relative ${active ? "text-white" : ""}`}>{item.label}</span>
              {item.badge && (
                <span className="relative ml-auto rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-[#A1A1AA]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <button
          onClick={() => toast("Signed in as admin", { description: adminEmail })}
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition hover:bg-white/[0.04]"
        >
          <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] text-[11px] font-semibold">
            AK
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[12px] font-medium">Admin</span>
            <span className="text-[10.5px] text-[#71717A]">Owner</span>
          </div>
          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen w-full bg-[#09090B] text-[#FAFAFA] antialiased">
      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[244px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0B0B0E] md:flex">
          {Sidebar}
        </aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              />
              <motion.aside
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
                className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-white/[0.06] bg-[#0B0B0E] md:hidden"
              >
                {Sidebar}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/[0.06] bg-[#09090B]/85 px-5 backdrop-blur-xl">
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-8 w-8 place-items-center rounded-md text-[#A1A1AA] hover:bg-white/[0.04] hover:text-white md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5 text-[12.5px] text-[#71717A]">
              <span>TRXSHOP</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white">{labelFromPath(pathname)}</span>
            </div>

            <div className="mx-auto hidden max-w-md flex-1 md:block">
              <button
                onClick={() => setCmdOpen(true)}
                className="mx-auto flex h-8 w-full max-w-sm items-center gap-2 rounded-lg border border-white/[0.06] bg-[#111113] px-2.5 text-[12px] text-[#71717A] transition hover:border-white/10"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search orders, products, customers…</span>
                <span className="ml-auto rounded border border-white/[0.06] px-1.5 py-0.5 text-[10px]">⌘K</span>
              </button>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <span className="hidden rounded-md border border-white/[0.06] bg-[#111113] px-2 py-1 text-[11px] tabular-nums text-[#A1A1AA] lg:inline">
                {time}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="relative grid h-8 w-8 place-items-center rounded-md text-[#A1A1AA] transition hover:bg-white/[0.04] hover:text-white">
                    <Bell className="h-3.5 w-3.5" />
                    {unread > 0 && (
                      <span className="absolute right-1.5 top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-[#EF4444] text-[9px] font-semibold text-white">
                        {unread}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-80 border-white/[0.06] bg-[#111113] p-0 text-white"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold">Notifications</span>
                      {unread > 0 && (
                        <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-[#A1A1AA]">
                          {unread} new
                        </span>
                      )}
                    </div>
                    <button
                      onClick={markAllRead}
                      disabled={unread === 0}
                      className="text-[11px] text-[#A1A1AA] transition hover:text-white disabled:opacity-40 disabled:hover:text-[#A1A1AA]"
                    >
                      Mark all read
                    </button>
                  </div>
                  <ul className="max-h-96 overflow-y-auto">
                    {notifs.length === 0 && (
                      <li className="grid place-items-center gap-2 px-4 py-10 text-center">
                        <Inbox className="h-5 w-5 text-[#52525B]" />
                        <p className="text-[12px] text-[#71717A]">No activity yet</p>
                      </li>
                    )}
                    {notifs.map((n: AdminNotification) => {
                      const isRead = readIds.has(n.id);
                      return (
                        <li
                          key={n.id}
                          onClick={() => {
                            markRead(n.id);
                            if (n.href) navigate({ to: n.href as never });
                          }}
                          className="group flex cursor-pointer items-start gap-3 border-b border-white/[0.04] px-4 py-3 last:border-0 hover:bg-white/[0.02]"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: n.tone, boxShadow: isRead ? "none" : `0 0 8px ${n.tone}` }} />
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-[12.5px] ${isRead ? "text-[#A1A1AA]" : "text-white"}`}>
                              {n.title}
                            </p>
                            {n.description && (
                              <p className="truncate text-[11px] text-[#71717A]">{n.description}</p>
                            )}
                            <span className="text-[10.5px] text-[#52525B]">{timeAgo(n.created_at)}</span>
                          </div>
                          {!isRead && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                              className="opacity-0 transition group-hover:opacity-100"
                              aria-label="Mark read"
                            >
                              <Check className="h-3.5 w-3.5 text-[#A1A1AA]" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </PopoverContent>
              </Popover>
              <button
                onClick={() => setCmdOpen(true)}
                className="hidden h-8 items-center gap-1.5 rounded-md bg-[#2563EB] px-2.5 text-[12px] font-medium text-white transition hover:bg-[#1d4ed8] sm:flex"
              >
                <Plus className="h-3.5 w-3.5" /> New
              </button>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="grid h-8 w-8 place-items-center rounded-md text-[#A1A1AA] transition hover:bg-white/[0.04] hover:text-white">
                    <CircleUser className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-56 border-white/[0.06] bg-[#111113] p-1 text-white"
                >
                  <div className="border-b border-white/[0.06] px-3 py-2.5">
                    <div className="text-[12.5px] font-medium">Admin</div>
                    <div className="text-[11px] text-[#71717A]">{adminEmail}</div>
                  </div>
                  {[
                    { label: "Profile settings", to: "/260519/settings" },
                    { label: "Billing", to: "/260519/settings" },
                    { label: "Switch workspace", to: null },
                  ].map((i) => (
                    <button
                      key={i.label}
                      onClick={() => (i.to ? go(i.to) : toast("Only one workspace right now"))}
                      className="block w-full rounded-md px-3 py-2 text-left text-[12.5px] text-[#D4D4D8] hover:bg-white/[0.04] hover:text-white"
                    >
                      {i.label}
                    </button>
                  ))}
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.assign("/signin?redirect=%2Fadmin");
                    }}
                    className="mt-1 block w-full rounded-md border-t border-white/[0.06] px-3 py-2 text-left text-[12.5px] text-[#f87171] hover:bg-[#EF4444]/[0.08]"
                  >
                    Sign out
                  </button>
                </PopoverContent>
              </Popover>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 px-5 py-6 md:px-8 md:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {nav.map((n) => (
              <CommandItem
                key={n.to}
                onSelect={() => go(n.to)}
              >
                <n.icon className="h-3.5 w-3.5" />
                {n.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={() => {
                go("/260519/products");
                setTimeout(() => toast.success("Create product", { description: "Opening product editor" }), 100);
              }}
            >
              <Plus className="h-3.5 w-3.5" />Create product
            </CommandItem>
            <CommandItem
              onSelect={() => {
                go("/260519/orders");
                setTimeout(() => toast("Issue refund", { description: "Pick an order to refund" }), 100);
              }}
            >
              <Plus className="h-3.5 w-3.5" />Issue refund
            </CommandItem>
            <CommandItem
              onSelect={() => {
                go("/260519/coupons");
                setTimeout(() => toast.success("New coupon", { description: "Opening coupon editor" }), 100);
              }}
            >
              <Plus className="h-3.5 w-3.5" />New coupon
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}