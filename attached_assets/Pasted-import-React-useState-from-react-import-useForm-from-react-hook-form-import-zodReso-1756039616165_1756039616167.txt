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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  FileText, 
  Package, 
  CreditCard, 
  CheckCircle, 
  ArrowLeft,
  Upload,
  AlertCircle,
  Info,
  Calculator,
  Target
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { PRICING_TIERS } from '@shared/schema';

const activationSchema = z.object({
  // Legal Information
  companyName: z.string().min(2, "Kompaniya nomi kamida 2 ta belgi bo'lishi kerak"),
  legalForm: z.enum(["LLC", "JSC", "IP", "other"]),
  taxId: z.string().min(9, "STIR raqami noto'g'ri"),
  bankAccount: z.string().min(20, "Bank hisob raqami noto'g'ri"),
  bankName: z.string().min(2, "Bank nomi kamida 2 ta belgi bo'lishi kerak"),
  mfo: z.string().min(5, "MFO raqami noto'g'ri"),
  legalAddress: z.string().min(10, "Yuridik manzil kamida 10 ta belgi bo'lishi kerak"),
  
  // Product Information
  productName: z.string().min(2, "Mahsulot nomi kamida 2 ta belgi bo'lishi kerak"),
  productDescription: z.string().min(10, "Mahsulot tavsifi kamida 10 ta belgi bo'lishi kerak"),
  productCategory: z.string().min(1, "Mahsulot toifasini tanlang"),
  expectedQuantity: z.number().min(1, "Mahsulot soni kamida 1 bo'lishi kerak"),
  estimatedPrice: z.number().min(1000, "Taxminiy narx kamida 1000 so'm bo'lishi kerak"),
  supplierInfo: z.string().min(5, "Yetkazib beruvchi ma'lumoti kamida 5 ta belgi bo'lishi kerak"),
  
  // Tier Selection
  chosenTier: z.enum(["basic", "professional", "professional_plus", "enterprise"]),
  
  // Documents
  companyDocuments: z.array(z.string()).min(1, "Kamida 1 ta hujjat yuklashingiz kerak"),
});

type ActivationForm = z.infer<typeof activationSchema>;

