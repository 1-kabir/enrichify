"use client";

import { useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-[#0d0d0d]">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={() => setSidebarOpen(false)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            setSidebarOpen(false);
                        }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Close sidebar"
                />
            )}

            {/* Mobile sidebar container */}
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-[260px] transform bg-[#0d0d0d] border-r border-[#262626] transition-transform duration-200 ease-in-out md:hidden",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full",
                )}
            >
                <div className="flex h-14 items-center justify-between px-4 border-b border-[#262626]">
                    <div className="flex items-center space-x-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-lg font-bold text-white">Enrichify</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(false)}
                        className="text-white hover:bg-[#1a1a1a]"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <Sidebar className="flex" />
            </div>

            {/* Desktop sidebar */}
            <Sidebar />

            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden relative">
                {/* Mobile top bar */}
                <div className="flex h-14 items-center justify-between px-4 md:hidden bg-[#0d0d0d] border-b border-[#262626]">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(true)}
                        className="text-white hover:bg-[#1a1a1a]"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <span className="text-sm font-medium text-white">Enrichify</span>
                    <div className="w-10" /> {/* Spacer */}
                </div>

                <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0d0d0d]">
                    <div className="mx-auto max-w-full h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

