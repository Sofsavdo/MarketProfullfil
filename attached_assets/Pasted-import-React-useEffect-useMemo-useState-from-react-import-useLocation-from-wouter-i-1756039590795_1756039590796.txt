import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  Handshake, 
  ShoppingBag, 
  TrendingUp, 
  Package, 
  DollarSign,
  Users,
  BarChart3,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download,
  MessageCircle,
  Settings
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getProductsByPartner, getOrdersByPartner, getMyPartnerProfile } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { PRICING_TIERS, calculateCommission } from '@shared/schema';

interface DashboardStats {
  totalProducts: number;
  activeOrders: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  commission: number;
  pendingRequests: number;
  completedOrders: number;
  customerSatisfaction: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  createdAt: string;
}

interface Order {
  id: string;
  customerName: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export default function PartnerDashboard() {
  const [, navigate] = useLocation();
  const auth = useAuth();
  const { user, logout, isLoading } = auth as any;
  const typedUser = user as { id: string; firstName?: string; username: string; role: 'admin' | 'partner' } | null;
  const { toast } = useToast();

  // Live data
  const { data: me } = useQuery({
    queryKey: ['/api/me/partner'],
    queryFn: getMyPartnerProfile,
    enabled: !!typedUser && typedUser.role === 'partner',
  });

  const partnerId: string | undefined = me?.partner?.id;

  const { data: productsRes } = useQuery({
    queryKey: partnerId ? ['/api/products/partner', partnerId] : ['noop'],
    queryFn: async () => partnerId ? await getProductsByPartner(partnerId) : { products: [] },
    enabled: !!partnerId,
  });

  const { data: ordersRes } = useQuery({
    queryKey: partnerId ? ['/api/orders/partner', partnerId] : ['noop'],
    queryFn: async () => partnerId ? await getOrdersByPartner(partnerId) : { list: [] },
    enabled: !!partnerId,
  });

  const products: Product[] = productsRes?.products || [];
  const orders: Order[] = (ordersRes?.list as any[])?.map(o => ({
    id: o.id,
    customerName: o.customerName,
    totalAmount: Number(o.totalAmount || 0),
    status: o.status,
    createdAt: o.createdAt,
  })) || [];

  const computedStats: DashboardStats = useMemo(() => {
    const thisMonth = new Date().getMonth();
    const monthlyOrders = orders.filter(o => new Date(o.createdAt).getMonth() === thisMonth);
    const monthlyRevenue = monthlyOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    // Simplified profit estimate: 25% of revenue
    const monthlyProfit = Math.round(monthlyRevenue * 0.25);
    const tier = (me?.partner?.pricingTier || 'basic') as keyof typeof PRICING_TIERS;
    const commissionInfo = calculateCommission(monthlyProfit, tier as any);
    return {
      totalProducts: products.length,
      activeOrders: orders.filter(o => ['pending','processing','shipped'].includes(o.status)).length,
      monthlyRevenue,
      monthlyProfit,
      commission: Math.round(commissionInfo.amount),
      pendingRequests: 0,
      completedOrders: orders.filter(o => o.status === 'delivered').length,
      customerSatisfaction: 98,
    };
  }, [orders, products, me]);

  // Redirect if not authenticated or not partner
  useEffect(() => {
    if (!isLoading && (!typedUser || typedUser.role !== 'partner')) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!typedUser || typedUser.role !== 'partner') {
    return null;
  }

  // Low stock toast (once)
  useEffect(() => {
    const low = products.find(p => (p.stockQuantity || 0) <= (p as any).lowStockThreshold || 10);
    if (low) {
      toast({ title: 'Kam qoldiq ogohlantirish', description: `${low.name}: ${low.stockQuantity} dona qoldi` });
    }
  }, [products, toast]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Handshake className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Partner Dashboard</h1>
                  <p className="text-sm text-gray-600">Professional marketplace management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {typedUser?.firstName || typedUser?.username}
                </p>
                <p className="text-xs text-gray-600">Hamkor</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Chiqish
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Oylik Daromad</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(computedStats.monthlyRevenue)}</div>
              <div className="flex items-center text-xs text-blue-700 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12.5% o'tgan oydan
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900">Sof Foyda</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(computedStats.monthlyProfit)}</div>
              <div className="flex items-center text-xs text-green-700 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +8.3% o'tgan oydan
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Komissiya</CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{formatCurrency(computedStats.commission)}</div>
              <div className="flex items-center text-xs text-purple-700 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +15.2% o'tgan oydan
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-900">Faol Buyurtmalar</CardTitle>
              <ShoppingBag className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{computedStats.activeOrders}</div>
              <div className="flex items-center text-xs text-orange-700 mt-1">
                <Clock className="h-3 w-3 mr-1" />
                {computedStats.pendingRequests} kutilmoqda
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Umumiy ma'lumot</TabsTrigger>
            <TabsTrigger value="products">Mahsulotlar</TabsTrigger>
            <TabsTrigger value="orders">Buyurtmalar</TabsTrigger>
            <TabsTrigger value="analytics">Analitika</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Ishlash ko'rsatkichlari
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Mijoz qoniqishi</span>
                      <span>{computedStats.customerSatisfaction}%</span>
                    </div>
                    <Progress value={computedStats.customerSatisfaction} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Buyurtma bajarish</span>
                      <span>95%</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Mahsulot mavjudligi</span>
                      <span>87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    So'nggi faollik
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Yangi buyurtma qabul qilindi</p>
                        <p className="text-xs text-gray-500">2 soat oldin</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Mahsulot omborga qo'shildi</p>
                        <p className="text-xs text-gray-500">5 soat oldin</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Komissiya to'landi</p>
                        <p className="text-xs text-gray-500">1 kun oldin</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Mahsulotlar</CardTitle>
                  <Button size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Barchasini ko'rish
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-gray-600">{formatCurrency(product.price)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusColor(product.status)}>
                          {product.status === 'active' ? 'Faol' : 
                           product.status === 'inactive' ? 'Nofaol' : 'Tugagan'}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {product.stockQuantity} dona
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Buyurtmalar</CardTitle>
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Hisobot yuklab olish
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{order.customerName}</h4>
                          <p className="text-sm text-gray-600">{formatCurrency(order.totalAmount)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status === 'pending' ? 'Kutilmoqda' :
                           order.status === 'processing' ? 'Jarayonda' :
                           order.status === 'shipped' ? 'Yuborildi' :
                           order.status === 'delivered' ? 'Yetkazildi' : 'Bekor qilindi'}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Oylik tahlil</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Jami savdo</span>
                      <span className="font-medium">{formatCurrency(computedStats.monthlyRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Sof foyda</span>
                      <span className="font-medium text-green-600">{formatCurrency(computedStats.monthlyProfit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Komissiya</span>
                      <span className="font-medium text-purple-600">{formatCurrency(computedStats.commission)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Bajarilgan buyurtmalar</span>
                      <span className="font-medium">{computedStats.completedOrders}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Keyingi maqsadlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Daromad maqsadi</span>
                      <span className="text-sm text-gray-600">3M / 5M</span>
                    </div>
                    <Progress value={60} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mahsulot maqsadi</span>
                      <span className="text-sm text-gray-600">12 / 20</span>
                    </div>
                    <Progress value={60} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mijoz maqsadi</span>
                      <span className="text-sm text-gray-600">156 / 200</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Tezkor amallar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <MessageCircle className="h-6 w-6 mb-2" />
                  <span className="text-sm">Chat qo'llab-quvvatlash</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Settings className="h-6 w-6 mb-2" />
                  <span className="text-sm">Sozlamalar</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Download className="h-6 w-6 mb-2" />
                  <span className="text-sm">Hisobotlar</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Target className="h-6 w-6 mb-2" />
                  <span className="text-sm">Maqsadlar</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/partner-activation')}>
                  <Target className="h-6 w-6 mb-2" />
                  <span className="text-sm">Aktivatsiya so'rovi</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/fulfillment-request')}>
                  <Package className="h-6 w-6 mb-2" />
                  <span className="text-sm">Fulfillment so'rovi</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}