export default function PartnerActivation() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<"basic" | "professional" | "professional_plus" | "enterprise">("basic");
  const { toast } = useToast();

  const form = useForm<ActivationForm>({
    resolver: zodResolver(activationSchema),
    defaultValues: {
      companyName: "",
      legalForm: "LLC",
      taxId: "",
      bankAccount: "",
      bankName: "",
      mfo: "",
      legalAddress: "",
      productName: "",
      productDescription: "",
      productCategory: "",
      expectedQuantity: 1,
      estimatedPrice: 0,
      supplierInfo: "",
      chosenTier: "basic",
      companyDocuments: [],
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileNames = Array.from(files).map(file => file.name);
      setUploadedFiles(prev => [...prev, ...fileNames]);
      form.setValue('companyDocuments', [...form.getValues('companyDocuments'), ...fileNames]);
    }
  };

  const handleTierSelection = (tier: "basic" | "professional" | "professional_plus" | "enterprise") => {
    setSelectedTier(tier);
    form.setValue('chosenTier', tier);
  };

  const calculateCommission = (estimatedPrice: number, quantity: number) => {
    const totalRevenue = estimatedPrice * quantity;
    const tier = PRICING_TIERS[selectedTier];
    
    // Calculate commission based on tier
    let commissionRate = 0;
    for (const commissionTier of tier.commissionTiers) {
      if (totalRevenue <= commissionTier.threshold) {
        commissionRate = commissionTier.rate;
        break;
      }
    }
    
    return {
      rate: commissionRate,
      amount: (totalRevenue * commissionRate) / 100,
      totalRevenue,
      fixedPayment: tier.fixedPayment,
      sptCost: tier.sptCost * quantity
    };
  };

  const onSubmit = async (data: ActivationForm) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/partner-activation-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Aktivatsiya so'rovi yuborildi",
          description: "Admin ko'rib chiqishini kuting. SMS orqali xabar beramiz.",
        });
        setLocation('/partner-dashboard');
      } else {
        const errorData = await response.json();
        toast({
          title: "Xatolik",
          description: errorData.message || "Aktivatsiya so'rovini yuborishda xatolik",
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

  const steps = [
    { id: 1, title: "Yuridik ma'lumotlar", icon: Building2 },
    { id: 2, title: "Mahsulot ma'lumotlari", icon: Package },
    { id: 3, title: "Tarif tanlash", icon: CreditCard },
    { id: 4, title: "Hujjatlar", icon: FileText },
  ];

  const currentCalculation = calculateCommission(
    form.watch('estimatedPrice') || 0,
    form.watch('expectedQuantity') || 1
  );

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
          
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Hamkor Profilini Aktivlashtirish</CardTitle>
          <CardDescription className="text-slate-600">
            Fulfillment xizmatiga to'liq kirish uchun ma'lumotlarni to'ldiring
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.id 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-slate-300 text-slate-400'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-slate-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <Progress value={(currentStep / steps.length) * 100} className="h-2" />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={currentStep.toString()} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  {steps.map((step) => (
                    <TabsTrigger 
                      key={step.id} 
                      value={step.id.toString()}
                      disabled={currentStep < step.id}
                      onClick={() => setCurrentStep(step.id)}
                    >
                      {step.title}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Step 1: Legal Information */}
                <TabsContent value="1" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kompaniya nomi</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="OOO 'Biznes Nomi'" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="legalForm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Yuridik shakli</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Yuridik shaklni tanlang" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="LLC">OOO</SelectItem>
                              <SelectItem value="JSC">AJ</SelectItem>
                              <SelectItem value="IP">Yakka tartibdagi tadbirkor</SelectItem>
                              <SelectItem value="other">Boshqa</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>STIR raqami</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123456789" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bankAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank hisob raqami</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="20208000123456789012" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank nomi</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="NBU" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>MFO raqami</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="00014" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="legalAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yuridik manzil</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="To'liq yuridik manzil" rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="button" onClick={() => setCurrentStep(2)}>
                      Keyingi qadam
                    </Button>
                  </div>
                </TabsContent>

                {/* Step 2: Product Information */}
                <TabsContent value="2" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="productName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mahsulot nomi</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="iPhone 15 Pro" />
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
                          <FormLabel>Kutilayotgan miqdori</FormLabel>
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
                      name="estimatedPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Taxminiy narxi (so'm)</FormLabel>
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
                  </div>

                  <FormField
                    control={form.control}
                    name="productDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mahsulot tavsifi</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Mahsulot haqida batafsil ma'lumot" rows={4} />
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
                          <Textarea {...field} placeholder="Yetkazib beruvchi kompaniya va aloqa ma'lumotlari" rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                      Orqaga
                    </Button>
                    <Button type="button" onClick={() => setCurrentStep(3)}>
                      Keyingi qadam
                    </Button>
                  </div>
                </TabsContent>

                {/* Step 3: Tier Selection */}
                <TabsContent value="3" className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">Tarif rejangini tanlang</h3>
                    <p className="text-slate-600">Sizning mahsulotlaringiz uchun eng mos tarifni tanlang</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(PRICING_TIERS).map(([key, tier]) => (
                      <Card 
                        key={key}
                        className={`cursor-pointer transition-all ${
                          selectedTier === key 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => handleTierSelection(key as any)}
                      >
                        <CardHeader className="text-center">
                          <CardTitle className="text-lg">{tier.name}</CardTitle>
                          <CardDescription>{tier.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {tier.fixedPayment === 0 ? 'Bepul' : `${tier.fixedPayment.toLocaleString()} so'm`}
                            </div>
                            <div className="text-sm text-slate-600">fiksa to'lov</div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Komissiya:</span>
                              <span className="font-medium">{tier.commissionTiers[0].rate}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>SPT narxi:</span>
                              <span className="font-medium">{tier.sptCost.toLocaleString()} so'm</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>So'rovlar:</span>
                              <span className="font-medium">
                                {tier.maxProductRequests === -1 ? 'Cheksiz' : tier.maxProductRequests}
                              </span>
                            </div>
                          </div>

                          {selectedTier === key && (
                            <div className="flex items-center justify-center text-blue-600">
                              <CheckCircle className="w-5 h-5 mr-2" />
                              <span className="font-medium">Tanlangan</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Commission Calculation */}
                  <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Calculator className="w-5 h-5 mr-2" />
                        Komissiya hisoboti
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-sm text-slate-600">Jami savdo</div>
                          <div className="text-lg font-bold text-blue-600">
                            {currentCalculation.totalRevenue.toLocaleString()} so'm
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-600">Komissiya</div>
                          <div className="text-lg font-bold text-purple-600">
                            {currentCalculation.rate}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-600">Komissiya summa</div>
                          <div className="text-lg font-bold text-green-600">
                            {currentCalculation.amount.toLocaleString()} so'm
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-600">SPT xarajati</div>
                          <div className="text-lg font-bold text-orange-600">
                            {currentCalculation.sptCost.toLocaleString()} so'm
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                      Orqaga
                    </Button>
                    <Button type="button" onClick={() => setCurrentStep(4)}>
                      Keyingi qadam
                    </Button>
                  </div>
                </TabsContent>

                {/* Step 4: Documents */}
                <TabsContent value="4" className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">Hujjatlarni yuklang</h3>
                    <p className="text-slate-600">Fulfillment xizmatiga kirish uchun kerakli hujjatlarni yuklang</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600 mb-2">Hujjatlarni yuklang</p>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload">
                          <Button type="button" variant="outline" className="cursor-pointer">
                            Fayllarni tanlash
                          </Button>
                        </label>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Kerakli hujjatlar:</h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li>• Kompaniya ro'yxatdan o'tish guvohnomasi</li>
                          <li>• STIR guvohnomasi</li>
                          <li>• Bank hisob varaqasi</li>
                          <li>• Direktor buyruq nusxasi</li>
                          <li>• Mahsulot sertifikatlari (agar kerak bo'lsa)</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Yuklangan hujjatlar:</h4>
                      {uploadedFiles.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                          <p>Hali hech qanday hujjat yuklanmagan</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 text-slate-400 mr-2" />
                                <span className="text-sm">{file}</span>
                              </div>
                              <Badge variant="secondary">Yuklandi</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Barcha hujjatlar PDF, DOC yoki rasm formatida bo'lishi kerak. 
                      Hujjatlar xavfsizlik maqsadida shifrlanadi va faqat admin tomonidan ko'riladi.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>
                      Orqaga
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Yuborilmoqda..." : "Aktivatsiya so'rovini yuborish"}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
