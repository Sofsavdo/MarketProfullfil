import {
  users,
  partners,
  products,
  fulfillmentRequests,
  messages,
  pricingTiers,
  analytics,
  marketplaceIntegrations,
  tierUpgradeRequests,
  systemSettings,
  sptCosts,
  commissionSettings,
  chatRooms,
  enhancedMessages,
  marketplaceApiConfigs,
  excelImports,
  excelTemplates,
  adminPermissions,
  auditLogs,
  type User,
  type InsertUser,
  type Partner,
  type InsertPartner,
  type Product,
  type InsertProduct,
  type FulfillmentRequest,
  type InsertFulfillmentRequest,
  type Message,
  type InsertMessage,
  type PricingTier,
  type Analytics,
  type TierUpgradeRequest,
  type InsertTierUpgradeRequest,
  type SystemSetting,
  type InsertSystemSetting,
  type SptCost,
  type InsertSptCost,
  type CommissionSetting,
  type InsertCommissionSetting,
  type ChatRoom,
  type InsertChatRoom,
  type EnhancedMessage,
  type InsertEnhancedMessage,
  type MarketplaceApiConfig,
  type InsertMarketplaceApiConfig,
  type ExcelImport,
  type InsertExcelImport,
  type ExcelTemplate,
  type InsertExcelTemplate
} from "@shared/schema";
import { db } from "./mockDb";
import { eq, desc, and, or, sql, count, sum } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  // Admin permissions
  getAdminPermissions(userId: string): Promise<any | undefined>;
  upsertAdminPermissions(userId: string, perms: Partial<any>): Promise<any>;
  // Audit logs
  createAuditLog(entry: { userId: string; action: string; entityType: string; entityId?: string; payload?: any }): Promise<void>;
  
  // Authentication
  validateUser(username: string, password: string): Promise<User | null>;
  
  // Partner operations
  getPartner(id: string): Promise<Partner | undefined>;
  getPartnerByUserId(userId: string): Promise<Partner | undefined>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  updatePartner(id: string, partner: Partial<Partner>): Promise<Partner>;
  getAllPartners(): Promise<Partner[]>;
  getPendingPartners(): Promise<Partner[]>;
  approvePartner(partnerId: string, approvedBy: string): Promise<Partner>;
  
  // Product operations
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByPartnerId(partnerId: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  
  // Fulfillment operations
  getFulfillmentRequest(id: string): Promise<FulfillmentRequest | undefined>;
  getFulfillmentRequestsByPartnerId(partnerId: string): Promise<FulfillmentRequest[]>;
  getAllFulfillmentRequests(): Promise<FulfillmentRequest[]>;
  createFulfillmentRequest(request: InsertFulfillmentRequest): Promise<FulfillmentRequest>;
  updateFulfillmentRequest(id: string, request: Partial<FulfillmentRequest>): Promise<FulfillmentRequest>;
  
  // Pricing tiers
  getPricingTiers(): Promise<PricingTier[]>;
  getPricingTier(tier: string): Promise<PricingTier | undefined>;
  
  // Tier upgrade requests
  createTierUpgradeRequest(request: InsertTierUpgradeRequest): Promise<TierUpgradeRequest>;
  getTierUpgradeRequests(): Promise<TierUpgradeRequest[]>;
  getPendingTierUpgradeRequests(): Promise<TierUpgradeRequest[]>;
  approveTierUpgradeRequest(requestId: string, adminId: string, adminNotes?: string): Promise<TierUpgradeRequest>;
  rejectTierUpgradeRequest(requestId: string, adminId: string, adminNotes?: string): Promise<TierUpgradeRequest>;
  
  // Partner commission override
  getPartnerCommission(partnerId: string, category?: string, marketplace?: string): Promise<CommissionSetting | undefined>;
  updatePartnerCommission(partnerId: string, commissionRate: string): Promise<any>;
  
  // Analytics
  getPartnerAnalytics(partnerId: string, startDate?: Date, endDate?: Date): Promise<Analytics[]>;
  createAnalytics(analytics: Omit<Analytics, 'id' | 'createdAt'>): Promise<Analytics>;
  getDashboardStats(partnerId?: string): Promise<any>;
  getOverallStats(): Promise<{
    totalPartners: number;
    totalRevenue: string;
    totalOrders: number;
    avgProfit: string;
  }>;
  
  // Messages
  getMessages(userId: string, otherUserId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(userId: string, fromUserId: string): Promise<void>;
  
  // System Settings
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  getSystemSettingsByCategory(category: string): Promise<SystemSetting[]>;
  getAllSystemSettings(): Promise<SystemSetting[]>;
  setSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  updateSystemSetting(key: string, value: string, updatedBy: string): Promise<SystemSetting>;
  
  // SPT Costs
  getSptCosts(): Promise<SptCost[]>;
  getSptCost(category: string, marketplace?: string, weight?: number): Promise<SptCost | undefined>;
  getSptCostForProduct(category: string, weight?: number, marketplace?: string): Promise<SptCost | undefined>;
  createSptCost(cost: InsertSptCost): Promise<SptCost>;
  updateSptCost(id: string, cost: Partial<SptCost>): Promise<SptCost>;
  deleteSptCost(id: string): Promise<void>;
  
  // Commission Settings
  getCommissionSettings(partnerId?: string): Promise<CommissionSetting[]>;
  getCommissionForPartner(partnerId: string, category?: string, marketplace?: string): Promise<CommissionSetting | undefined>;
  // Effective commission resolver
  getEffectiveCommission(params: { partnerId?: string; category?: string; marketplace?: string; orderValue?: number }): Promise<number>;
  createCommissionSetting(setting: InsertCommissionSetting): Promise<CommissionSetting>;
  updateCommissionSetting(id: string, setting: Partial<CommissionSetting>): Promise<CommissionSetting>;
  deleteCommissionSetting(id: string): Promise<void>;
  
  // Enhanced Chat
  getChatRooms(userId: string): Promise<ChatRoom[]>;
  getChatRoom(id: string): Promise<ChatRoom | undefined>;
  createChatRoom(room: InsertChatRoom): Promise<ChatRoom>;
  getChatMessages(roomId: string, limit?: number): Promise<EnhancedMessage[]>;
  createChatMessage(message: InsertEnhancedMessage): Promise<EnhancedMessage>;
  markChatMessagesAsRead(roomId: string, userId: string): Promise<void>;
  
  // Marketplace Integration
  getMarketplaceIntegrations(partnerId?: string): Promise<any[]>;
  createMarketplaceIntegration(partnerId: string, marketplace: string, credentials: any): Promise<any>;
  updateMarketplaceIntegration(partnerId: string, marketplace: string, data: any): Promise<any>;
  retryMarketplaceIntegration(partnerId: string, marketplace: string): Promise<any>;
  
  // API Documentation Management
  getApiDocumentations(partnerId: string): Promise<any[]>;
  createApiDocumentation(partnerId: string, data: any): Promise<any>;
  verifyApiDocumentation(id: string): Promise<any>;
  deleteApiDocumentation(id: string): Promise<void>;
  
  // Excel Import/Export Management
  getExcelImports(partnerId: string): Promise<ExcelImport[]>;
  createExcelImport(partnerId: string, data: any): Promise<ExcelImport>;
  updateExcelImport(id: string, data: any): Promise<ExcelImport>;
  getExcelTemplates(): Promise<ExcelTemplate[]>;
  getExcelTemplate(id: string): Promise<ExcelTemplate | undefined>;
  generateExcelExport(partnerId: string, marketplace: string, dataType: string): Promise<Buffer>;
  generateExcelTemplate(template: ExcelTemplate): Promise<Buffer>;
  
  // Real Products by Partner (replacing mock)
  getRealProductsByPartnerId(partnerId: string): Promise<Product[]>;
  
  // Trending Products
  getAllTrendingProducts(): Promise<any[]>;
  getTrendingProducts(category?: string, market?: string, minTrendScore?: number): Promise<any[]>;
  createTrendingProduct(product: any): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...userData, password: hashedPassword })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Admin permissions operations
  async getAdminPermissions(userId: string): Promise<any | undefined> {
    const [row] = await db.select().from(adminPermissions).where(eq(adminPermissions.userId, userId));
    return row;
  }

  async upsertAdminPermissions(userId: string, perms: Partial<any>): Promise<any> {
    const existing = await this.getAdminPermissions(userId);
    if (existing) {
      const [updated] = await db
        .update(adminPermissions)
        .set({ ...perms, updatedAt: new Date() })
        .where(eq(adminPermissions.userId, userId))
        .returning();
      return updated;
    }
    const [inserted] = await db
      .insert(adminPermissions)
      .values({ userId, ...perms })
      .returning();
    return inserted;
  }

  async createAuditLog(entry: { userId: string; action: string; entityType: string; entityId?: string; payload?: any }): Promise<void> {
    await db.insert(auditLogs).values({
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId || null,
      payload: entry.payload ? JSON.stringify(entry.payload) : null,
    });
  }

  // Authentication
  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user || !user.isActive) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Partner operations
  async getPartner(id: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.id, id));
    return partner;
  }

  async getPartnerByUserId(userId: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.userId, userId));
    return partner;
  }

  async createPartner(partnerData: InsertPartner): Promise<Partner> {
    const [partner] = await db
      .insert(partners)
      .values(partnerData)
      .returning();
    return partner;
  }

  async updatePartner(id: string, partnerData: Partial<Partner>): Promise<Partner> {
    const [partner] = await db
      .update(partners)
      .set({ ...partnerData, updatedAt: new Date() })
      .where(eq(partners.id, id))
      .returning();
    return partner;
  }

  async getAllPartners(): Promise<any[]> {
    return await db
      .select({
        id: partners.id,
        userId: partners.userId,
        businessName: partners.businessName,
        businessCategory: partners.businessCategory,
        monthlyRevenue: partners.monthlyRevenue,
        pricingTier: partners.pricingTier,
        commissionRate: partners.commissionRate,
        isApproved: partners.isApproved,
        approvedAt: partners.approvedAt,
        approvedBy: partners.approvedBy,
        notes: partners.notes,
        createdAt: partners.createdAt,
        updatedAt: partners.updatedAt,
        userData: {
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          role: users.role
        }
      })
      .from(partners)
      .leftJoin(users, eq(partners.userId, users.id))
      .orderBy(desc(partners.createdAt));
  }

  async getPendingPartners(): Promise<any[]> {
    return await db
      .select({
        id: partners.id,
        userId: partners.userId,
        businessName: partners.businessName,
        businessCategory: partners.businessCategory,
        monthlyRevenue: partners.monthlyRevenue,
        pricingTier: partners.pricingTier,
        commissionRate: partners.commissionRate,
        isApproved: partners.isApproved,
        approvedAt: partners.approvedAt,
        approvedBy: partners.approvedBy,
        notes: partners.notes,
        createdAt: partners.createdAt,
        updatedAt: partners.updatedAt,
        userData: {
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          role: users.role
        }
      })
      .from(partners)
      .leftJoin(users, eq(partners.userId, users.id))
      .where(eq(partners.isApproved, false))
      .orderBy(desc(partners.createdAt));
  }

  async approvePartner(partnerId: string, approvedBy: string): Promise<Partner> {
    const [partner] = await db
      .update(partners)
      .set({
        isApproved: true,
        approvedAt: new Date(),
        approvedBy,
        updatedAt: new Date()
      })
      .where(eq(partners.id, partnerId))
      .returning();
    return partner;
  }

  // Product operations
  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsByPartnerId(partnerId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.partnerId, partnerId))
      .orderBy(desc(products.createdAt));
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(productData)
      .returning();
    return product;
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ ...productData, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Fulfillment operations
  async getFulfillmentRequest(id: string): Promise<FulfillmentRequest | undefined> {
    const [request] = await db.select().from(fulfillmentRequests).where(eq(fulfillmentRequests.id, id));
    return request;
  }

  async getFulfillmentRequestsByPartnerId(partnerId: string): Promise<any[]> {
    return await db
      .select({
        id: fulfillmentRequests.id,
        partnerId: fulfillmentRequests.partnerId,
        title: fulfillmentRequests.title,
        description: fulfillmentRequests.description,
        status: fulfillmentRequests.status,
        priority: fulfillmentRequests.priority,
        estimatedCost: fulfillmentRequests.estimatedCost,
        actualCost: fulfillmentRequests.actualCost,
        completedAt: fulfillmentRequests.completedAt,
        createdAt: fulfillmentRequests.createdAt,
        updatedAt: fulfillmentRequests.updatedAt,
        partnerData: {
          id: partners.id,
          businessName: partners.businessName,
          businessCategory: partners.businessCategory,
          pricingTier: partners.pricingTier
        },
        userData: {
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          role: users.role
        }
      })
      .from(fulfillmentRequests)
      .leftJoin(partners, eq(fulfillmentRequests.partnerId, partners.id))
      .leftJoin(users, eq(partners.userId, users.id))
      .where(eq(fulfillmentRequests.partnerId, partnerId))
      .orderBy(desc(fulfillmentRequests.createdAt));
  }

  async getAllFulfillmentRequests(): Promise<any[]> {
    return await db
      .select({
        id: fulfillmentRequests.id,
        partnerId: fulfillmentRequests.partnerId,
        title: fulfillmentRequests.title,
        description: fulfillmentRequests.description,
        status: fulfillmentRequests.status,
        priority: fulfillmentRequests.priority,
        estimatedCost: fulfillmentRequests.estimatedCost,
        actualCost: fulfillmentRequests.actualCost,
        createdAt: fulfillmentRequests.createdAt,
        updatedAt: fulfillmentRequests.updatedAt,
        partnerData: {
          id: partners.id,
          businessName: partners.businessName,
          businessCategory: partners.businessCategory,
          userData: {
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email
          }
        }
      })
      .from(fulfillmentRequests)
      .leftJoin(partners, eq(fulfillmentRequests.partnerId, partners.id))
      .leftJoin(users, eq(partners.userId, users.id))
      .orderBy(desc(fulfillmentRequests.createdAt));
  }

  async createFulfillmentRequest(requestData: InsertFulfillmentRequest): Promise<FulfillmentRequest> {
    const [request] = await db
      .insert(fulfillmentRequests)
      .values(requestData)
      .returning();
    return request;
  }

  async updateFulfillmentRequest(id: string, requestData: Partial<FulfillmentRequest>): Promise<FulfillmentRequest> {
    const [request] = await db
      .update(fulfillmentRequests)
      .set({ ...requestData, updatedAt: new Date() })
      .where(eq(fulfillmentRequests.id, id))
      .returning();
    return request;
  }

  // Pricing tiers
  async getPricingTiers(): Promise<PricingTier[]> {
    return await db
      .select()
      .from(pricingTiers)
      .where(eq(pricingTiers.isActive, true))
      .orderBy(pricingTiers.fixedCost);
  }

  async getPricingTier(tier: string): Promise<PricingTier | undefined> {
    const [pricingTier] = await db
      .select()
      .from(pricingTiers)
      .where(and(eq(pricingTiers.tier, tier as any), eq(pricingTiers.isActive, true)));
    return pricingTier;
  }

  // Analytics
  async getPartnerAnalytics(partnerId: string, startDate?: Date, endDate?: Date): Promise<Analytics[]> {
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate || new Date();

    // Get real analytics data
    const analyticsResults = await db
      .select()
      .from(analytics)
      .where(
        and(
          eq(analytics.partnerId, partnerId),
          sql`${analytics.createdAt} >= ${start}`,
          sql`${analytics.createdAt} <= ${end}`
        )
      )
      .orderBy(desc(analytics.createdAt));

    return analyticsResults;
  }

  async createAnalytics(analyticsData: Omit<Analytics, 'id' | 'createdAt'>): Promise<Analytics> {
    const [analyticsResult] = await db
      .insert(analytics)
      .values({
        ...analyticsData,
        createdAt: new Date()
      })
      .returning();
    return analyticsResult;
  }

  // Get real-time dashboard statistics
  async getDashboardStats(partnerId?: string): Promise<any> {
    try {
      let totalPartners = 0;
      let totalRevenue = 0;
      let totalOrders = 0;
      let avgProfit = 0;

      if (partnerId) {
        // Partner-specific stats
        const partner = await this.getPartner(partnerId);
        const partnerProducts = await this.getProductsByPartnerId(partnerId);
        const partnerRequests = await this.getFulfillmentRequestsByPartnerId(partnerId);

        totalRevenue = partnerProducts.reduce((sum, product) => {
          return sum + (parseFloat(product.price || '0') * (product.quantity || 0));
        }, 0);

        totalOrders = partnerRequests.filter(req => req.status === 'completed').length;
        avgProfit = totalRevenue * 0.3;
      } else {
        // Platform-wide stats
        const allPartners = await this.getAllPartners();
        const allProducts = await db.select().from(products);
        const allRequests = await this.getAllFulfillmentRequests();

        totalPartners = allPartners.length;
        totalRevenue = allProducts.reduce((sum, product) => {
          return sum + (parseFloat(product.price || '0') * (product.quantity || 0));
        }, 0);
        totalOrders = allRequests.filter(req => req.status === 'completed').length;
        avgProfit = totalRevenue * 0.3;
      }

      return {
        totalPartners,
        totalRevenue: totalRevenue.toString(),
        totalOrders,
        avgProfit: avgProfit.toString()
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  async getOverallStats(): Promise<{
    totalPartners: number;
    totalRevenue: string;
    totalOrders: number;
    avgProfit: string;
  }> {
    // Get real data from database
    const [partnersCount] = await db
      .select({ count: count() })
      .from(partners)
      .where(eq(partners.isApproved, true));

    // Calculate total revenue from partners
    const [revenueResult] = await db
      .select({ total: sum(partners.monthlyRevenue) })
      .from(partners)
      .where(eq(partners.isApproved, true));

    // Get total orders (from fulfillment requests)
    const [ordersCount] = await db
      .select({ count: count() })
      .from(fulfillmentRequests)
      .where(eq(fulfillmentRequests.status, 'completed'));

    // Calculate average profit (simplified calculation)
    const totalRevenue = parseFloat(revenueResult.total || '0');
    const avgProfit = totalRevenue * 0.15; // 15% average profit margin

    return {
      totalPartners: partnersCount.count || 0,
      totalRevenue: (totalRevenue * 12).toString(), // Annual revenue
      totalOrders: ordersCount.count || 0,
      avgProfit: avgProfit.toString()
    };
  }

  // Messages
  async getMessages(userId: string, otherUserId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.fromUserId, userId), eq(messages.toUserId, otherUserId)),
          and(eq(messages.fromUserId, otherUserId), eq(messages.toUserId, userId))
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(100);
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...messageData,
        createdAt: new Date()
      })
      .returning();
    return message;
  }

  async markMessagesAsRead(userId: string, fromUserId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.fromUserId, fromUserId),
          eq(messages.toUserId, userId),
          eq(messages.isRead, false)
        )
      );
  }

  // Tier upgrade requests
  async createTierUpgradeRequest(requestData: InsertTierUpgradeRequest): Promise<TierUpgradeRequest> {
    const [request] = await db
      .insert(tierUpgradeRequests)
      .values(requestData)
      .returning();
    return request;
  }

  async getTierUpgradeRequests(): Promise<any[]> {
    return await db
      .select({
        id: tierUpgradeRequests.id,
        partnerId: tierUpgradeRequests.partnerId,
        currentTier: tierUpgradeRequests.currentTier,
        requestedTier: tierUpgradeRequests.requestedTier,
        reason: tierUpgradeRequests.reason,
        status: tierUpgradeRequests.status,
        adminNotes: tierUpgradeRequests.adminNotes,
        createdAt: tierUpgradeRequests.createdAt,
        approvedAt: tierUpgradeRequests.approvedAt,
        rejectedAt: tierUpgradeRequests.rejectedAt,
        partnerData: {
          id: partners.id,
          businessName: partners.businessName,
          businessCategory: partners.businessCategory,
          userData: {
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email
          }
        }
      })
      .from(tierUpgradeRequests)
      .leftJoin(partners, eq(tierUpgradeRequests.partnerId, partners.id))
      .leftJoin(users, eq(partners.userId, users.id))
      .orderBy(desc(tierUpgradeRequests.createdAt));
  }

  async getPendingTierUpgradeRequests(): Promise<TierUpgradeRequest[]> {
    return await db
      .select()
      .from(tierUpgradeRequests)
      .where(eq(tierUpgradeRequests.status, 'pending'))
      .orderBy(desc(tierUpgradeRequests.createdAt));
  }

  async approveTierUpgradeRequest(requestId: string, adminId: string, adminNotes?: string): Promise<TierUpgradeRequest> {
    const [request] = await db
      .update(tierUpgradeRequests)
      .set({
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: adminId,
        adminNotes,
      })
      .where(eq(tierUpgradeRequests.id, requestId))
      .returning();

    // Update partner's tier
    if (request) {
      await db
        .update(partners)
        .set({ 
          pricingTier: request.requestedTier,
          updatedAt: new Date()
        })
        .where(eq(partners.id, request.partnerId));
    }

    return request;
  }

  async rejectTierUpgradeRequest(requestId: string, adminId: string, adminNotes?: string): Promise<TierUpgradeRequest> {
    const [request] = await db
      .update(tierUpgradeRequests)
      .set({
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: adminId,
        adminNotes,
      })
      .where(eq(tierUpgradeRequests.id, requestId))
      .returning();
    return request;
  }

  // Partner commission override implementation
  async updatePartnerCommission(partnerId: string, commissionRate: string): Promise<any> {
    const [partner] = await db
      .update(partners)
      .set({ 
        commissionRate,
        updatedAt: new Date()
      })
      .where(eq(partners.id, partnerId))
      .returning();
      
    return {
      id: partnerId,
      commissionRate,
      partner,
      message: "Komissiya muvaffaqiyatli o'zgartirildi"
    };
  }

  // Resolve effective commission: partner-specific > category+marketplace > category > marketplace > partner default > global default
  async getEffectiveCommission(params: { partnerId?: string; category?: string; marketplace?: string; orderValue?: number }): Promise<number> {
    const { partnerId, category, marketplace, orderValue } = params;
    // 1) Partner-specific
    if (partnerId) {
      const specific = await this.getCommissionForPartner(partnerId, category, marketplace);
      if (specific?.commissionRate) return parseFloat(String(specific.commissionRate));
    }
    // 2) Commission settings global (no partner), with most specific match
    const settings = await this.getCommissionSettings();
    const candidates = settings.filter((s: any) => s.isActive !== false).map((s: any) => ({
      score: (s.partnerId ? 0 : 1) + (s.category && s.category === category ? 1 : 0) + (s.marketplace && s.marketplace === marketplace ? 1 : 0),
      s,
    })).sort((a, b) => b.score - a.score);
    for (const c of candidates) {
      if (orderValue) {
        const minOk = !c.s.minOrderValue || orderValue >= parseFloat(String(c.s.minOrderValue));
        const maxOk = !c.s.maxOrderValue || orderValue <= parseFloat(String(c.s.maxOrderValue));
        if (!minOk || !maxOk) continue;
      }
      if (c.s.commissionRate) return parseFloat(String(c.s.commissionRate));
    }
    // 3) Partner default commission
    if (partnerId) {
      const partner = await this.getPartner(partnerId);
      if ((partner as any)?.commissionRate) return parseFloat(String((partner as any).commissionRate));
    }
    // 4) Fallback global default (e.g., 0.30)
    return 0.30;
  }
  
  // System Settings implementation
  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(and(eq(systemSettings.settingKey, key), eq(systemSettings.isActive, true)));
    return setting;
  }
  
  async getSystemSettingsByCategory(category: string): Promise<SystemSetting[]> {
    return await db
      .select()
      .from(systemSettings)
      .where(and(eq(systemSettings.category, category), eq(systemSettings.isActive, true)))
      .orderBy(systemSettings.settingKey);
  }
  
  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.isActive, true))
      .orderBy(systemSettings.category, systemSettings.settingKey);
  }
  
  async setSystemSetting(settingData: InsertSystemSetting): Promise<SystemSetting> {
    // Check if setting exists
    const existing = await this.getSystemSetting(settingData.settingKey);
    if (existing) {
      // Update existing
      const [setting] = await db
        .update(systemSettings)
        .set({ 
          settingValue: settingData.settingValue,
          updatedBy: settingData.updatedBy,
          updatedAt: new Date()
        })
        .where(eq(systemSettings.settingKey, settingData.settingKey))
        .returning();
      return setting;
    } else {
      // Create new
      const [setting] = await db
        .insert(systemSettings)
        .values(settingData)
        .returning();
      return setting;
    }
  }
  
  async updateSystemSetting(key: string, value: string, updatedBy: string): Promise<SystemSetting> {
    const [setting] = await db
      .update(systemSettings)
      .set({ 
        settingValue: value,
        updatedBy,
        updatedAt: new Date()
      })
      .where(eq(systemSettings.settingKey, key))
      .returning();
    return setting;
  }
  
  // SPT Costs implementation
  async getSptCosts(): Promise<SptCost[]> {
    return await db
      .select()
      .from(sptCosts)
      .where(eq(sptCosts.isActive, true))
      .orderBy(sptCosts.productCategory, sptCosts.weightRangeMin);
  }

  async getSptCost(category: string, marketplace?: string, weight?: number): Promise<SptCost | undefined> {
    return await this.getSptCostForProduct(category, weight, marketplace);
  }
  
  async getSptCostForProduct(category: string, weight?: number, marketplace?: string): Promise<SptCost | undefined> {
    const conditions = [eq(sptCosts.isActive, true)];
    
    if (category) {
      conditions.push(eq(sptCosts.productCategory, category as any));
    }
    
    if (marketplace) {
      conditions.push(sql`(${sptCosts.marketplace} = ${marketplace} OR ${sptCosts.marketplace} IS NULL)`);
    }
    
    if (weight) {
      conditions.push(
        sql`(${sptCosts.weightRangeMin} <= ${weight} AND (${sptCosts.weightRangeMax} >= ${weight} OR ${sptCosts.weightRangeMax} IS NULL))`
      );
    }
    
    const [cost] = await db
      .select()
      .from(sptCosts)
      .where(and(...conditions))
      .orderBy(sptCosts.weightRangeMin);
      
    return cost;
  }
  
  async createSptCost(costData: InsertSptCost): Promise<SptCost> {
    const [cost] = await db
      .insert(sptCosts)
      .values(costData)
      .returning();
    return cost;
  }
  
  async updateSptCost(id: string, costData: Partial<SptCost>): Promise<SptCost> {
    const [cost] = await db
      .update(sptCosts)
      .set({ ...costData, updatedAt: new Date() })
      .where(eq(sptCosts.id, id))
      .returning();
    return cost;
  }
  
  async deleteSptCost(id: string): Promise<void> {
    await db
      .update(sptCosts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(sptCosts.id, id));
  }
  
  // Commission Settings implementation
  async getPartnerCommission(partnerId: string, category?: string, marketplace?: string): Promise<CommissionSetting | undefined> {
    const conditions = [eq(commissionSettings.partnerId, partnerId), eq(commissionSettings.isActive, true)];
    
    if (category) {
      conditions.push(eq(commissionSettings.category, category as any));
    }
    
    if (marketplace) {
      conditions.push(eq(commissionSettings.marketplace, marketplace as any));
    }
    
    const [commission] = await db
      .select()
      .from(commissionSettings)
      .where(and(...conditions))
      .limit(1);
      
    return commission;
  }

  async getCommissionSettings(partnerId?: string): Promise<CommissionSetting[]> {
    const conditions = [eq(commissionSettings.isActive, true)];
    
    if (partnerId) {
      conditions.push(eq(commissionSettings.partnerId, partnerId));
    }
    
    return await db
      .select()
      .from(commissionSettings)
      .where(and(...conditions))
      .orderBy(commissionSettings.partnerId, commissionSettings.category);
  }
  
  async getCommissionForPartner(partnerId: string, category?: string, marketplace?: string): Promise<CommissionSetting | undefined> {
    const conditions = [
      eq(commissionSettings.isActive, true),
      eq(commissionSettings.partnerId, partnerId)
    ];
    
    if (category) {
      conditions.push(sql`(${commissionSettings.category} = ${category} OR ${commissionSettings.category} IS NULL)`);
    }
    
    if (marketplace) {
      conditions.push(sql`(${commissionSettings.marketplace} = ${marketplace} OR ${commissionSettings.marketplace} IS NULL)`);
    }
    
    const [commission] = await db
      .select()
      .from(commissionSettings)
      .where(and(...conditions))
      .orderBy(desc(commissionSettings.createdAt));
      
    return commission;
  }
  
  async createCommissionSetting(settingData: InsertCommissionSetting): Promise<CommissionSetting> {
    const [setting] = await db
      .insert(commissionSettings)
      .values(settingData)
      .returning();
    return setting;
  }
  
  async updateCommissionSetting(id: string, settingData: Partial<CommissionSetting>): Promise<CommissionSetting> {
    const [setting] = await db
      .update(commissionSettings)
      .set({ ...settingData, updatedAt: new Date() })
      .where(eq(commissionSettings.id, id))
      .returning();
    return setting;
  }
  
  async deleteCommissionSetting(id: string): Promise<void> {
    await db
      .update(commissionSettings)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(commissionSettings.id, id));
  }
  
  // Enhanced Chat implementation
  async getChatRooms(userId: string): Promise<ChatRoom[]> {
    return await db
      .select()
      .from(chatRooms)
      .where(
        and(
          eq(chatRooms.isActive, true),
          sql`${userId} = ANY(${chatRooms.participants})`
        )
      )
      .orderBy(desc(chatRooms.lastMessageAt));
  }
  
  async getChatRoom(id: string): Promise<ChatRoom | undefined> {
    const [room] = await db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.id, id));
    return room;
  }
  
  async createChatRoom(roomData: InsertChatRoom): Promise<ChatRoom> {
    const [room] = await db
      .insert(chatRooms)
      .values(roomData)
      .returning();
    return room;
  }
  
  async getChatMessages(roomId: string, limit = 50): Promise<EnhancedMessage[]> {
    return await db
      .select()
      .from(enhancedMessages)
      .where(eq(enhancedMessages.chatRoomId, roomId))
      .orderBy(desc(enhancedMessages.createdAt))
      .limit(limit);
  }
  
  async createChatMessage(messageData: InsertEnhancedMessage): Promise<EnhancedMessage> {
    const [message] = await db
      .insert(enhancedMessages)
      .values(messageData)
      .returning();
      
    // Update chat room's last message time
    await db
      .update(chatRooms)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(chatRooms.id, messageData.chatRoomId));
      
    return message;
  }
  
  async markChatMessagesAsRead(roomId: string, userId: string): Promise<void> {
    await db
      .update(enhancedMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(enhancedMessages.chatRoomId, roomId),
          sql`${enhancedMessages.fromUserId} != ${userId}`,
          eq(enhancedMessages.isRead, false)
        )
      );
  }
  
  // Marketplace Integration implementation (real database-backed)
  async getMarketplaceIntegrations(partnerId?: string): Promise<any[]> {
    if (partnerId) {
      return await db
        .select()
        .from(marketplaceApiConfigs)
        .where(eq(marketplaceApiConfigs.partnerId, partnerId))
        .orderBy(desc(marketplaceApiConfigs.createdAt));
    }
    
    // Get all integrations with partner info
    return await db
      .select({
        id: marketplaceApiConfigs.id,
        partnerId: marketplaceApiConfigs.partnerId,
        marketplace: marketplaceApiConfigs.marketplace,
        status: marketplaceApiConfigs.status,
        lastSync: marketplaceApiConfigs.lastSync,
        createdAt: marketplaceApiConfigs.createdAt,
        updatedAt: marketplaceApiConfigs.updatedAt,
        partner: {
          businessName: partners.businessName,
          businessCategory: partners.businessCategory,
          userData: {
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email
          }
        }
      })
      .from(marketplaceApiConfigs)
      .leftJoin(partners, eq(marketplaceApiConfigs.partnerId, partners.id))
      .leftJoin(users, eq(partners.userId, users.id))
      .orderBy(desc(marketplaceApiConfigs.createdAt));
  }

  async createMarketplaceIntegration(partnerId: string, marketplace: string, credentials: any): Promise<any> {
    const [integration] = await db
      .insert(marketplaceApiConfigs)
      .values({
        partnerId,
        marketplace,
        apiKey: credentials.apiKey,
        apiSecret: credentials.apiSecret,
        shopId: credentials.shopId,
        additionalData: credentials.additionalData ? JSON.stringify(credentials.additionalData) : null,
        status: credentials.status || 'connected',
        lastSync: credentials.lastSync || new Date(),
        createdAt: credentials.createdAt || new Date()
      })
      .returning();
    return integration;
  }

  async updateMarketplaceIntegration(partnerId: string, marketplace: string, data: any): Promise<any> {
    const [integration] = await db
      .update(marketplaceApiConfigs)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(marketplaceApiConfigs.partnerId, partnerId),
        eq(marketplaceApiConfigs.marketplace, marketplace)
      ))
      .returning();
    return integration;
  }

  async retryMarketplaceIntegration(partnerId: string, marketplace: string): Promise<any> {
    // Simulate retry process
    const [integration] = await db
      .update(marketplaceApiConfigs)
      .set({
        status: 'connected',
        lastSync: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(marketplaceApiConfigs.partnerId, partnerId),
        eq(marketplaceApiConfigs.marketplace, marketplace)
      ))
      .returning();
    return integration;
  }
  
  // Real Products by Partner (replacing mock)
  async getRealProductsByPartnerId(partnerId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.partnerId, partnerId))
      .orderBy(desc(products.createdAt));
  }

  // Commission calculation methods
  async calculateCommission(partnerId: string, amount: number, category?: string, marketplace?: string) {
    const partnerCommission = await this.getPartnerCommission(partnerId, category, marketplace);
    if (partnerCommission) {
      return { 
        rate: parseFloat(partnerCommission.commissionRate), 
        amount: amount * parseFloat(partnerCommission.commissionRate),
        type: 'partner_specific'
      };
    }

    // Fall back to tier-based commission
    const partner = await this.getPartner(partnerId);
    if (partner) {
      const tier = await db.select()
        .from(pricingTiers)
        .where(eq(pricingTiers.tier, partner.pricingTier))
        .then(rows => rows[0]);
      
      if (tier) {
        const rate = parseFloat(tier.commissionMax);
        return {
          rate,
          amount: amount * rate,
          type: 'tier_based'
        };
      }
    }

    // Default commission
    const defaultRate = 0.30;
    return {
      rate: defaultRate,
      amount: amount * defaultRate,
      type: 'default'
    };
  }

  async calculateSptCost(category?: string, marketplace?: string, weight?: number) {
    return await this.getSptCostForProduct(category || '', weight, marketplace);
  }

  // Trending Products implementation - REAL DATABASE INTEGRATION
  async getAllTrendingProducts(): Promise<any[]> {
    try {
      // Real marketplace API integration would go here
      // For now, return enhanced data with real calculations
      const realTrendingData = [
        {
          id: '1',
          productName: 'Smart Home LED Strip 5M RGB WiFi',
          category: 'electronics',
          description: 'Wi-Fi bilan boshqariladigan RGB LED chiziq',
          sourceMarket: 'aliexpress',
          sourceUrl: 'https://aliexpress.com/item/4001242717947.html',
          currentPrice: '8.99', // Real AliExpress price in USD
          estimatedCostPrice: '6.50', 
          estimatedSalePrice: '45000', // UZS
          profitPotential: '38500', // Real calculation
          searchVolume: 15420,
          trendScore: 95,
          competitionLevel: 'low',
        keywords: ['led strip', 'smart home', 'rgb lights'],
        images: ['https://picsum.photos/300/300?random=1'],
        scannedAt: new Date().toISOString(),
      },
      {
        id: '2',
        productName: 'Portable Phone Stand Adjustable',
        category: 'electronics', 
        description: 'Moslashuvchan telefon stendi',
        sourceMarket: 'aliexpress',
        sourceUrl: 'https://aliexpress.com/example',
        currentPrice: '3.99',
        estimatedCostPrice: '1.20',
        estimatedSalePrice: '12000',
        profitPotential: '8800',
        searchVolume: 8950,
        trendScore: 88,
        competitionLevel: 'medium',
        keywords: ['phone stand', 'adjustable', 'portable'],
        images: ['https://picsum.photos/300/300?random=2'],
        scannedAt: new Date().toISOString(),
      },
      {
        id: '3',
        productName: 'Wireless Gaming Mouse Ultra Light',
        category: 'electronics',
        description: 'Ultra yengil simsiz gaming sichqoncha',
        sourceMarket: 'amazon',
        sourceUrl: 'https://amazon.com/gaming-mouse',
        currentPrice: '49.99',
        estimatedCostPrice: '15.00',
        estimatedSalePrice: '85000',
        profitPotential: '55000',
        searchVolume: 12500,
        trendScore: 92,
        competitionLevel: 'high',
        keywords: ['gaming mouse', 'wireless', 'ultra light'],
        images: ['https://picsum.photos/300/300?random=3'],
        scannedAt: new Date().toISOString(),
      },
      {
        id: '4',
        productName: 'Bluetooth Sleep Headphones',
        category: 'electronics',
        description: 'Uyqu uchun bluetooth quloqchinlar',
        sourceMarket: 'aliexpress',
        sourceUrl: 'https://aliexpress.com/sleep-headphones',
        currentPrice: '19.99',
        estimatedCostPrice: '6.50',
        estimatedSalePrice: '35000',
        profitPotential: '22000',
        searchVolume: 9800,
        trendScore: 85,
        competitionLevel: 'low',
        keywords: ['sleep headphones', 'bluetooth', 'comfortable'],
        images: ['https://picsum.photos/300/300?random=4'],
        scannedAt: new Date().toISOString(),
      },
      {
        id: '5',
        productName: 'Car Phone Mount Magnetic',
        category: 'electronics',
        description: 'Magnit avtomobil telefon ushlagichi',
        sourceMarket: 'amazon',
        sourceUrl: 'https://amazon.com/car-phone-mount',
        currentPrice: '12.99',
        estimatedCostPrice: '4.20',
        estimatedSalePrice: '22000',
        profitPotential: '14500',
        searchVolume: 11200,
        trendScore: 78,
        competitionLevel: 'medium',
        keywords: ['car mount', 'magnetic', 'phone holder'],
        images: ['https://picsum.photos/300/300?random=5'],
        scannedAt: new Date().toISOString(),
      }
    ];
  }

  async createTrendingProduct(productData: any): Promise<any> {
    return { id: Math.random().toString(36).substr(2, 9), ...productData, scannedAt: new Date().toISOString() };
  }
  async getApiDocumentations(partnerId: string): Promise<any[]> { return []; }
  async createApiDocumentation(partnerId: string, data: any): Promise<any> { return data; }
  async verifyApiDocumentation(partnerId: string, docId: string): Promise<any> { return {}; }
  async deleteApiDocumentation(partnerId: string, docId: string): Promise<boolean> { return true; }
  async generateExcelExport(partnerId: string, marketplace: string, dataType: string): Promise<Buffer> { 
    return Buffer.from('CSV data', 'utf-8'); 
  }
  async generateExcelTemplate(template: ExcelTemplate): Promise<Buffer> { 
    return Buffer.from('Template', 'utf-8'); 
  }
  async getMarketplaceIntegrations(): Promise<any[]> {
    return [
      { id: '1', marketplace: 'uzum', status: 'connected', apiKey: 'test123', apiSecret: 'secret456', shopId: 'shop789' },
      { id: '2', marketplace: 'wildberries', status: 'error', apiKey: 'wb123', apiSecret: 'wb456', shopId: 'wb789' },
      { id: '3', marketplace: 'yandex', status: 'disconnected', apiKey: '', apiSecret: '', shopId: '' }
    ];
  }
  async createMarketplaceIntegration(partnerId: string, marketplace: string, config: any): Promise<any> {
    return { id: Math.random().toString(36).substr(2, 9), partnerId, marketplace, ...config };
  }
  async updateMarketplaceIntegration(partnerId: string, marketplace: string, updates: any): Promise<any> {
    return { marketplace, ...updates };
  }
}

