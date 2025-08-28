import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  Truck, 
  Calculator, 
  CheckCircle, 
  ArrowLeft,
  Upload,
  AlertCircle,
  Info,
  Clock,
  Target,
  FileText,
  ShoppingCart,
  BarChart3
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { PRICING_TIERS } from '@shared/schema';

const fulfillmentSchema = z.object({
  productName: z.string().min(2, "Mahsulot nomi kamida 2 ta belgi bo'lishi kerak"),
  productDescription: z.string().min(10, "Mahsulot tavsifi kamida 10 ta belgi bo'lishi kerak"),
  productCategory: z.string().min(1, "Mahsulot toifasini tanlang"),
  expectedQuantity: z.number().min(1, "Mahsulot soni kamida 1 bo'lishi kerak"),
  estimatedPrice: z.number().min(1000, "Taxminiy narx kamida 1000 so'm bo'lishi kerak"),
  costPrice: z.number().min(1000, "Tannarx kamida 1000 so'm bo'lishi kerak"),
  supplierInfo: z.string().min(5, "Yetkazib beruvchi ma'lumoti kamida 5 ta belgi bo'lishi kerak"),
  urgencyLevel: z.enum(["low", "normal", "high", "urgent"]),
  deliveryDate: z.string().min(1, "Yetkazib berish sanasini tanlang"),
  specialRequirements: z.string().optional(),
  productImages: z.array(z.string()).min(1, "Kamida 1 ta rasm yuklashingiz kerak"),
  productDocuments: z.array(z.string()).optional(),
});

type FulfillmentForm = z.infer<typeof fulfillmentSchema>;

