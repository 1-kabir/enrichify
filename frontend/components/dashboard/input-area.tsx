"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface InputAreaProps {
    onSubmit: (prompt: string) => void;
    isLoading?: boolean;
}

export function InputArea({ onSubmit, isLoading }: InputAreaProps) {
    const [prompt, setPrompt] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            onSubmit(prompt);
            setPrompt("");
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8 text-center"
            >
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-white to-[#a3a3a3] bg-clip-text text-transparent">
                        What are we building today?
                    </h1>
                    <p className="text-[#a3a3a3] text-lg max-w-xl mx-auto">
                        Describe the data you want to find, enrich, or verify. Enrichify will handle the rest.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="relative group transition-all duration-300"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-[22px] blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-hover:duration-200" />
                    <div className="relative flex items-center bg-[#1a1a1a] border border-[#333333] rounded-2xl shadow-2xl overflow-hidden focus-within:border-primary/50 transition-all p-2">
                        <div className="pl-4 flex items-center text-[#666666]">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <textarea
                            rows={1}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="e.g., Find 5 and enrich Series C SaaS companies in San Francisco..."
                            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-[#666666] py-4 px-4 resize-none max-h-48 overflow-y-auto"
                        />
                        <div className="flex items-center pr-2">
                            <Button
                                type="submit"
                                disabled={!prompt.trim() || isLoading}
                                size="icon"
                                className={cn(
                                    "h-10 w-10 rounded-xl transition-all duration-300",
                                    prompt.trim()
                                        ? "bg-primary hover:bg-primary/90 text-white"
                                        : "bg-[#333333] text-[#666666] cursor-not-allowed"
                                )}
                            >
                                {isLoading ? (
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <ArrowRight className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </form>

                <div className="flex flex-wrap items-center justify-center gap-2">
                    {["Venture Capital Firms", "SaaS Founders", "AI Startups in London"].map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => setPrompt(`Find ${tag.toLowerCase()}...`)}
                            className="px-4 py-1.5 rounded-full border border-[#333333] bg-[#1a1a1a]/50 text-xs text-[#a3a3a3] hover:text-white hover:border-[#666666] transition-all"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

function cn(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(" ");
}
