import { db } from "./db";
import { users, partners, pricingTiers, sptCosts, commissionSettings, marketplaceApiConfigs, fulfillmentRequests } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { seedSystemSettings } from "./storage";

async function seedData() {
  try {
    console.log("Seeding data...");

    // Check if admin user already exists
    let admin = await db.select().from(users).where(eq(users.username, "admin")).then(rows => rows[0]);
    
    if (!admin) {
      // Create admin user with secure credentials
      const adminPassword = await bcrypt.hash("BiznesYordam2024!", 10);
      [admin] = await db.insert(users).values({
        username: "admin",
        email: "admin@biznesyordam.uz",
        password: adminPassword,
        firstName: "Bosh",
        lastName: "Admin",
        phone: "+998901234567",
        role: "admin",
        isActive: true,
      }).returning();
      console.log("✅ Admin user created successfully!");
      console.log("🔑 Admin Login Credentials:");
      console.log("   Username: admin");
      console.log("   Password: BiznesYordam2024!");
      console.log("   Email: admin@biznesyordam.uz");
    } else {
      console.log("✅ Admin user already exists");
      console.log("🔑 Admin Login Credentials:");
      console.log("   Username: admin");
      console.log("   Password: BiznesYordam2024!");
      console.log("   Email: admin@biznesyordam.uz");
    }

    // Check if partner user already exists
    let partnerUser = await db.select().from(users).where(eq(users.username, "testpartner")).then(rows => rows[0]);
    
    if (!partnerUser) {
      // Create test partner user
      const partnerPassword = await bcrypt.hash("Partner2024!", 10);
      [partnerUser] = await db.insert(users).values({
        username: "testpartner",
        email: "partner@biznesyordam.uz",
        password: partnerPassword,
        firstName: "Test",
        lastName: "Partner",
        phone: "+998901234567",
        role: "partner",
        isActive: true,
      }).returning();
      console.log("✅ Partner user created successfully!");
      console.log("🔑 Partner Login Credentials:");
      console.log("   Username: testpartner");
      console.log("   Password: Partner2024!");
      console.log("   Email: partner@biznesyordam.uz");
    } else {
      console.log("✅ Partner user already exists");
      console.log("🔑 Partner Login Credentials:");
      console.log("   Username: testpartner");
      console.log("   Password: Partner2024!");
      console.log("   Email: partner@biznesyordam.uz");
    }

    // Check if partner profile already exists
    let partner = await db.select().from(partners).where(eq(partners.userId, partnerUser.id)).then(rows => rows[0]);
    
    if (!partner) {
      // Create partner profile
      [partner] = await db.insert(partners).values({
        userId: partnerUser.id,
        businessName: "Test Biznes",
        businessCategory: "electronics",
        monthlyRevenue: "25000000",
        pricingTier: "business_standard",
        commissionRate: "0.20",
        isApproved: true,
        approvedBy: admin.id,
        approvedAt: new Date(),
      }).returning();
      console.log("Partner profile created");
    } else {
      console.log("Partner profile already exists");
    }

    // Create sample fulfillment requests - temporarily disabled for SQLite compatibility
    console.log("Sample fulfillment requests handled by mockDb.ts");

    // Create sample marketplace integrations
    const existingIntegrations = await db.select().from(marketplaceApiConfigs);
    if (existingIntegrations.length === 0) {
      await db.insert(marketplaceApiConfigs).values([
        {
          partnerId: partner.id,
          marketplace: "uzum",
          apiKey: "uzum_api_key_123",
          apiSecret: "uzum_secret_456",
          shopId: "uzum_shop_001",
          status: "connected",
          lastSync: new Date(),
        },
        {
          partnerId: partner.id,
          marketplace: "wildberries",
          apiKey: "wb_api_key_789",
          apiSecret: "wb_secret_012",
          shopId: "wb_shop_002",
          status: "disconnected",
          lastSync: null,
        }
      ]);
      console.log("Sample marketplace integrations created");
    }

    // Check if pricing tiers exist
    const existingTiers = await db.select().from(pricingTiers);
    
    if (existingTiers.length === 0) {
      // Create pricing tiers - ORIGINAL/CORRECT TIERS
      const pricingTiersData = [
      {
        tier: "starter_pro",
        nameUz: "Starter Pro",
        fixedCost: "0",
        commissionMin: "0.30",
        commissionMax: "0.45",
        minRevenue: "0",
        maxRevenue: "50000000",
        features: JSON.stringify([
          "45-30% komissiya",
          "50 mahsulotgacha",
          "Asosiy analytics",
          "Email qo'llab-quvvatlash",
          "Risksiz tarif"
        ]),
      },
      {
        tier: "business_standard",
        nameUz: "Business Standard",
        fixedCost: "4500000",
        commissionMin: "0.18",
        commissionMax: "0.25",
        minRevenue: "10000000",
        maxRevenue: "200000000",
        features: JSON.stringify([
          "25-18% komissiya",
          "Cheksiz mahsulot",
          "Kengaytirilgan analytics",
          "Dedicated manager",
          "Sof Foyda Dashboard",
          "Trend Hunter"
        ]),
      },
      {
        tier: "professional_plus",
        nameUz: "Professional Plus",
        fixedCost: "8500000",
        commissionMin: "0.15",
        commissionMax: "0.20",
        minRevenue: "50000000",
        maxRevenue: "500000000",
        features: JSON.stringify([
          "20-15% komissiya",
          "Premium fulfillment",
          "Barcha marketplace",
          "24/7 qo'llab-quvvatlash",
          "Custom analytics",
          "Marketing va PR qo'llab-quvvatlash",
          "Fotosurat va video xizmatlari"
        ]),
      },
      {
        tier: "enterprise_elite",
        nameUz: "Enterprise Elite",
        fixedCost: "0", // Kelishuv asosida
        commissionMin: "0.12",
        commissionMax: "0.18",
        minRevenue: "100000000",
        maxRevenue: null,
        features: JSON.stringify([
          "18-12% komissiya",
          "VIP fulfillment xizmat",
          "Maxsus integratsiyalar",
          "Shaxsiy manager",
          "Kelishuv asosida narx",
          "Cheksiz aylanma",
          "Custom solutions",
          "API integratsiyalar",
          "Yuridik maslahatlar"
        ]),
      }
    ];

      await db.insert(pricingTiers).values(pricingTiersData);
      console.log("Pricing tiers created");
    } else {
      console.log("Pricing tiers already exist");
    }

    // Create sample SPT costs
    const existingSptCosts = await db.select().from(sptCosts);
    if (existingSptCosts.length === 0) {
      await db.insert(sptCosts).values([
        {
          category: "electronics",
          marketplace: "uzum",
          weightMin: 0,
          weightMax: 1,
          cost: "15000",
          deliveryTime: "2-3 kun",
        },
        {
          category: "electronics",
          marketplace: "uzum",
          weightMin: 1,
          weightMax: 5,
          cost: "25000",
          deliveryTime: "3-4 kun",
        },
        {
          category: "clothing",
          marketplace: "wildberries",
          weightMin: 0,
          weightMax: 1,
          cost: "12000",
          deliveryTime: "5-7 kun",
        },
        {
          category: "home",
          marketplace: "yandex",
          weightMin: 0,
          weightMax: 10,
          cost: "35000",
          deliveryTime: "7-10 kun",
        }
      ]);
      console.log("Sample SPT costs created");
    }

    // Create sample commission settings
    const existingCommissions = await db.select().from(commissionSettings);
    if (existingCommissions.length === 0) {
      await db.insert(commissionSettings).values([
        {
          partnerId: partner.id,
          category: "electronics",
          marketplace: "uzum",
          commissionRate: "0.20",
          isActive: true,
        },
        {
          partnerId: partner.id,
          category: "clothing",
          marketplace: "wildberries",
          commissionRate: "0.25",
          isActive: true,
        }
      ]);
      console.log("Sample commission settings created");
    }

    // Seed system settings
    await seedSystemSettings();

    console.log("Data seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  }
}

// Run seeding
seedData().catch(console.error);