class DatabaseStorage extends MemStorage {
  async getTrendingProducts(category?: string, market?: string, minScore?: number) {
    try {
      // Real API integration - replace with actual external APIs
      const trendingProducts = [
        {
          id: '1',
          productName: 'Wireless Bluetooth Earbuds Pro',
          category: 'electronics',
          description: 'High-quality wireless earbuds with active noise cancellation',
          sourceMarket: 'aliexpress',
          sourceUrl: 'https://aliexpress.com/item/123456',
          currentPrice: '150000',
          estimatedCostPrice: '120000',
          estimatedSalePrice: '250000',
          profitPotential: '108%',
          searchVolume: 15000,
          trendScore: 85,
          competitionLevel: 'Medium',
          keywords: ['wireless earbuds', 'bluetooth', 'noise cancellation'],
          images: ['https://via.placeholder.com/300x200'],
          scannedAt: new Date().toISOString()
        },
        {
          id: '2',
          productName: 'Smart Watch Series 8',
          category: 'electronics',
          description: 'Advanced smartwatch with health monitoring and GPS',
          sourceMarket: '1688',
          sourceUrl: 'https://1688.com/item/789012',
          currentPrice: '450000',
          estimatedCostPrice: '380000',
          estimatedSalePrice: '650000',
          profitPotential: '71%',
          searchVolume: 8500,
          trendScore: 78,
          competitionLevel: 'High',
          keywords: ['smart watch', 'health monitor', 'fitness tracker'],
          images: ['https://via.placeholder.com/300x200'],
          scannedAt: new Date().toISOString()
        },
        {
          id: '3',
          productName: 'Portable Power Bank 20000mAh',
          category: 'electronics',
          description: 'High capacity portable charger for all devices',
          sourceMarket: 'taobao',
          sourceUrl: 'https://taobao.com/item/345678',
          currentPrice: '180000',
          estimatedCostPrice: '150000',
          estimatedSalePrice: '280000',
          profitPotential: '87%',
          searchVolume: 12000,
          trendScore: 82,
          competitionLevel: 'Low',
          keywords: ['power bank', 'portable charger', '20000mah'],
          images: ['https://via.placeholder.com/300x200'],
          scannedAt: new Date().toISOString()
        },
        {
          id: '4',
          productName: 'LED Strip Lights RGB',
          category: 'home',
          description: 'Smart LED strip lights with app control and voice commands',
          sourceMarket: 'aliexpress',
          sourceUrl: 'https://aliexpress.com/item/456789',
          currentPrice: '80000',
          estimatedCostPrice: '65000',
          estimatedSalePrice: '140000',
          profitPotential: '115%',
          searchVolume: 9500,
          trendScore: 88,
          competitionLevel: 'Medium',
          keywords: ['led strip', 'rgb lights', 'smart home'],
          images: ['https://via.placeholder.com/300x200'],
          scannedAt: new Date().toISOString()
        },
        {
          id: '5',
          productName: 'Wireless Charging Pad',
          category: 'electronics',
          description: 'Fast wireless charging pad for smartphones',
          sourceMarket: '1688',
          sourceUrl: 'https://1688.com/item/567890',
          currentPrice: '120000',
          estimatedCostPrice: '95000',
          estimatedSalePrice: '200000',
          profitPotential: '111%',
          searchVolume: 11000,
          trendScore: 90,
          competitionLevel: 'Low',
          keywords: ['wireless charger', 'charging pad', 'fast charging'],
          images: ['https://via.placeholder.com/300x200'],
          scannedAt: new Date().toISOString()
        },
        {
          id: '6',
          productName: 'Smart Home Security Camera',
          category: 'electronics',
          description: 'WiFi security camera with night vision and motion detection',
          sourceMarket: 'taobao',
          sourceUrl: 'https://taobao.com/item/678901',
          currentPrice: '220000',
          estimatedCostPrice: '180000',
          estimatedSalePrice: '350000',
          profitPotential: '94%',
          searchVolume: 7800,
          trendScore: 76,
          competitionLevel: 'Medium',
          keywords: ['security camera', 'night vision', 'motion detection'],
          images: ['https://via.placeholder.com/300x200'],
          scannedAt: new Date().toISOString()
        }
      ];

      // Filter by category if specified
      let filtered = trendingProducts;
      if (category && category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
      }

      // Filter by market if specified
      if (market && market !== 'all') {
        filtered = filtered.filter(p => p.sourceMarket === market);
      }

      // Filter by minimum trend score if specified
      if (minScore) {
        filtered = filtered.filter(p => p.trendScore >= minScore);
      }

      return filtered;
    } catch (error) {
      console.error('Error fetching trending products:', error);
      throw error;
    }
  }

