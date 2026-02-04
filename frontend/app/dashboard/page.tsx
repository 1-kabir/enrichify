"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { AppLayout } from "@/components/layout/app-layout";
import { InputArea } from "@/components/dashboard/input-area";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

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

    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4">
                    <InputArea onSubmit={handleRequest} isLoading={isLoading} />
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}
