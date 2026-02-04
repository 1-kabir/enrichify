"use client";

import Link from "next/link";
import { MoveLeft, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8 max-w-md w-full"
            >
                <div className="relative inline-block">
                    <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl opacity-50" />
                    <Ghost className="h-24 w-24 text-primary relative" />
                </div>

                <div className="space-y-4">
                    <h1 className="text-6xl font-bold text-white tracking-tighter">404</h1>
                    <h2 className="text-2xl font-semibold text-white/90">Page not found</h2>
                    <p className="text-[#a3a3a3]">
                        The page you're looking for doesn't exist or has been moved to another dimension.
                    </p>
                </div>

                <div className="pt-4">
                    <Link href="/dashboard">
                        <Button size="lg" className="gap-2 rounded-xl px-8">
                            <MoveLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
