"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { AppLayout } from "@/components/layout/app-layout";
import { InputArea } from "@/components/dashboard/input-area";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Sparkles, History } from "lucide-react";

export default function DashboardPage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleRequest = async (prompt: string) => {
        try {
            setIsLoading(true);
            // In Phase 2, this will call the planning engine.
            // For now, we'll create a draft webset and redirect to it.
            const response = await api.post("/websets", {
                name: `Request: ${prompt.substring(0, 30)}...`,
                description: prompt,
                columnDefinitions: [],
                status: "draft",
            });

            const webset = response.data;

            toast({
                title: "Request received",
                description: "Enrichify is planning your webset...",
            });

            router.push(`/websets/${webset.id}`);
        } catch (error) {
            console.error("Failed to create webset:", error);
            toast({
                title: "Error",
                description: "Failed to initiate webset creation.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateFromFile = () => {
        router.push('/websets/new');
    };

    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    {/* Header */}
                    <div className="text-center space-y-4 mb-12">
                        <h1 className="text-4xl font-bold text-white tracking-tight">
                            Create a New Webset
                        </h1>
                        <p className="text-[#a3a3a3] text-lg">
                            Start by describing your data needs or import from a file
                        </p>
                    </div>

                    {/* Creation Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
                        <Card className="bg-[#141414] border-[#262626] hover:border-primary/30 transition-colors">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white text-xl">
                                    <Sparkles className="h-6 w-6 text-primary" />
                                    AI-Powered
                                </CardTitle>
                                <CardDescription className="text-[#666666]">
                                    Describe your data needs and let Enrichify plan the structure
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <InputArea onSubmit={handleRequest} isLoading={isLoading} />
                            </CardContent>
                        </Card>

                        <Card className="bg-[#141414] border-[#262626] hover:border-primary/30 transition-colors">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white text-xl">
                                    <Upload className="h-6 w-6 text-primary" />
                                    From File
                                </CardTitle>
                                <CardDescription className="text-[#666666]">
                                    Import your existing data from CSV, XLS, or XLSX files
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-[#a3a3a3] text-sm">
                                    Upload your spreadsheet to create a webset instantly
                                </p>
                                <Button 
                                    variant="outline" 
                                    className="w-full border-[#333333] text-[#a3a3a3] hover:text-white hover:border-primary/30 gap-2"
                                    onClick={handleCreateFromFile}
                                >
                                    <Upload className="h-4 w-4" />
                                    Upload File
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Activity Section */}
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
                            <Button 
                                variant="outline" 
                                className="border-[#333333] text-[#a3a3a3] hover:text-white hover:border-primary/30 gap-2"
                                onClick={() => router.push('/dashboard/history')}
                            >
                                <History className="h-4 w-4" />
                                View All History
                            </Button>
                        </div>
                        <Card className="bg-[#141414] border-[#262626]">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <History className="h-5 w-5 text-primary" />
                                    Enrichment History
                                </CardTitle>
                                <CardDescription className="text-[#666666]">
                                    View your recent enrichment jobs and their status
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-[#a3a3a3] text-center py-8">
                                    Your enrichment job history will appear here.
                                    <br />
                                    <Button 
                                        variant="link" 
                                        className="text-primary p-0 h-auto mt-2 hover:underline"
                                        onClick={() => router.push('/dashboard/history')}
                                    >
                                        View full history
                                    </Button>
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}