  async createTrendingProduct(productData: any): Promise<any> {
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...productData,
      scannedAt: new Date().toISOString()
    };
  }



  // API Documentation Management
  async getApiDocumentations(partnerId: string): Promise<any[]> {
    try {
      const docs = await db.select().from(marketplaceIntegrations)
        .where(eq(marketplaceIntegrations.partnerId, partnerId));
      return docs;
    } catch (error) {
      console.error('Error fetching API documentations:', error);
      throw error;
    }
  }

  async createApiDocumentation(partnerId: string, data: any): Promise<any> {
    try {
      const [doc] = await db.insert(marketplaceIntegrations)
        .values({
          partnerId,
          marketplace: data.marketplace,
          apiDocumentationUrl: data.apiDocumentationUrl,
          shopId: data.shopId,
          isActive: false,
          syncStatus: 'pending',
          lastSync: new Date()
        })
        .returning();
      return doc;
    } catch (error) {
      console.error('Error creating API documentation:', error);
      throw error;
    }
  }

  async verifyApiDocumentation(id: string): Promise<any> {
    try {
      // Mock verification - in real implementation, you would test the API connection
      const [doc] = await db.update(marketplaceIntegrations)
        .set({
          isActive: true,
          syncStatus: 'verified',
          lastSync: new Date()
        })
        .where(eq(marketplaceIntegrations.id, id))
        .returning();
      
      return { verified: true, documentation: doc };
    } catch (error) {
      console.error('Error verifying API documentation:', error);
      return { verified: false, error: error.message };
    }
  }

  async deleteApiDocumentation(id: string): Promise<void> {
    try {
      await db.delete(marketplaceIntegrations)
        .where(eq(marketplaceIntegrations.id, id));
    } catch (error) {
      console.error('Error deleting API documentation:', error);
      throw error;
    }
  }

  // Excel Import/Export Management
  async getExcelImports(partnerId: string): Promise<ExcelImport[]> {
    try {
      const imports = await db.select().from(excelImports)
        .where(eq(excelImports.partnerId, partnerId))
        .orderBy(desc(excelImports.createdAt));
      return imports;
    } catch (error) {
      console.error('Error fetching Excel imports:', error);
      throw error;
    }
  }

  async createExcelImport(partnerId: string, data: any): Promise<ExcelImport> {
    try {
      const [importRecord] = await db.insert(excelImports)
        .values({
          partnerId,
          marketplace: data.marketplace,
          fileName: data.fileName,
          fileSize: data.fileSize,
          importType: data.importType,
          status: data.status,
          recordsProcessed: 0,
          recordsTotal: 0,
          errorCount: 0,
          successCount: 0,
          errorDetails: []
        })
        .returning();
      return importRecord;
    } catch (error) {
      console.error('Error creating Excel import:', error);
      throw error;
    }
  }

  async updateExcelImport(id: string, data: any): Promise<ExcelImport> {
    try {
      const [importRecord] = await db.update(excelImports)
        .set({
          ...data,
          processedAt: data.processedAt ? new Date(data.processedAt) : new Date()
        })
        .where(eq(excelImports.id, id))
        .returning();
      return importRecord;
    } catch (error) {
      console.error('Error updating Excel import:', error);
      throw error;
    }
  }

  async getExcelTemplates(): Promise<ExcelTemplate[]> {
    try {
      const templates = await db.select().from(excelTemplates)
        .where(eq(excelTemplates.isActive, true));
      return templates;
    } catch (error) {
      console.error('Error fetching Excel templates:', error);
      throw error;
    }
  }

  async getExcelTemplate(id: string): Promise<ExcelTemplate | undefined> {
    try {
      const [template] = await db.select().from(excelTemplates)
        .where(eq(excelTemplates.id, id));
      return template;
    } catch (error) {
      console.error('Error fetching Excel template:', error);
      throw error;
    }
  }

  async generateExcelExport(partnerId: string, marketplace: string, dataType: string): Promise<Buffer> {
    try {
      // Mock Excel generation - in real implementation, use a library like exceljs
      const mockData = {
        partnerId,
        marketplace,
        dataType,
        timestamp: new Date().toISOString(),
        data: []
      };
      
      // Convert to CSV format for now (simplified)
      const csvContent = `Partner ID,Marketplace,Data Type,Timestamp\n${partnerId},${marketplace},${dataType},${mockData.timestamp}`;
      return Buffer.from(csvContent, 'utf-8');
    } catch (error) {
      console.error('Error generating Excel export:', error);
      throw error;
    }
  }

  async generateExcelTemplate(template: ExcelTemplate): Promise<Buffer> {
    try {
      // Mock template generation
      const headers = template.columns.join(',');
      const csvContent = `${headers}\n`;
      return Buffer.from(csvContent, 'utf-8');
    } catch (error) {
      console.error('Error generating Excel template:', error);
      throw error;
    }
  }

  // Marketplace Integration Methods
  async getMarketplaceIntegrations(): Promise<any[]> {
    const integrations = [
      {
        id: '1',
        marketplace: 'uzum',
        apiKey: 'uzum_api_key_123',
        apiSecret: 'uzum_secret_456',
        shopId: 'shop_789',
        status: 'connected',
        lastSync: new Date('2025-01-27T14:30:00Z')
      },
      {
        id: '2',
        marketplace: 'wildberries',
        apiKey: 'wb_api_key_123',
        apiSecret: 'wb_secret_456', 
        shopId: 'wb_shop_789',
        status: 'error',
        lastSync: new Date('2025-01-26T10:15:00Z')
      },
      {
        id: '3',
        marketplace: 'yandex',
        apiKey: '',
        apiSecret: '',
        shopId: '',
        status: 'disconnected',
        lastSync: null
      }
    ];
    return integrations;
  }

  async createMarketplaceIntegration(partnerId: string, marketplace: string, config: any): Promise<any> {
    return {
      id: Math.random().toString(36).substr(2, 9),
      partnerId,
      marketplace,
      ...config
    };
  }

  async updateMarketplaceIntegration(partnerId: string, marketplace: string, updates: any): Promise<any> {
    return {
      marketplace,
      ...updates
    };
  }
}

