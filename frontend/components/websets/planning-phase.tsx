"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { ExecutionPlan, Webset, ColumnDefinition } from "@/types/webset";
import {
    Sparkles,
    CheckCircle2,
    Settings2,
    Search,
    ListTodo,
    RefreshCw,
    ArrowRight,
    Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface PlanningPhaseProps {
    webset: Webset;
    onApproved: (plan: ExecutionPlan) => void;
    onEditPrompt: () => void;
}

export function PlanningPhase({ webset, onApproved, onEditPrompt }: PlanningPhaseProps) {
    const [plan, setPlan] = useState<ExecutionPlan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        generatePlan();
    }, [webset.id]);

    const generatePlan = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await api.post("/enrichment/plan", { prompt: webset.description });
            setPlan(response.data);
        } catch (err) {
            setError("Failed to generate plan. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 text-white">
                <div className="relative">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 rounded-full border-t-2 border-primary"
                    />
                    <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
                </div>
                <div className="space-y-2 text-center">
                    <h2 className="text-xl font-semibold">Enrichify is planning...</h2>
                    <p className="text-[#a3a3a3] text-sm max-w-sm">
                        Our agents are analyzing your request and designing the optimal enrichment strategy.
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <p className="text-red-500">{error}</p>
                <Button onClick={generatePlan} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Retry Planning
                </Button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto py-8 px-4 space-y-8"
        >
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 gap-1.5 uppercase tracking-wider text-[10px] font-bold">
                        <Sparkles className="h-3 w-3" />
                        Planning Phase
                    </Badge>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Mission Strategy</h1>
                </div>
                <Button variant="ghost" className="text-[#a3a3a3] hover:text-white gap-2" onClick={onEditPrompt}>
                    <Edit3 className="h-4 w-4" />
                    Edit Request
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Schema Preview */}
                <Card className="md:col-span-2 bg-[#1a1a1a] border-[#333333] text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                            <Settings2 className="h-5 w-5 text-primary" />
                            Proposed Schema
                        </CardTitle>
                        <CardDescription className="text-[#666666]">
                            Suggested columns for your webset.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {plan?.columnDefinitions.map((col, idx) => (
                                <motion.div
                                    key={col.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center justify-between p-3 rounded-lg bg-[#0d0d0d] border border-[#262626] group hover:border-primary/30 transition-colors"
                                >
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-white">{col.name}</p>
                                        <p className="text-xs text-[#666666]">{col.description}</p>
                                    </div>
                                    <Badge variant="secondary" className="bg-white/5 text-[#a3a3a3] border-[#262626] group-hover:bg-primary/20 group-hover:text-primary group-hover:border-primary/30 transition-colors">
                                        {col.type}
                                    </Badge>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Strategy sidebar */}
                <div className="space-y-6">
                    <Card className="bg-[#1a1a1a] border-[#333333] text-white">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                <Search className="h-5 w-5 text-blue-500" />
                                Discovery
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-[#666666] uppercase">Strategy</p>
                                <p className="text-sm text-[#a3a3a3] leading-relaxed">{plan?.searchStrategy}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-[#666666] uppercase">Est. Results</p>
                                <p className="text-2xl font-bold text-white">{plan?.estimatedResults}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#1a1a1a] border-[#333333] text-white">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                <ListTodo className="h-5 w-5 text-green-500" />
                                Next Steps
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {plan?.steps.map((step, idx) => (
                                    <li key={idx} className="flex gap-3 text-sm text-[#a3a3a3]">
                                        <span className="text-[#666666] font-mono">{idx + 1}.</span>
                                        {step}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex flex-col items-center pt-8 border-t border-[#262626] space-y-4">
                <Button
                    size="lg"
                    onClick={() => plan && onApproved(plan)}
                    className="bg-primary hover:bg-primary/90 text-white gap-2 px-12 py-6 rounded-2xl text-lg shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    Approve & Launch Mission
                    <ArrowRight className="h-5 w-5" />
                </Button>
                <p className="text-xs text-[#666666]">
                    Launching will initialize the schema and start the parallel agent swarm.
                </p>
            </div>
        </motion.div>
    );
}
