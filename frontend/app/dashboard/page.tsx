"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Database, TrendingUp, Activity, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  {
    title: "Total Contacts",
    value: "0",
    icon: Users,
    description: "No contacts yet",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
  },
  {
    title: "Enriched",
    value: "0",
    icon: Database,
    description: "0% enriched",
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-500",
  },
  {
    title: "Success Rate",
    value: "0%",
    icon: TrendingUp,
    description: "No data",
    gradient: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-500",
  },
  {
    title: "Active Jobs",
    value: "0",
    icon: Activity,
    description: "No jobs running",
    gradient: "from-orange-500/20 to-amber-500/20",
    iconColor: "text-orange-500",
  },
];

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-4xl font-heading font-bold tracking-tight">
                Dashboard
              </h1>
              <p className="text-lg text-muted-foreground">
                Welcome to Enrichify - Your data enrichment platform
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <Zap className="h-4 w-4" />
                Quick Actions
              </Button>
              <Button className="gap-2 shadow-smooth">
                <Sparkles className="h-4 w-4" />
                New Webset
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card 
                  key={stat.title} 
                  className="relative overflow-hidden border-border/50 shadow-smooth hover:shadow-smooth-lg transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`} />
                  <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`rounded-lg bg-background/80 backdrop-blur-sm p-2`}>
                      <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-heading font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Getting Started Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/50 shadow-smooth">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-heading">Getting Started</CardTitle>
                    <CardDescription className="mt-1">
                      Begin your data enrichment journey
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Create your first webset</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Upload contacts or connect a data source to get started
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-muted p-1.5 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Configure providers</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Add API keys for LLM and search providers
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-muted p-1.5 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Start enriching</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Run enrichment jobs and see your data come to life
                      </p>
                    </div>
                  </div>
                </div>
                <Button className="w-full mt-4 gap-2">
                  <Sparkles className="h-4 w-4" />
                  Create First Webset
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-smooth bg-gradient-to-br from-card via-card to-primary/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-heading">Quick Tips</CardTitle>
                    <CardDescription className="mt-1">
                      Pro tips to get the most out of Enrichify
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-background/50 backdrop-blur-sm border border-border/50 p-4 space-y-2">
                  <p className="text-sm font-medium">💡 Use specific prompts</p>
                  <p className="text-xs text-muted-foreground">
                    The more specific your enrichment prompts, the better results you'll get
                  </p>
                </div>
                <div className="rounded-lg bg-background/50 backdrop-blur-sm border border-border/50 p-4 space-y-2">
                  <p className="text-sm font-medium">🎯 Try multiple providers</p>
                  <p className="text-xs text-muted-foreground">
                    Different providers excel at different tasks - experiment to find the best fit
                  </p>
                </div>
                <div className="rounded-lg bg-background/50 backdrop-blur-sm border border-border/50 p-4 space-y-2">
                  <p className="text-sm font-medium">⚡ Batch processing</p>
                  <p className="text-xs text-muted-foreground">
                    Process multiple rows at once for faster results
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity - Placeholder for future */}
          <Card className="border-border/50 shadow-smooth">
            <CardHeader>
              <CardTitle className="text-xl font-heading">Recent Activity</CardTitle>
              <CardDescription>Your latest enrichment jobs and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground max-w-sm">
                  No recent activity yet. Start enriching your data to see updates here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
