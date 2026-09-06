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
  { id: 'mod-1', name: 'Billing & Invoicing', category: 'Core Finance', createdAt: new Date().toISOString() },
  { id: 'mod-2', name: 'Authentication & SSO', category: 'Security', createdAt: new Date().toISOString() },
  { id: 'mod-3', name: 'User Dashboard & Analytics', category: 'Frontend UI', createdAt: new Date().toISOString() },
  { id: 'mod-4', name: 'Payment Gateway Integration', category: 'Payments', createdAt: new Date().toISOString() },
  { id: 'mod-5', name: 'Reports & Data Export', category: 'Analytics', createdAt: new Date().toISOString() },
  { id: 'mod-6', name: 'API & Subcontractor Integrations', category: 'Backend Systems', createdAt: new Date().toISOString() },
  { id: 'mod-7', name: 'Infrastructure & Server Operations', category: 'DevOps', createdAt: new Date().toISOString() },
];

const DATA_FILE = path.join(process.cwd(), 'prisma', 'config_store.json');

function loadConfigData(): { websites: TargetWebsite[]; modules: TargetModule[] } {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        websites: Array.isArray(parsed.websites) ? parsed.websites : DEFAULT_WEBSITES,
        modules: Array.isArray(parsed.modules) ? parsed.modules : DEFAULT_MODULES,
      };
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
    saveConfigData(filteredWebsites, modules);
    return { success: true };
  }

  /**
   * Add a new target module (Admin/Manager only)
   */
  static addModule(name: string, category?: string) {
    if (!name || !name.trim()) {
      throw new Error('Target module name is required.');
    }
    const { websites, modules } = loadConfigData();
    const newMod: TargetModule = {
      id: `mod-${Date.now()}`,
      name: name.trim(),
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
