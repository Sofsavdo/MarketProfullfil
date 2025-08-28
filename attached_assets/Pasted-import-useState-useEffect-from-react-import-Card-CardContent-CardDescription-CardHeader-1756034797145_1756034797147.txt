import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingUp, Target, DollarSign, Zap, Crown, Package, Truck } from "lucide-react";

interface FulfillmentResult {
  tierName: string;
  fixedPayment: number;
  commissionRate: number;
  marketplaceCommissionRate: number;
  commissionAmount: number;
  totalFulfillmentFee: number;
  partnerProfit: number;
  profitPercentage: number;
  netProfit: number;
  marketplaceCommission: number;
  logisticsFee: number;
  sptCost: number;
  tax: number;
}

interface FulfillmentCalculatorProps {
  className?: string;
}

// Haqiqiy Fulfillment model - 4-darajali pricing
const FULFILLMENT_TIERS = {
  starter_pro: {
    name: "Starter Pro",
    fixedPayment: 0, // Risksiz tarif
    commissionRanges: [
      { min: 0, max: 10000000, rate: 45 }, // 45% - 0-10M
      { min: 10000000, max: 50000000, rate: 35 }, // 35% - 10M-50M
      { min: 50000000, max: Infinity, rate: 30 } // 30% - 50M+
    ]
  },
  business_standard: {
    name: "Business Standard", 
    fixedPayment: 3500000, // 3.5M som
    commissionRanges: [
      { min: 0, max: 20000000, rate: 25 }, // 25% - 0-20M
      { min: 20000000, max: 100000000, rate: 20 }, // 20% - 20M-100M  
      { min: 100000000, max: Infinity, rate: 18 } // 18% - 100M+
    ]
  },
  professional_plus: {
    name: "Professional Plus",
    fixedPayment: 6000000, // 6M som
    commissionRanges: [
      { min: 0, max: 50000000, rate: 20 }, // 20% - 0-50M
      { min: 50000000, max: 200000000, rate: 17 }, // 17% - 50M-200M
      { min: 200000000, max: Infinity, rate: 15 } // 15% - 200M+
    ]
  },
  enterprise_elite: {
    name: "Enterprise Elite",
    fixedPayment: 10000000, // 10M som
    commissionRanges: [
      { min: 0, max: 100000000, rate: 18 }, // 18% - 0-100M
      { min: 100000000, max: 500000000, rate: 15 }, // 15% - 100M-500M
      { min: 500000000, max: Infinity, rate: 12 } // 12% - 500M+
    ]
  }
};

// Uzum Market 2024 haqiqiy komissiya stavkalari (kategoriya + narx asosida)
const UZUM_MARKETPLACE_CATEGORIES = {
  // 1-iyundan 25%dan 10%ga tushirilgan kategoriyalar
  electronics: { name: "Elektronika", getCommission: (price: number) => price > 5000000 ? 3 : (price > 50000 ? 10 : 25) },
  baby: { name: "Bolalar kiyim-kechak", getCommission: (price: number) => price > 5000000 ? 3 : (price > 50000 ? 10 : 25) },
  home: { name: "Uy-ro'zg'or mollari", getCommission: (price: number) => price > 5000000 ? 3 : (price > 50000 ? 10 : 25) },
  garden: { name: "Bog' uchun mollar", getCommission: (price: number) => price > 5000000 ? 3 : (price > 50000 ? 10 : 25) },
  appliances: { name: "Konditsionerlar", getCommission: (price: number) => price > 5000000 ? 3 : (price > 50000 ? 10 : 25) },
  stabilizers: { name: "Kuchlanish stabilizatorlari", getCommission: (price: number) => price > 5000000 ? 3 : (price > 50000 ? 10 : 25) },
  
  // Umumiy kategoriyalar (3-35% oralig'ida)
  clothing: { name: "Kiyim-kechak", getCommission: (price: number) => price > 5000000 ? 3 : (price > 50000 ? 15 : 30) },
  beauty: { name: "Go'zallik", getCommission: (price: number) => price > 5000000 ? 3 : (price > 50000 ? 18 : 35) },
  books: { name: "Kitoblar", getCommission: (price: number) => price > 5000000 ? 3 : (price > 50000 ? 8 : 20) },
  sports: { name: "Sport", getCommission: (price: number) => price > 5000000 ? 3 : (price > 50000 ? 12 : 25) },
  automotive: { name: "Avto", getCommission: (price: number) => price > 5000000 ? 3 : (price > 50000 ? 10 : 22) },
  jewelry: { name: "Zargarlik", getCommission: (price: number) => price > 5000000 ? 3 : (price > 50000 ? 20 : 35) },
  health: { name: "Salomatlik", getCommission: (price: number) => price > 5000000 ? 3 : (price > 50000 ? 16 : 30) },
  furniture: { name: "Mebel", getCommission: (price: number) => price > 5000000 ? 3 : (price > 50000 ? 12 : 25) },
  other: { name: "Boshqa", getCommission: (price: number) => price > 5000000 ? 3 : (price > 50000 ? 12 : 25) }
};

