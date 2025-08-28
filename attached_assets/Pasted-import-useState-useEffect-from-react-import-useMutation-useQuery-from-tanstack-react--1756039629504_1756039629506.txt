import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Store, Trash2, TestTube, Settings, CheckCircle, XCircle, Clock, LogOut, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { MarketplaceIntegration } from "@shared/schema";

export default function MarketplaceIntegrationPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newIntegration, setNewIntegration] = useState({
    marketplace: "",
    storeName: "",
    storeId: "",
    apiKey: "",
    secretKey: "",
    autoSync: false,
    syncFrequency: 24,
  });

  // Fetch marketplace integrations
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["/api/marketplace-integrations"],
  });

  // Create integration mutation
  const createIntegrationMutation = useMutation({
    mutationFn: async (integrationData: any) => {
      const response = await fetch("/api/marketplace-integrations", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(integrationData),
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Muvaffaqiyat",
        description: "Marketplace integratsiyasi muvaffaqiyatli qo'shildi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace-integrations"] });
      setIsCreateDialogOpen(false);
      setNewIntegration({
        marketplace: "",
        storeName: "",
        storeId: "",
        apiKey: "",
        secretKey: "",
        autoSync: false,
        syncFrequency: 24,
      });
    },
    onError: (error) => {
      toast({
        title: "Xato",
        description: "Integratsi yaratishda xato yuz berdi",
        variant: "destructive",
      });
    },
  });

  // Delete integration mutation
  const deleteIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await fetch(`/api/marketplace-integrations/${integrationId}`, {
        method: "DELETE",
        credentials: 'include',
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Muvaffaqiyat",
        description: "Integratsi o'chirildi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace-integrations"] });
    },
    onError: (error) => {
      toast({
        title: "Xato",
        description: "Integratsiyani o'chirishda xato yuz berdi",
        variant: "destructive",
      });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await fetch(`/api/marketplace-integrations/${integrationId}/test-connection`, {
        method: "POST",
        credentials: 'include',
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test muvaffaqiyatli",
        description: `${(data as any).marketplace || 'Marketplace'} ga bog'lanish muvaffaqiyatli`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace-integrations"] });
    },
    onError: (error) => {
      toast({
        title: "Test xatosi",
        description: "API ga bog'lanishda xato yuz berdi",
        variant: "destructive",
      });
    },
  });

  const handleCreateIntegration = () => {
    if (!newIntegration.marketplace || !newIntegration.storeName || !newIntegration.apiKey) {
      toast({
        title: "Xato",
        description: "Barcha majburiy maydonlarni to'ldiring",
        variant: "destructive",
      });
      return;
    }

    createIntegrationMutation.mutate(newIntegration);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getMarketplaceDisplay = (marketplace: string) => {
    switch (marketplace) {
      case "uzum_market":
        return "Uzum Market";
      case "yandex_market":
        return "Yandex Market";
      default:
        return marketplace;
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Yuklanmoqda...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">MarketPlace Pro</h1>
              <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Marketplace Integratsiya
              </span>
              <nav className="ml-8 flex items-center space-x-4">
                <Link href="/partner" data-testid="link-dashboard">
                  <Button variant="ghost" size="sm" className="text-sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/marketplace" data-testid="link-marketplace">
                  <Button variant="ghost" size="sm" className="text-sm bg-neutral-100">
                    <Store className="w-4 h-4 mr-2" />
                    Marketplace
                  </Button>
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-accent rounded-full"></div>
                <span className="text-sm text-neutral-600">Online</span>
              </div>
              <Button 
                onClick={handleLogout}
                variant="outline"
                size="sm"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Chiqish
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Marketplace Integrationa</h1>
          <p className="text-muted-foreground">
            Uzum Market va Yandex Market bilan integratsiyani boshqaring
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-integration">
              <Plus className="h-4 w-4 mr-2" />
              Yangi integratsiya
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Yangi Marketplace Integratsiyasi</DialogTitle>
              <DialogDescription>
                Uzum Market yoki Yandex Market bilan bog'lanish uchun API ma'lumotlarini kiriting
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="marketplace">Marketplace</Label>
                <Select
                  value={newIntegration.marketplace}
                  onValueChange={(value) =>
                    setNewIntegration({ ...newIntegration, marketplace: value })
                  }
                >
                  <SelectTrigger data-testid="select-marketplace">
                    <SelectValue placeholder="Marketplace tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uzum_market">Uzum Market</SelectItem>
                    <SelectItem value="yandex_market">Yandex Market</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="storeName">Do'kon nomi</Label>
                <Input
                  id="storeName"
                  data-testid="input-store-name"
                  placeholder="Do'kon nomini kiriting"
                  value={newIntegration.storeName}
                  onChange={(e) =>
                    setNewIntegration({ ...newIntegration, storeName: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="storeId">Do'kon ID (ixtiyoriy)</Label>
                <Input
                  id="storeId"
                  data-testid="input-store-id"
                  placeholder="Do'kon ID raqamini kiriting"
                  value={newIntegration.storeId}
                  onChange={(e) =>
                    setNewIntegration({ ...newIntegration, storeId: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  data-testid="input-api-key"
                  type="password"
                  placeholder="API kalitni kiriting"
                  value={newIntegration.apiKey}
                  onChange={(e) =>
                    setNewIntegration({ ...newIntegration, apiKey: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="secretKey">Secret Key (ixtiyoriy)</Label>
                <Input
                  id="secretKey"
                  data-testid="input-secret-key"
                  type="password"
                  placeholder="Maxfiy kalitni kiriting"
                  value={newIntegration.secretKey}
                  onChange={(e) =>
                    setNewIntegration({ ...newIntegration, secretKey: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoSync"
                  data-testid="switch-auto-sync"
                  checked={newIntegration.autoSync}
                  onCheckedChange={(checked) =>
                    setNewIntegration({ ...newIntegration, autoSync: checked })
                  }
                />
                <Label htmlFor="autoSync">Avtomatik sinxronlash</Label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="syncFrequency">Sinxronlash chastotasi (soat)</Label>
                <Input
                  id="syncFrequency"
                  data-testid="input-sync-frequency"
                  type="number"
                  min="1"
                  max="168"
                  value={newIntegration.syncFrequency}
                  onChange={(e) =>
                    setNewIntegration({
                      ...newIntegration,
                      syncFrequency: parseInt(e.target.value) || 24,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                data-testid="button-cancel"
              >
                Bekor qilish
              </Button>
              <Button
                onClick={handleCreateIntegration}
                disabled={createIntegrationMutation.isPending}
                data-testid="button-create-integration"
              >
                {createIntegrationMutation.isPending ? "Yaratilmoqda..." : "Yaratish"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {(integrations as any[])?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Store className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Hech qanday integratsiya yo'q</h3>
              <p className="text-muted-foreground text-center mb-4">
                Uzum Market yoki Yandex Market bilan integratsiya qo'shing
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-first-integration">
                <Plus className="h-4 w-4 mr-2" />
                Birinchi integratsiyani qo'shish
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(integrations as any[])?.map((integration: MarketplaceIntegration) => (
              <Card key={integration.id} data-testid={`card-integration-${integration.id}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {getMarketplaceDisplay(integration.marketplace)}
                  </CardTitle>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(integration.lastSyncStatus || 'pending')}
                    <Badge variant={integration.isActive ? "default" : "secondary"}>
                      {integration.isActive ? "Faol" : "Nofaol"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{integration.storeName}</div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>Do'kon ID: {integration.storeId || "Kiritilmagan"}</div>
                    <div>Avtomatik sinxronlash: {integration.autoSync ? "Yoqilgan" : "O'chirilgan"}</div>
                    {integration.autoSync && (
                      <div>Sinxronlash chastotasi: {integration.syncFrequency || 24} soat</div>
                    )}
                    <div>Mahsulotlar soni: {integration.totalProductsSynced || 0}</div>
                    <div>Buyurtmalar soni: {integration.totalOrdersImported || 0}</div>
                    {integration.lastSyncAt && (
                      <div>
                        Oxirgi sinxronlash:{" "}
                        {new Date(integration.lastSyncAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnectionMutation.mutate(integration.id)}
                      disabled={testConnectionMutation.isPending}
                      data-testid={`button-test-${integration.id}`}
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-settings-${integration.id}`}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteIntegrationMutation.mutate(integration.id)}
                        disabled={deleteIntegrationMutation.isPending}
                        data-testid={`button-delete-${integration.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}