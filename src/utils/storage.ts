// LocalStorage utilities for persisting state

const KEYS = {
  CURRENT_WORKSPACE: 'hyq_current_workspace',
  CURRENT_PROFILE: 'hyq_current_profile',
  WORKSPACES: 'hyq_workspaces',
  PROFILES: 'hyq_profiles',
  USER: 'hyq_user',
  AUTH: 'hyq_auth',
  ONBOARDING_COMPLETE: 'hyq_onboarding_complete'
};

// Generic storage functions
export const storage = {
  // Get item
  get: function<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return null;
    }
  },

  // Set item
  set: function<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
    }
  },

  // Remove item
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  },

  // Clear all
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// Specific storage functions for our app
export const workspaceStorage = {
  getCurrent: () => storage.get(KEYS.CURRENT_WORKSPACE),
  setCurrent: (workspace: any) => storage.set(KEYS.CURRENT_WORKSPACE, workspace),
  getAll: () => storage.get(KEYS.WORKSPACES) || [],
  setAll: (workspaces: any[]) => storage.set(KEYS.WORKSPACES, workspaces),
  add: (workspace: any) => {
    const workspaces = workspaceStorage.getAll();
    workspaceStorage.setAll([...workspaces, workspace]);
  },
  update: (workspaceId: string, updates: any) => {
    const workspaces = workspaceStorage.getAll();
    const updated = workspaces.map((ws: any) => 
      ws.id === workspaceId ? { ...ws, ...updates } : ws
    );
    workspaceStorage.setAll(updated);
  },
  remove: (workspaceId: string) => {
    const workspaces = workspaceStorage.getAll();
    workspaceStorage.setAll(workspaces.filter((ws: any) => ws.id !== workspaceId));
  }
};

export const profileStorage = {
  getCurrent: () => storage.get(KEYS.CURRENT_PROFILE),
  setCurrent: (profile: any) => storage.set(KEYS.CURRENT_PROFILE, profile),
  getAll: () => storage.get(KEYS.PROFILES) || [],
  setAll: (profiles: any[]) => storage.set(KEYS.PROFILES, profiles),
  getByWorkspace: (workspaceId: string) => {
    const profiles = profileStorage.getAll();
    return profiles.filter((p: any) => p.workspaceId === workspaceId);
  },
  add: (profile: any) => {
    const profiles = profileStorage.getAll();
    profileStorage.setAll([...profiles, profile]);
  },
  update: (profileId: string, updates: any) => {
    const profiles = profileStorage.getAll();
    const updated = profiles.map((p: any) => 
      p.id === profileId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    profileStorage.setAll(updated);
  },
  remove: (profileId: string) => {
    const profiles = profileStorage.getAll();
    profileStorage.setAll(profiles.filter((p: any) => p.id !== profileId));
  }
};

export const userStorage = {
  get: () => storage.get(KEYS.USER),
  set: (user: any) => storage.set(KEYS.USER, user),
  clear: () => storage.remove(KEYS.USER)
};

export const authStorage = {
  isAuthenticated: () => storage.get(KEYS.AUTH) === true,
  setAuthenticated: (value: boolean) => storage.set(KEYS.AUTH, value),
  clear: () => storage.remove(KEYS.AUTH)
};

export const onboardingStorage = {
  isComplete: () => storage.get(KEYS.ONBOARDING_COMPLETE) === true,
  setComplete: (value: boolean) => storage.set(KEYS.ONBOARDING_COMPLETE, value),
  clear: () => storage.remove(KEYS.ONBOARDING_COMPLETE)
};

// Clear all app data
export const clearAllAppData = () => {
  Object.values(KEYS).forEach(key => storage.remove(key));
};