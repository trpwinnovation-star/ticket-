import fs from 'fs';
import path from 'path';

export interface TargetWebsite {
  id: string;
  name: string;
  url?: string;
  createdAt: string;
}

export interface TargetModule {
  id: string;
  name: string;
  websiteId?: string; // ID of the Project / Portal this module belongs to
  category?: string;
  createdAt: string;
}

const DEFAULT_WEBSITES: TargetWebsite[] = [
  { id: 'web-1', name: 'Acme Retail Portal', url: 'https://portal.acmeretail.com', createdAt: new Date().toISOString() },
  { id: 'web-2', name: 'TechCorp Enterprise ERP', url: 'https://erp.techcorp.io', createdAt: new Date().toISOString() },
  { id: 'web-3', name: 'CloudOps Infrastructure Hub', url: 'https://cloud.ops.org', createdAt: new Date().toISOString() },
  { id: 'web-4', name: 'FinTech Global Billing System', url: 'https://billing.fintechglobal.com', createdAt: new Date().toISOString() },
];

const DEFAULT_MODULES: TargetModule[] = [
  // Acme Retail Portal (web-1)
  { id: 'mod-1', name: 'User Dashboard & Shopping Experience', websiteId: 'web-1', category: 'Frontend UI', createdAt: new Date().toISOString() },
  { id: 'mod-2', name: 'Product Catalog & Search Filters', websiteId: 'web-1', category: 'Catalog', createdAt: new Date().toISOString() },
  { id: 'mod-3', name: 'Cart & Flash Checkout Engine', websiteId: 'web-1', category: 'E-Commerce', createdAt: new Date().toISOString() },

  // TechCorp Enterprise ERP (web-2)
  { id: 'mod-4', name: 'HR & Staff Payroll System', websiteId: 'web-2', category: 'Human Resources', createdAt: new Date().toISOString() },
  { id: 'mod-5', name: 'Inventory & Warehouse Tracker', websiteId: 'web-2', category: 'Logistics', createdAt: new Date().toISOString() },
  { id: 'mod-6', name: 'Authentication & Corporate SSO', websiteId: 'web-2', category: 'Security', createdAt: new Date().toISOString() },

  // CloudOps Infrastructure Hub (web-3)
  { id: 'mod-7', name: 'Infrastructure & Server Operations', websiteId: 'web-3', category: 'DevOps', createdAt: new Date().toISOString() },
  { id: 'mod-8', name: 'API Gateway & Microservices Hub', websiteId: 'web-3', category: 'Backend Systems', createdAt: new Date().toISOString() },
  { id: 'mod-9', name: 'Kubernetes Monitoring & Log Aggregation', websiteId: 'web-3', category: 'Observability', createdAt: new Date().toISOString() },

  // FinTech Global Billing System (web-4)
  { id: 'mod-10', name: 'Billing, Invoicing & VAT Calculations', websiteId: 'web-4', category: 'Core Finance', createdAt: new Date().toISOString() },
  { id: 'mod-11', name: 'Stripe & PayPal Payment Gateway Integration', websiteId: 'web-4', category: 'Payments', createdAt: new Date().toISOString() },
  { id: 'mod-12', name: 'Subscriptions & Recurring Billing Engine', websiteId: 'web-4', category: 'Subscriptions', createdAt: new Date().toISOString() },
];

const DATA_FILE = path.join(process.cwd(), 'prisma', 'config_store.json');

function loadConfigData(): { websites: TargetWebsite[]; modules: TargetModule[] } {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      const websites = Array.isArray(parsed.websites) && parsed.websites.length > 0 ? parsed.websites : DEFAULT_WEBSITES;
      const rawModules = Array.isArray(parsed.modules) && parsed.modules.length > 0 ? parsed.modules : DEFAULT_MODULES;

      // Migrate legacy modules that don't have websiteId
      const modules = rawModules.map((m: any, index: number) => {
        if (!m.websiteId) {
          // Assign to website based on mod index or default to first website
          const targetWeb = websites[index % websites.length] || websites[0];
          return { ...m, websiteId: targetWeb?.id };
        }
        return m;
      });

      return { websites, modules };
    }
  } catch (err) {
    console.error('Failed to load config_store.json:', err);
  }
  return { websites: DEFAULT_WEBSITES, modules: DEFAULT_MODULES };
}

function saveConfigData(websites: TargetWebsite[], modules: TargetModule[]) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify({ websites, modules }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save config_store.json:', err);
  }
}

export class ConfigService {
  /**
   * Get all registered target websites and modules (persisted)
   */
  static getOptions() {
    return loadConfigData();
  }

  /**
   * Add a new target website / project (Admin/Manager only)
   */
  static addWebsite(name: string, url?: string) {
    if (!name || !name.trim()) {
      throw new Error('Project name is required.');
    }
    const { websites, modules } = loadConfigData();
    const newWeb: TargetWebsite = {
      id: `web-${Date.now()}`,
      name: name.trim(),
      url: url ? url.trim() : undefined,
      createdAt: new Date().toISOString(),
    };
    websites.unshift(newWeb);
    saveConfigData(websites, modules);
    return newWeb;
  }

  /**
   * Delete a target website / project (Admin/Manager only)
   */
  static deleteWebsite(id: string) {
    const { websites, modules } = loadConfigData();
    const filteredWebsites = websites.filter((w) => w.id !== id);
    // Remove modules belonging to deleted website
    const filteredModules = modules.filter((m) => m.websiteId !== id);
    saveConfigData(filteredWebsites, filteredModules);
    return { success: true };
  }

  /**
   * Add a new target module for a specific project/website (Admin/Manager only)
   */
  static addModule(name: string, category?: string, websiteId?: string) {
    if (!name || !name.trim()) {
      throw new Error('Target module name is required.');
    }
    const { websites, modules } = loadConfigData();

    // Default to first website if not specified
    const targetWebsiteId = websiteId || (websites[0]?.id ?? 'web-1');

    const newMod: TargetModule = {
      id: `mod-${Date.now()}`,
      name: name.trim(),
      websiteId: targetWebsiteId,
      category: category ? category.trim() : 'General',
      createdAt: new Date().toISOString(),
    };
    modules.unshift(newMod);
    saveConfigData(websites, modules);
    return newMod;
  }

  /**
   * Delete a target module (Admin/Manager only)
   */
  static deleteModule(id: string) {
    const { websites, modules } = loadConfigData();
    const filteredModules = modules.filter((m) => m.id !== id);
    saveConfigData(websites, filteredModules);
    return { success: true };
  }
}
