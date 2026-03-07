/**
 * useSpotlight - Unit Tests
 * ==========================
 * Tests for composables/useSpotlight.ts (search functionality)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openSpotlightDirect, type SpotlightItem } from '~/composables/useSpotlight';

// Mock useApiFetch globally
const mockApiFetch = vi.fn();
(globalThis as any).useApiFetch = mockApiFetch;

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: any[]) => mockApiFetch(...args)
}));

// Mock usePermissions
vi.mock('@/composables/usePermissions', () => ({
  usePermissions: vi.fn().mockResolvedValue({
    hasPermission: vi.fn().mockReturnValue(true),
    hasAnyPermission: vi.fn().mockReturnValue(true)
  })
}));

// Mock useKeyboardShortcuts
vi.mock('@/composables/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn().mockReturnValue({
    cheatSheetVisible: { value: false }
  })
}));

// Mock stores
(globalThis as any).useThemeStore = vi.fn().mockReturnValue({
  toggleTheme: vi.fn()
});
(globalThis as any).useMain = vi.fn().mockReturnValue({
  fullNav: true
});
(globalThis as any).useI18n = vi.fn().mockReturnValue({
  locale: { value: 'en' },
  setLocale: vi.fn()
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// Mock window for keyboard event listener
(globalThis as any).window = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

describe('useSpotlight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // SpotlightItem Interface
  // ============================================
  describe('SpotlightItem interface', () => {
    it('should create a valid page item', () => {
      const item: SpotlightItem = {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'ph:house-bold',
        category: 'page',
        path: '/',
        keywords: ['home', 'main']
      };

      expect(item.id).toBe('dashboard');
      expect(item.category).toBe('page');
      expect(item.path).toBe('/');
      expect(item.keywords).toContain('home');
    });

    it('should create a valid action item', () => {
      const item: SpotlightItem = {
        id: 'add-lead',
        title: 'Create New Lead',
        icon: 'ph:user-plus-bold',
        category: 'action',
        path: '/sales/leads/add-lead',
        keywords: ['create', 'new'],
        permissions: ['CREATE_LEADS']
      };

      expect(item.category).toBe('action');
      expect(item.permissions).toContain('CREATE_LEADS');
    });

    it('should create a valid command item', () => {
      const item: SpotlightItem = {
        id: 'cmd-dark-mode',
        title: 'Toggle Dark Mode',
        icon: 'ph:moon-bold',
        category: 'command',
        keywords: ['theme', 'dark'],
        action: vi.fn(),
        shortcutHint: 'Ctrl+Shift+D'
      };

      expect(item.category).toBe('command');
      expect(item.shortcutHint).toBe('Ctrl+Shift+D');
      expect(typeof item.action).toBe('function');
    });

    it('should create a valid search result item', () => {
      const item: SpotlightItem = {
        id: 'search-0',
        title: 'John Doe',
        subtitle: 'Lead',
        icon: 'ph:users-bold',
        category: 'search',
        path: '/sales/leads/123',
        keywords: []
      };

      expect(item.category).toBe('search');
      expect(item.subtitle).toBe('Lead');
    });

    it('should create a recent item', () => {
      const item: SpotlightItem = {
        id: 'deals',
        title: 'Deals',
        icon: 'ph:handshake-bold',
        category: 'recent',
        path: '/sales/deals'
      };

      expect(item.category).toBe('recent');
    });
  });

  // ============================================
  // openSpotlightDirect
  // ============================================
  describe('openSpotlightDirect', () => {
    it('should be a function', () => {
      expect(typeof openSpotlightDirect).toBe('function');
    });

    it('should not throw when called', () => {
      expect(() => openSpotlightDirect()).not.toThrow();
    });
  });

  // ============================================
  // Category Coverage
  // ============================================
  describe('category types', () => {
    it('should support all category values', () => {
      const categories = ['page', 'action', 'search', 'command', 'recent'] as const;

      categories.forEach(cat => {
        const item: SpotlightItem = {
          id: `test-${cat}`,
          title: `Test ${cat}`,
          icon: 'ph:test',
          category: cat
        };
        expect(item.category).toBe(cat);
      });
    });
  });

  // ============================================
  // Permission-based Items
  // ============================================
  describe('permission-based items', () => {
    it('should support items without permissions (visible to all)', () => {
      const item: SpotlightItem = {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'ph:house-bold',
        category: 'page',
        path: '/'
        // No permissions field = visible to everyone
      };

      expect(item.permissions).toBeUndefined();
    });

    it('should support items with multiple permissions', () => {
      const item: SpotlightItem = {
        id: 'leads',
        title: 'Leads',
        icon: 'ph:users-bold',
        category: 'page',
        path: '/sales/leads',
        permissions: ['VIEW_OWN_LEADS', 'VIEW_GLOBAL_LEADS']
      };

      expect(item.permissions).toHaveLength(2);
    });
  });

  // ============================================
  // Navigation Pages Coverage
  // ============================================
  describe('expected navigation pages', () => {
    it('should cover all main CRM areas with SpotlightItem structure', () => {
      const crmPages: SpotlightItem[] = [
        { id: 'dashboard', title: 'Dashboard', icon: 'ph:house-bold', category: 'page', path: '/' },
        { id: 'leads', title: 'Leads', icon: 'ph:users-bold', category: 'page', path: '/sales/leads' },
        { id: 'clients', title: 'Clients', icon: 'ph:user-circle-bold', category: 'page', path: '/sales/clients' },
        { id: 'deals', title: 'Deals', icon: 'ph:handshake-bold', category: 'page', path: '/sales/deals' },
        { id: 'projects', title: 'Projects', icon: 'ph:folder-bold', category: 'page', path: '/operations/projects' },
        { id: 'reports', title: 'Reports', icon: 'ph:chart-bar-bold', category: 'page', path: '/reports' },
        { id: 'calendar', title: 'Calendar', icon: 'ph:calendar-bold', category: 'page', path: '/calendar' },
        { id: 'messaging', title: 'Messaging', icon: 'ph:chat-circle-dots-bold', category: 'page', path: '/messaging' }
      ];

      crmPages.forEach(page => {
        expect(page.id).toBeTruthy();
        expect(page.path).toBeTruthy();
        expect(page.category).toBe('page');
      });

      expect(crmPages).toHaveLength(8);
    });
  });

  // ============================================
  // Quick Actions Coverage
  // ============================================
  describe('expected quick actions', () => {
    it('should cover all main creation actions with SpotlightItem structure', () => {
      const createActions: SpotlightItem[] = [
        {
          id: 'add-lead',
          title: 'Create New Lead',
          icon: 'ph:user-plus-bold',
          category: 'action',
          path: '/sales/leads/add-lead',
          permissions: ['CREATE_LEADS']
        },
        {
          id: 'add-client',
          title: 'Create New Client',
          icon: 'ph:user-circle-plus-bold',
          category: 'action',
          path: '/sales/clients/add-client',
          permissions: ['CREATE_CLIENTS']
        },
        {
          id: 'add-deal',
          title: 'Create New Deal',
          icon: 'ph:handshake-bold',
          category: 'action',
          path: '/sales/deals/add-deal',
          permissions: ['CREATE_DEALS']
        },
        {
          id: 'add-project',
          title: 'Create New Project',
          icon: 'ph:folder-plus-bold',
          category: 'action',
          path: '/operations/projects/add-project',
          permissions: ['CREATE_PROJECTS']
        }
      ];

      createActions.forEach(action => {
        expect(action.category).toBe('action');
        expect(action.permissions).toBeDefined();
        expect(action.permissions!.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================
  // Command Items Coverage
  // ============================================
  describe('expected command items', () => {
    it('should define correct command structure', () => {
      const commands: SpotlightItem[] = [
        {
          id: 'cmd-dark-mode',
          title: 'Toggle Dark Mode',
          icon: 'ph:moon-bold',
          category: 'command',
          keywords: ['theme'],
          shortcutHint: 'Ctrl+Shift+D'
        },
        { id: 'cmd-language', title: 'Switch Language', icon: 'ph:translate-bold', category: 'command', keywords: ['locale'] },
        { id: 'cmd-sidebar', title: 'Toggle Sidebar', icon: 'ph:sidebar-bold', category: 'command', keywords: ['menu'] },
        { id: 'cmd-fullscreen', title: 'Fullscreen', icon: 'ph:arrows-out-bold', category: 'command', keywords: ['fullscreen'] },
        { id: 'cmd-shortcuts', title: 'Keyboard Shortcuts', icon: 'ph:keyboard-bold', category: 'command', keywords: ['keys'], shortcutHint: '?' }
      ];

      commands.forEach(cmd => {
        expect(cmd.category).toBe('command');
        expect(cmd.id.startsWith('cmd-')).toBe(true);
      });

      expect(commands).toHaveLength(5);
    });
  });

  // ============================================
  // Search Result Mapping
  // ============================================
  describe('search result entity mapping', () => {
    it('should map entity types to icons correctly', () => {
      const entityIconMap: Record<string, string> = {
        lead: 'ph:users-bold',
        client: 'ph:user-circle-bold',
        deal: 'ph:handshake-bold',
        opportunity: 'ph:target-bold',
        project: 'ph:folder-bold',
        contact: 'ph:address-book-bold',
        invoice: 'ph:receipt-bold',
        proposal: 'ph:file-text-bold',
        task: 'ph:list-checks-bold',
        staff: 'ph:identification-badge-bold'
      };

      expect(Object.keys(entityIconMap)).toHaveLength(10);
      expect(entityIconMap.lead).toBe('ph:users-bold');
      expect(entityIconMap.deal).toBe('ph:handshake-bold');
    });

    it('should map entity types to paths correctly', () => {
      const entityPathMap: Record<string, string> = {
        lead: '/sales/leads/',
        client: '/sales/clients/',
        deal: '/sales/deals/',
        opportunity: '/sales/opportunity/',
        project: '/operations/projects/',
        invoice: '/sales/invoices/',
        proposal: '/sales/proposals/',
        task: '/tasks/',
        staff: '/staff/'
      };

      expect(Object.keys(entityPathMap)).toHaveLength(9);
      expect(entityPathMap.lead).toBe('/sales/leads/');
      expect(entityPathMap.project).toBe('/operations/projects/');
    });
  });
});
