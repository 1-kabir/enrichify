"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    MessageSquare,
    Settings,
    LogOut,
    Plus,
    MoreVertical,
    User,
    LayoutDashboard,
    Circle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import type { Webset } from "@/types/webset";
import { WebsetStatus } from "@/types/webset";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [websets, setWebsets] = useState<Webset[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchWebsets();
    }, []);

    const fetchWebsets = async () => {
        try {
            const response = await api.get("/websets");
            setWebsets(response.data);
        } catch (error) {
            console.error("Failed to fetch websets:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const statusColor = (status: WebsetStatus) => {
        switch (status) {
            case WebsetStatus.ACTIVE:
                return "bg-green-500";
            case WebsetStatus.DRAFT:
                return "bg-yellow-500";
            case WebsetStatus.ARCHIVED:
                return "bg-gray-500";
            default:
                return "bg-gray-500";
        }
    };

    return (
        <aside className={cn("hidden md:flex flex-col w-[260px] h-screen bg-[#0d0d0d] text-white border-r border-[#262626]", className)}>
            {/* Header / New Webset */}
            <div className="p-3">
                <Link href="/dashboard">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-12 hover:bg-[#1a1a1a] text-sm font-medium border border-transparent hover:border-[#333333] transition-all rounded-lg"
                    >
                        <Plus className="h-5 w-5" />
                        New Webset
                    </Button>
                </Link>
            </div>

            {/* Navigation / Items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1">
                <div className="py-2">
                    <Link
                        href="/dashboard"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                            pathname === "/dashboard"
                                ? "bg-[#1a1a1a] text-white"
                                : "text-[#999999] hover:bg-[#1a1a1a] hover:text-white"
                        )}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </Link>
                </div>

                <div className="text-[11px] font-semibold text-[#666666] uppercase px-3 py-2 tracking-wider">
                    Your Websets
                </div>

                <div className="space-y-0.5">
                    {isLoading ? (
                        <div className="px-3 space-y-4 pt-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-4 w-full bg-[#1a1a1a] rounded animate-pulse" />
                            ))}
                        </div>
                    ) : websets.length === 0 ? (
                        <div className="px-3 py-4 text-xs text-[#666666] italic">
                            No websets yet.
                        </div>
                    ) : (
                        <AnimatePresence>
                            {websets.map((ws) => (
                                <motion.div
                                    key={ws.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                >
                                    <Link
                                        href={`/websets/${ws.id}`}
                                        className={cn(
                                            "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                                            pathname === `/websets/${ws.id}`
                                                ? "bg-[#1a1a1a] text-white"
                                                : "text-[#999999] hover:bg-[#1a1a1a] hover:text-white"
                                        )}
                                    >
                                        <MessageSquare className="h-4 w-4 shrink-0" />
                                        <span className="truncate flex-1 pr-4">{ws.name}</span>
                                        <div className={cn(
                                            "h-1.5 w-1.5 rounded-full absolute right-3 shrink-0",
                                            statusColor(ws.status)
                                        )} />
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Footer / Profile */}
            <div className="p-3 space-y-1 border-t border-[#262626]">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 h-14 hover:bg-[#1a1a1a] text-white rounded-lg px-2"
                        >
                            <Avatar className="h-9 w-9 border border-[#333333]">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-[#1a1a1a] text-[#ffffff] text-xs">
                                    {user?.name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                                <p className="text-xs text-[#666666] truncate">{user?.email}</p>
                            </div>
                            <MoreVertical className="h-4 w-4 text-[#666666]" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side="right"
                        align="end"
                        className="w-56 bg-[#0d0d0d] border-[#262626] text-white"
                    >
                        <DropdownMenuItem asChild>
                            <Link href="/profile" className="flex items-center gap-2 py-2.5">
                                <User className="h-4 w-4" />
                                Profile
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/settings" className="flex items-center gap-2 py-2.5">
                                <Settings className="h-4 w-4" />
                                Settings
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#262626]" />
                        <DropdownMenuItem
                            onClick={logout}
                            className="text-red-500 focus:text-red-500 flex items-center gap-2 py-2.5"
                        >
                            <LogOut className="h-4 w-4" />
                            Log Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    );
}