export default function ProductFulfillmentRequest() {
  const [, setLocation] = useLocation();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTier, setCurrentTier] = useState<"basic" | "professional" | "enterprise">("basic");
  const { toast } = useToast();

  const form = useForm<FulfillmentForm>({
    resolver: zodResolver(fulfillmentSchema),
    defaultValues: {
      productName: "",
      productDescription: "",
      productCategory: "",
      expectedQuantity: 1,
      estimatedPrice: 0,
      costPrice: 0,
      supplierInfo: "",
      urgencyLevel: "normal",
      deliveryDate: "",
      specialRequirements: "",
      productImages: [],
      productDocuments: [],
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileNames = Array.from(files).map(file => file.name);
      setUploadedImages(prev => [...prev, ...fileNames]);
      form.setValue('productImages', [...form.getValues('productImages'), ...fileNames]);
    }
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileNames = Array.from(files).map(file => file.name);
      setUploadedDocuments(prev => [...prev, ...fileNames]);
      form.setValue('productDocuments', [...(form.getValues('productDocuments') || []), ...fileNames]);
    }
  };

  const calculateProfit = () => {
    const estimatedPrice = form.watch('estimatedPrice') || 0;
    const costPrice = form.watch('costPrice') || 0;
    const quantity = form.watch('expectedQuantity') || 1;
    
    const totalRevenue = estimatedPrice * quantity;
    const totalCost = costPrice * quantity;
    const grossProfit = totalRevenue - totalCost;
    
    // Calculate commission based on tier
    const tier = PRICING_TIERS[currentTier];
    let commissionRate = 0;
    for (const commissionTier of tier.commissionTiers) {
      if (grossProfit <= commissionTier.threshold) {
        commissionRate = commissionTier.rate;
        break;
      }
    }
    
    const commission = (grossProfit * commissionRate) / 100;
    const sptCost = tier.sptCost * quantity;
    const netProfit = grossProfit - commission - sptCost;
    
    return {
      totalRevenue,
      totalCost,
      grossProfit,
      commission,
      sptCost,
      netProfit,
      commissionRate
    };
  };

  const onSubmit = async (data: FulfillmentForm) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/product-fulfillment-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Fulfillment so'rovi yuborildi",
          description: "Admin ko'rib chiqishini kuting. SMS orqali xabar beramiz.",
        });
        setLocation('/partner-dashboard');
      } else {
        const errorData = await response.json();
        toast({
          title: "Xatolik",
          description: errorData.message || "So'rovni yuborishda xatolik",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Tizim xatosi",
        description: "Qayta urinib ko'ring",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const profitCalculation = calculateProfit();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl border-slate-700">
        <CardHeader className="space-y-1 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/partner-dashboard')}
            className="absolute top-4 left-4 text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Orqaga
          </Button>
          
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Mahsulot Fulfillment So'rovi</CardTitle>
          <CardDescription className="text-slate-600">
            Mahsulotlaringizni fulfillment xizmatiga topshirish uchun ma'lumotlarni to'ldiring
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Product Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mahsulot nomi</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="iPhone 15 Pro 256GB" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="productCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mahsulot toifasi</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Toifani tanlang" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Electronics">Elektronika</SelectItem>
                          <SelectItem value="Fashion">Kiyim va moda</SelectItem>
                          <SelectItem value="Home">Uy jihozlari</SelectItem>
                          <SelectItem value="Sports">Sport va faollik</SelectItem>
                          <SelectItem value="Beauty">Go'zallik va parvarish</SelectItem>
                          <SelectItem value="Books">Kitoblar</SelectItem>
                          <SelectItem value="Toys">O'yinchoqlar</SelectItem>
                          <SelectItem value="Food">Oziq-ovqat</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mahsulot soni</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          placeholder="100"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="urgencyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shoshilish darajasi</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Darajani tanlang" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Past</SelectItem>
                          <SelectItem value="normal">O'rtacha</SelectItem>
                          <SelectItem value="high">Yuqori</SelectItem>
                          <SelectItem value="urgent">Shoshilinch</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxminiy sotuv narxi (so'm)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          placeholder="15000000"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tannarx (so'm)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          placeholder="12000000"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yetkazib berish sanasi</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="productDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mahsulot tavsifi</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Mahsulot haqida batafsil ma'lumot, xususiyatlari, o'lchamlari va boshqa muhim ma'lumotlar" rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplierInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yetkazib beruvchi ma'lumoti</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Yetkazib beruvchi kompaniya, aloqa ma'lumotlari, mahsulot kelib chiqish manbai" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maxsus talablar (ixtiyoriy)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Maxsus qadoqlash, etiketkalash, saqlash shartlari yoki boshqa maxsus talablar" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Profit Calculation */}
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calculator className="w-5 h-5 mr-2" />
                    Foyda hisoboti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-sm text-slate-600">Jami savdo</div>
                      <div className="text-lg font-bold text-blue-600">
                        {profitCalculation.totalRevenue.toLocaleString()} so'm
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Jami tannarx</div>
                      <div className="text-lg font-bold text-red-600">
                        {profitCalculation.totalCost.toLocaleString()} so'm
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Sof foyda</div>
                      <div className="text-lg font-bold text-green-600">
                        {profitCalculation.netProfit.toLocaleString()} so'm
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Komissiya ({profitCalculation.commissionRate}%)</div>
                      <div className="text-lg font-bold text-purple-600">
                        {profitCalculation.commission.toLocaleString()} so'm
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">Foyda foizi:</span>
                      <span className="text-lg font-bold text-green-600">
                        {profitCalculation.totalRevenue > 0 
                          ? ((profitCalculation.netProfit / profitCalculation.totalRevenue) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Images */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center">
                    <Upload className="w-4 h-4 mr-2" />
                    Mahsulot rasmlari
                  </h4>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload">
                      <Button type="button" variant="outline" className="cursor-pointer">
                        Rasmlarni tanlash
                      </Button>
                    </label>
                    <p className="text-xs text-slate-500 mt-2">
                      Mahsulotning turli burchaklardan olingan rasmlari
                    </p>
                  </div>
                  
                  {uploadedImages.length > 0 && (
                    <div className="space-y-2">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="text-sm">{image}</span>
                          <Badge variant="secondary">Yuklandi</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Documents */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Mahsulot hujjatlari (ixtiyoriy)
                  </h4>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={handleDocumentUpload}
                      className="hidden"
                      id="document-upload"
                    />
                    <label htmlFor="document-upload">
                      <Button type="button" variant="outline" className="cursor-pointer">
                        Hujjatlarni tanlash
                      </Button>
                    </label>
                    <p className="text-xs text-slate-500 mt-2">
                      Sertifikatlar, texnik pasportlar, boshqa hujjatlar
                    </p>
                  </div>
                  
                  {uploadedDocuments.length > 0 && (
                    <div className="space-y-2">
                      {uploadedDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="text-sm">{doc}</span>
                          <Badge variant="secondary">Yuklandi</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Information Alert */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Fulfillment jarayoni:</strong> Mahsulot qabul qilingandan so'ng, 
                  u MySklad tizimiga kiritiladi va marketplace'larda sotuvga tayyorlanadi. 
                  Admin tomonidan tasdiqlangandan so'ng sizning dashboard'ingizda ko'rinadi.
                </AlertDescription>
              </Alert>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setLocation('/partner-dashboard')}>
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Yuborilmoqda..." : "Fulfillment so'rovini yuborish"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