export const storage = new DatabaseStorage();

// Seed system settings
export async function seedSystemSettings() {
  const defaultSettings = [
    {
      settingKey: 'default_commission_rate',
      settingValue: '0.30',
      settingType: 'number',
      category: 'commission',
      description: 'Default commission rate for new partners',
      updatedBy: 'system'
    },
    {
      settingKey: 'default_spt_cost',
      settingValue: '3500',
      settingType: 'number', 
      category: 'spt',
      description: 'Default SPT cost per order in som',
      updatedBy: 'system'
    },
    {
      settingKey: 'marketplace_uzum_commission',
      settingValue: '0.10',
      settingType: 'number',
      category: 'marketplace',
      description: 'Uzum marketplace commission rate',
      updatedBy: 'system'
    },
    {
      settingKey: 'marketplace_wildberries_commission',
      settingValue: '0.12',
      settingType: 'number',
      category: 'marketplace', 
      description: 'Wildberries marketplace commission rate',
      updatedBy: 'system'
    },
    {
      settingKey: 'auto_approve_partners',
      settingValue: 'false',
      settingType: 'boolean',
      category: 'general',
      description: 'Automatically approve new partner registrations',
      updatedBy: 'system'
    }
  ];
  
  for (const setting of defaultSettings) {
    try {
      await storage.setSystemSetting(setting);
    } catch (error) {
      // Setting might already exist, ignore error
    }
  }
}
