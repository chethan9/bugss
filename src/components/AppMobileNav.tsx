"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Menu,
  User,
  LogOut,
  Github,
  Trash2,
  Link2,
  KeyRound,
  Unplug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type GithubNavConnection = {
  id: string;
  username: string;
  avatar_url: string | null;
};

type GithubSection = {
  hasPat: boolean;
  connections: GithubNavConnection[];
  activeConnectionId: string | null;
  onSwitch: (connectionId: string) => void;
  onRemove: (connectionId: string) => void;
  onDisconnectAll: () => void;
  onConnectOAuth: () => void;
  onConnectPat: () => void;
  isOAuthStarting?: boolean;
};

type Props = {
  currentPath?: string;
  userEmail?: string | null;
  signedIn: boolean;
  github?: GithubSection;
  onSignOut: () => void;
};

export function AppMobileNav({
  currentPath = "/",
  userEmail,
  signedIn,
  github,
  onSignOut,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const navigate = (path: string) => {
    setOpen(false);
    void router.push(path);
  };

  const linkClass = (path: string) =>
    cn(
      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
      currentPath === path && "bg-muted"
    );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open navigation menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(100%,320px)] sm:max-w-sm">
        <SheetHeader className="text-left">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-1">
          <button type="button" className={linkClass("/")} onClick={() => navigate("/")}>
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            Dashboard
          </button>
          {signedIn ? (
            <button
              type="button"
              className={linkClass("/profile")}
              onClick={() => navigate("/profile")}
            >
              <User className="h-4 w-4 shrink-0" />
              Profile
            </button>
          ) : (
            <button type="button" className={linkClass("/auth")} onClick={() => navigate("/auth")}>
              <User className="h-4 w-4 shrink-0" />
              Sign in
            </button>
          )}
        </div>

        {signedIn && userEmail && (
          <p className="mt-4 px-3 text-xs text-muted-foreground truncate">{userEmail}</p>
        )}

        {signedIn && github && (
          <>
            <Separator className="my-4" />
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              GitHub
            </p>
            {github.hasPat && (
              <p className="mt-2 px-3 text-xs text-muted-foreground">
                A personal access token is saved. The dashboard uses that token until you remove it
                in Profile.
              </p>
            )}
            {!github.hasPat && github.connections.length === 0 && (
              <p className="mt-2 px-3 text-xs text-muted-foreground">
                No linked GitHub accounts yet.
              </p>
            )}
            {!github.hasPat &&
              github.connections.map((c) => {
                const active = github.activeConnectionId === c.id;
                return (
                  <div
                    key={c.id}
                    className={cn(
                      "mt-2 flex items-center gap-2 rounded-md border px-2 py-2",
                      active && "border-primary bg-primary/5"
                    )}
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                      onClick={() => {
                        void github.onSwitch(c.id);
                        setOpen(false);
                      }}
                    >
                      {c.avatar_url ? (
                        <img
                          src={c.avatar_url}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-full"
                        />
                      ) : (
                        <Github className="h-8 w-8 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate font-medium">@{c.username}</span>
                      {active && (
                        <span className="ml-auto shrink-0 text-[10px] uppercase text-primary">
                          Active
                        </span>
                      )}
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      aria-label={`Remove ${c.username}`}
                      onClick={() => void github.onRemove(c.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            <div className="mt-3 flex flex-col gap-2 px-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                disabled={github.isOAuthStarting}
                onClick={() => {
                  void github.onConnectOAuth();
                  setOpen(false);
                }}
              >
                <Link2 className="h-4 w-4" />
                {github.isOAuthStarting ? "Opening GitHub…" : "Add account (OAuth)"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                onClick={() => {
                  github.onConnectPat();
                  setOpen(false);
                }}
              >
                <KeyRound className="h-4 w-4" />
                Connect with token
              </Button>
              {(github.connections.length > 0 || github.hasPat) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 text-destructive hover:text-destructive"
                  onClick={() => {
                    void github.onDisconnectAll();
                    setOpen(false);
                  }}
                >
                  <Unplug className="h-4 w-4" />
                  Disconnect all GitHub
                </Button>
              )}
            </div>
          </>
        )}

        {signedIn && (
          <>
            <Separator className="my-4" />
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {
                setOpen(false);
                void onSignOut();
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
