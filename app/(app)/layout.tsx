"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Link2,
  FileQuestion,
  Link2Off,
  FileText,
  Settings,
  CreditCard,
  ChevronDown,
  Menu,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PLAN_LIMITS, PlanType } from "@/lib/billing/plans";

const NAV_ITEMS = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/suggestions", label: "Link suggestions", icon: Link2 },
  { href: "/app/orphans", label: "Orphan pages", icon: FileQuestion },
  { href: "/app/broken-links", label: "Broken links", icon: Link2Off },
  { href: "/app/report", label: "Weekly report", icon: FileText },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Dynamic user & site state
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [userPlan, setUserPlan] = useState<PlanType>("free");
  const [pagesUsed, setPagesUsed] = useState(0);
  const [pagesLimit, setPagesLimit] = useState(20);
  const [siteName, setSiteName] = useState("No Site Connected");
  const [siteUrl, setSiteUrl] = useState("Connect site →");

  useEffect(() => {
    async function loadUserData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const email = user.email || "";
          setUserEmail(email);

          // Fetch profile, subscription, and sites concurrently in parallel
          const [
            { data: profile },
            { data: sub },
            { data: userSites },
          ] = await Promise.all([
            supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
            supabase.from("subscriptions").select("plan").eq("user_id", user.id).maybeSingle(),
            supabase.from("sites").select("id, name, url").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
          ]);

          const name =
            profile?.full_name ||
            (user.user_metadata?.full_name as string) ||
            (user.user_metadata?.name as string) ||
            email.split("@")[0] ||
            "User";
          setUserName(name);
          if (profile?.email) {
            setUserEmail(profile.email);
          }

          // Ensure profile exists in profiles table
          if (!profile && user) {
            supabase
              .from("profiles")
              .upsert({
                id: user.id,
                email: user.email,
                full_name: name,
              })
              .then();
          }

          const plan = (sub?.plan as PlanType) || "free";
          setUserPlan(plan);
          const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
          setPagesLimit(limits.pagesPerSiteLimit);

          if (userSites && userSites.length > 0) {
            const activeSite = userSites[0];
            setSiteName(activeSite.name || "Connected Site");
            try {
              const parsed = new URL(activeSite.url);
              setSiteUrl(parsed.hostname);
            } catch {
              setSiteUrl(activeSite.url);
            }

            const { count: pagesCount } = await supabase
              .from("pages")
              .select("*", { count: "exact", head: true })
              .eq("site_id", activeSite.id);

            setPagesUsed(pagesCount || 0);
          } else {
            setSiteName("No Site Connected");
            setSiteUrl("Connect site →");
            setPagesUsed(0);
          }
        }
      } catch {
        // Fallback
      }
    }
    loadUserData();
  }, []);

  const userInitials = (userName || userEmail || "U")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const isActive = (href: string) => {
    if (href === "/app") {
      return pathname === "/app";
    }
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="flex flex-col gap-6">
        {/* Logo */}
        <div className="px-2">
          <Logo href="/app" />
        </div>

        {/* Site Switcher */}
        <div className="px-2">
          <Link
            href={siteName === "No Site Connected" ? "/onboarding/connect" : "/app/settings"}
            className="flex items-center justify-between p-2.5 rounded-[6px] border border-border bg-surface hover:bg-bg/60 transition-colors cursor-pointer text-left block"
          >
            <div className="flex flex-col overflow-hidden mr-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${siteName === "No Site Connected" ? "bg-amber-500" : "bg-primary"}`} />
                <span className="text-[13px] font-semibold text-text truncate">
                  {siteName}
                </span>
              </div>
              <span className="text-[11px] text-muted truncate pl-3.5">
                {siteUrl}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" />
          </Link>
        </div>

        {/* Nav List */}
        <nav className="flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-[6px] text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-primary-tint text-primary font-semibold"
                    : "text-muted hover:text-text hover:bg-surface"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    active ? "text-primary" : "text-muted"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User & Plan Area */}
      <div className="flex flex-col gap-3 p-2 border-t border-border mt-auto">
        {/* Plan card badge */}
        <div className="p-3 rounded-[6px] bg-surface border border-border flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted font-medium uppercase tracking-wider capitalize">
              {userPlan} Plan
            </span>
            <span className="text-text font-mono font-medium">
              {pagesUsed}/{pagesLimit} pgs
            </span>
          </div>
          <div className="w-full bg-border h-1 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full"
              style={{
                width: `${Math.min(100, (pagesUsed / (pagesLimit || 1)) * 100)}%`,
              }}
            />
          </div>
          <Link
            href="/app/billing"
            onClick={() => setMobileDrawerOpen(false)}
            className="text-[12px] text-primary font-semibold hover:underline mt-1 block"
          >
            {userPlan === "pro"
              ? "Manage Pro Plan →"
              : userPlan === "agency"
              ? "Manage Agency Plan →"
              : "Upgrade to Pro →"}
          </Link>
        </div>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center justify-between w-full p-2 rounded-[6px] hover:bg-surface text-left transition-colors cursor-pointer outline-none">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-primary-tint text-primary flex items-center justify-center text-[12px] font-semibold shrink-0">
                {userInitials}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-[13px] font-medium text-text truncate">
                  {userName}
                </span>
                <span className="text-[11px] text-muted truncate">
                  {userEmail}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-56 bg-white border border-border shadow-xl rounded-[6px] p-1.5 z-50"
          >
            <DropdownMenuItem
              onClick={() => router.push("/app/settings")}
              className="flex items-center gap-2 text-[13px] cursor-pointer"
            >
              <Settings className="w-4 h-4 text-muted" />
              <span>Site Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/app/billing")}
              className="flex items-center gap-2 text-[13px] cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-muted" />
              <span>Billing & Plans</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={async () => {
                try {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                } catch {
                  // Fallback
                }
                router.push("/login");
              }}
              className="flex items-center gap-2 text-[13px] cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-danger" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg text-text">
      {/* Desktop Fixed 240px Left Sidebar */}
      <aside className="hidden md:flex w-[240px] flex-col shrink-0 fixed top-0 bottom-0 left-0 bg-surface border-r border-border p-4 z-30">
        {navContent}
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-40 bg-surface border-b border-border h-14 px-4 flex items-center justify-between">
        <Logo href="/app" />
        <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
          <SheetTrigger
            className="h-9 w-9 inline-flex items-center justify-center text-muted hover:text-text rounded-[6px]"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] p-4 bg-surface">
            {navContent}
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 md:pl-[240px] min-h-screen">
        <div className="max-w-[1200px] mx-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