// Uzum Market FBO logistika haqlari (rasm asosida to'liq sodda tizim)
const UZUM_LOGISTICS_FEES = {
  kgt: { name: "KGT (99,999 so'm gacha)", fee: 4000 },
  ogt: { name: "O'GT (100k+ so'm)", fee: 6000 },
  ygt_middle: { name: "YGT o'rta (sim-kartalar)", fee: 8000 },
  ygt_large: { name: "YGT katta gabarit", fee: 20000 }
};

export function FulfillmentCalculator({ className }: FulfillmentCalculatorProps) {
  const [selectedTier, setSelectedTier] = useState<keyof typeof FULFILLMENT_TIERS>("starter_pro");
  const [salesInput, setSalesInput] = useState<string>("20,000,000");
  const [costInput, setCostInput] = useState<string>("12,000,000");
  const [quantityInput, setQuantityInput] = useState<string>("1");
  const [logisticsSize, setLogisticsSize] = useState<keyof typeof UZUM_LOGISTICS_FEES>("ogt");
  const [commissionRate, setCommissionRate] = useState<string>("3");
  const [result, setResult] = useState<FulfillmentResult | null>(null);

  // Format number input with commas
  const formatNumberInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    const cleanNumbers = numbers.replace(/^0+/, '') || '0';
    return cleanNumbers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const parseNumberInput = (value: string): number => {
    return parseInt(value.replace(/,/g, '') || '0', 10);
  };

  const handleSalesInputChange = (value: string) => {
    const formatted = formatNumberInput(value);
    setSalesInput(formatted);
  };

  const handleCostInputChange = (value: string) => {
    const formatted = formatNumberInput(value);
    setCostInput(formatted);
  };

  // Haqiqiy Fulfillment hisobi
  const calculateFulfillment = (
    sales: number, 
    cost: number, 
    quantity: number, 
    tier: keyof typeof FULFILLMENT_TIERS,
    logisticsKey: keyof typeof UZUM_LOGISTICS_FEES,
    commissionPercentage: number
  ): FulfillmentResult => {
    const tierConfig = FULFILLMENT_TIERS[tier];
    const marketplaceCommissionRate = commissionPercentage;
    const logisticsPerItem = UZUM_LOGISTICS_FEES[logisticsKey].fee;
    
    // Marketplace harajatlari (sotuv narxidan hisoblanadi)
    const marketplaceCommission = (sales * marketplaceCommissionRate) / 100;
    const logisticsFee = logisticsPerItem * quantity;
    const sptCost = 2000 * quantity; // SPT harajati har bir mahsulot uchun 2000 som
    const tax = sales * 0.03; // 3% soliq sotuv narxidan
    
    // Sof foyda = Sotish - Xarid - SPT - Marketplace komissiya - Logistika - Soliq
    const netProfit = sales - cost - sptCost - marketplaceCommission - logisticsFee - tax;
    
    // Fulfillment komissiyasi sof foydadan
    let commissionRate = 0;
    let commissionAmount = 0;
    
    if (netProfit > 0) {
      // Sof foyda bo'yicha tegishli tarif aniqlanadi
      const range = tierConfig.commissionRanges.find(r => netProfit >= r.min && netProfit < r.max);
      if (range) {
        commissionRate = range.rate;
        commissionAmount = (netProfit * commissionRate) / 100;
      }
    }
    
    // Jami fulfillment haqi = Fixed to'lov + sof foydadan komissiya
    const totalFulfillmentFee = tierConfig.fixedPayment + commissionAmount;
    
    // Hamkor foyda = Sof foyda - Fulfillment haqi
    const partnerProfit = netProfit - totalFulfillmentFee;
    const profitPercentage = sales > 0 ? (partnerProfit / sales) * 100 : 0;

    return {
      tierName: tierConfig.name,
      fixedPayment: tierConfig.fixedPayment,
      commissionRate,
      marketplaceCommissionRate,
      commissionAmount,
      totalFulfillmentFee,
      partnerProfit,
      profitPercentage,
      netProfit,
      marketplaceCommission,
      logisticsFee,
      sptCost,
      tax
    };
  };

  useEffect(() => {
    const sales = parseNumberInput(salesInput);
    const cost = parseNumberInput(costInput);
    const quantity = parseInt(quantityInput || '1', 10);
    const commission = parseFloat(commissionRate) || 0;
    const calculatedResult = calculateFulfillment(sales, cost, quantity, selectedTier, logisticsSize, commission);
    setResult(calculatedResult);
  }, [salesInput, costInput, quantityInput, selectedTier, logisticsSize, commissionRate]);

  const formatSom = (amount: number): string => {
    return new Intl.NumberFormat('uz-UZ').format(Math.round(amount)) + ' so\'m';
  };

  const getTierIcon = (tier: keyof typeof FULFILLMENT_TIERS) => {
    switch (tier) {
      case 'starter_pro': return <Zap className="h-4 w-4" />;
      case 'business_standard': return <Target className="h-4 w-4" />;
      case 'professional_plus': return <TrendingUp className="h-4 w-4" />;
      case 'enterprise_elite': return <Crown className="h-4 w-4" />;
      default: return <Calculator className="h-4 w-4" />;
    }
  };

  const getTierColor = (tier: keyof typeof FULFILLMENT_TIERS) => {
    switch (tier) {
      case 'starter_pro': return 'text-green-600';
      case 'business_standard': return 'text-blue-600';
      case 'professional_plus': return 'text-purple-600';
      case 'enterprise_elite': return 'text-amber-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Calculator className="h-6 w-6 text-primary" />
          Fulfillment Foyda Kalkulyatori
        </CardTitle>
        <CardDescription>
          Haqiqiy Uzum Market FBO modeli asosida - marketplace komissiyalari va logistika harajatlari hisobida
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Tier Selection */}
        <div className="space-y-2">
          <Label>Fulfillment Tarifi</Label>
          <Select value={selectedTier} onValueChange={(value: keyof typeof FULFILLMENT_TIERS) => setSelectedTier(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FULFILLMENT_TIERS).map(([key, tier]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    {getTierIcon(key as keyof typeof FULFILLMENT_TIERS)}
                    <span>{tier.name}</span>
                    <Badge variant="outline" className={getTierColor(key as keyof typeof FULFILLMENT_TIERS)}>
                      {tier.fixedPayment > 0 ? formatSom(tier.fixedPayment) : 'Risksiz'}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Product Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sotish Narxi (so'm)</Label>
              <Input
                type="text"
                value={salesInput}
                onChange={(e) => handleSalesInputChange(e.target.value)}
                placeholder="20,000,000"
              />
            </div>

            <div className="space-y-2">
              <Label>Xarid Narxi (so'm)</Label>
              <Input
                type="text"
                value={costInput}
                onChange={(e) => handleCostInputChange(e.target.value)}
                placeholder="12,000,000"
              />
            </div>

            <div className="space-y-2">
              <Label>Miqdor</Label>
              <Input
                type="number"
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
                placeholder="1"
                min="1"
              />
            </div>
          </div>

          {/* Marketplace Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commissionRate">Marketplace Komissiya (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                placeholder="3"
                min="0"
                max="35"
                step="0.1"
                className="w-full"
              />
              <div className="text-xs text-gray-600">
                Marketplace seller panelida ko'rsatilgan aniq komissiya foizini kiriting
              </div>
            </div>

            <div className="space-y-2">
              <Label>Logistika Gabariti</Label>
              <Select value={logisticsSize} onValueChange={(value: keyof typeof UZUM_LOGISTICS_FEES) => setLogisticsSize(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(UZUM_LOGISTICS_FEES).map(([key, log]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center justify-between w-full">
                        <span>{log.name}</span>
                        <Badge variant="outline">{formatSom(log.fee)}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-center">Foyda Hisobi - {result.tierName}</h3>
            
            {/* Marketplace Harajatlari */}
            <Card className="bg-red-50 border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Marketplace Harajatlari (hamkordan undiriladi)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Marketplace komissiya ({result.marketplaceCommissionRate}%):</span>
                  <span className="font-medium text-red-600">{formatSom(result.marketplaceCommission)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SPT harajati (2k som/dona):</span>
                  <span className="font-medium text-red-600">{formatSom(result.sptCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Logistika ({UZUM_LOGISTICS_FEES[logisticsSize].name}):</span>
                  <span className="font-medium text-red-600">{formatSom(result.logisticsFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Soliq (3%):</span>
                  <span className="font-medium text-red-600">{formatSom(result.tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Sof Foyda:</span>
                  <span className={result.netProfit > 0 ? "text-green-600" : "text-red-600"}>
                    {formatSom(result.netProfit)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Fulfillment Harajatlari */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Fulfillment Harajatlari (bizning xizmat)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Fixed to'lov:</span>
                  <span className="font-medium text-blue-600">{formatSom(result.fixedPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Komissiya sof foydadan ({result.commissionRate}%):</span>
                  <span className="font-medium text-blue-600">{formatSom(result.commissionAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Jami Fulfillment haqi:</span>
                  <span className="text-blue-600">{formatSom(result.totalFulfillmentFee)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Final Result */}
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Hamkor Final Foyda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Sizning foydangiz:</span>
                  <span className={`text-2xl font-bold ${result.partnerProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatSom(result.partnerProfit)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-neutral-600">
                  <span>Foyda foizi:</span>
                  <span className={result.profitPercentage > 0 ? 'text-green-600' : 'text-red-600'}>
                    {result.profitPercentage.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}