"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/protected-route";
import {
    User,
    Lock,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";
import { motion } from "framer-motion";

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [isWipingWebsets, setIsWipingWebsets] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast({
                title: "Error",
                description: "New passwords do not match",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsUpdatingPassword(true);
            await api.patch("/profile/password", passwordData);
            toast({
                title: "Success",
                description: "Password updated successfully",
            });
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update password",
                variant: "destructive",
            });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleWipeWebsets = async () => {
        if (!confirm("Are you sure you want to wipe all your websets? This action cannot be undone.")) return;

        try {
            setIsWipingWebsets(true);
            await api.delete("/profile/websets");
            toast({
                title: "Success",
                description: "All websets have been deleted",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to wipe websets",
                variant: "destructive",
            });
        } finally {
            setIsWipingWebsets(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Are you sure you want to delete your account? All your data will be permanently removed.")) return;

        try {
            setIsDeletingAccount(true);
            await api.delete("/profile");
            toast({
                title: "Account Deleted",
                description: "Your account has been permanently removed.",
            });
            logout();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete account",
                variant: "destructive",
            });
        } finally {
            setIsDeletingAccount(false);
        }
    };

    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                    >
                        <h1 className="text-3xl font-bold text-white tracking-tight">Account Settings</h1>
                        <p className="text-[#a3a3a3]">Manage your profile and security preferences.</p>
                    </motion.div>

                    <div className="grid gap-8">
                        {/* Profile Info */}
                        <Card className="bg-[#1a1a1a] border-[#333333] text-white">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Personal Information</CardTitle>
                                        <CardDescription className="text-[#666666]">Your account details.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label className="text-[#a3a3a3]">Username</Label>
                                    <Input
                                        value={user?.name || ""}
                                        disabled
                                        className="bg-[#0d0d0d] border-[#333333] text-white disabled:opacity-70"
                                    />
                                    <p className="text-[10px] text-[#666666]">Managed by administrator.</p>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-[#a3a3a3]">Email address</Label>
                                    <Input
                                        value={user?.email || ""}
                                        disabled
                                        className="bg-[#0d0d0d] border-[#333333] text-white disabled:opacity-70"
                                    />
                                    <p className="text-[10px] text-[#666666]">Managed by administrator.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Change Password */}
                        <Card className="bg-[#1a1a1a] border-[#333333] text-white">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Security</CardTitle>
                                        <CardDescription className="text-[#666666]">Change your account password.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <form onSubmit={handlePasswordChange}>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="current">Current Password</Label>
                                        <Input
                                            id="current"
                                            type="password"
                                            required
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="bg-[#0d0d0d] border-[#333333] text-white focus:border-primary/50"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="new">New Password</Label>
                                            <Input
                                                id="new"
                                                type="password"
                                                required
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                className="bg-[#0d0d0d] border-[#333333] text-white focus:border-primary/50"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="confirm">Confirm New Password</Label>
                                            <Input
                                                id="confirm"
                                                type="password"
                                                required
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                className="bg-[#0d0d0d] border-[#333333] text-white focus:border-primary/50"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t border-[#333333] pt-6">
                                    <Button disabled={isUpdatingPassword} className="bg-primary hover:bg-primary/90 text-white gap-2">
                                        {isUpdatingPassword ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                        Update Password
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>

                        {/* Danger Zone */}
                        <Card className="bg-[#1a1a1a] border-red-900/30 text-white">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg text-red-500">Danger Zone</CardTitle>
                                        <CardDescription className="text-[#666666]">Irreversible actions for your account.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-red-900/20 bg-red-950/10">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Wipe All Websets</p>
                                        <p className="text-xs text-[#666666]">Delete all your data enrichment projects permanently.</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={handleWipeWebsets}
                                        disabled={isWipingWebsets}
                                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10 gap-2"
                                    >
                                        {isWipingWebsets ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                        Wipe Data
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-red-900/20 bg-red-950/10">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-red-500">Delete Account</p>
                                        <p className="text-xs text-[#666666]">Permanently delete your account and all associated data.</p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteAccount}
                                        disabled={isDeletingAccount}
                                        className="bg-red-600 hover:bg-red-700 text-white gap-2"
                                    >
                                        {isDeletingAccount ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}
