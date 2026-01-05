import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  Workspace, 
  Profile, 
  UsageData, 
  OrgType 
} from '../types';
import { 
  workspaceStorage, 
  profileStorage, 
  userStorage, 
  authStorage,
  onboardingStorage 
} from '../utils/storage';
import { 
  mockWorkspaces, 
  mockProfiles, 
  mockUsageData 
} from '../mock-data';

interface AppContextType {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  
  // Workspace state
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  switchWorkspace: (workspaceId: string) => void;
  addWorkspace: (workspace: Workspace) => void;
  
  // Profile state
  currentProfile: Profile | null;
  profiles: Profile[];
  switchProfile: (profileId: string) => void;
  addProfile: (profile: Profile) => void;
  updateProfile: (profileId: string, updates: Partial<Profile>) => void;
  deleteProfile: (profileId: string) => void;
  
  // Usage data
  usageData: UsageData | null;
  
  // Auth actions
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setOnboardingComplete: (value: boolean) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // User state
  const [user, setUserState] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticatedState] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  
  // Workspace state
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  
  // Profile state
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  
  // Usage data
  const [usageData, setUsageData] = useState<UsageData | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    // Load user
    const savedUser = userStorage.get();
    if (savedUser) {
      setUserState(savedUser);
    }
    
    // Load auth state
    const authenticated = authStorage.isAuthenticated();
    setIsAuthenticatedState(authenticated);
    
    // Load onboarding state
    const onboardingComplete = onboardingStorage.isComplete();
    setHasCompletedOnboarding(onboardingComplete);
    
    // Load workspaces
    let savedWorkspaces = workspaceStorage.getAll();
    if (!savedWorkspaces || savedWorkspaces.length === 0) {
      // Initialize with mock data for development
      savedWorkspaces = mockWorkspaces;
      workspaceStorage.setAll(savedWorkspaces);
    }
    setWorkspaces(savedWorkspaces);
    
    // Load current workspace
    let savedCurrentWorkspace = workspaceStorage.getCurrent();
    if (!savedCurrentWorkspace && savedWorkspaces.length > 0) {
      savedCurrentWorkspace = savedWorkspaces[0];
      workspaceStorage.setCurrent(savedCurrentWorkspace);
    }
    setCurrentWorkspace(savedCurrentWorkspace);
    
    // Load profiles
    let savedProfiles = profileStorage.getAll();
    if (!savedProfiles || savedProfiles.length === 0) {
      // Initialize with mock data for development
      savedProfiles = mockProfiles;
      profileStorage.setAll(savedProfiles);
    }
    setProfiles(savedProfiles);
    
    // Load current profile
    let savedCurrentProfile = profileStorage.getCurrent();
    if (!savedCurrentProfile && savedCurrentWorkspace) {
      // Find first profile for current workspace
      const workspaceProfiles = savedProfiles.filter(
        (p: Profile) => p.workspaceId === savedCurrentWorkspace.id
      );
      if (workspaceProfiles.length > 0) {
        savedCurrentProfile = workspaceProfiles[0];
        profileStorage.setCurrent(savedCurrentProfile);
      }
    }
    setCurrentProfile(savedCurrentProfile);
    
    // Load usage data
    if (savedCurrentWorkspace) {
      const usage = mockUsageData[savedCurrentWorkspace.id];
      setUsageData(usage || null);
    }
  }, []);

  // Update usage data when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      const usage = mockUsageData[currentWorkspace.id];
      setUsageData(usage || null);
    }
  }, [currentWorkspace]);

  // Workspace actions
  const switchWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find(ws => ws.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      workspaceStorage.setCurrent(workspace);
      
      // Switch to first profile in new workspace
      const workspaceProfiles = profiles.filter(p => p.workspaceId === workspaceId);
      if (workspaceProfiles.length > 0) {
        setCurrentProfile(workspaceProfiles[0]);
        profileStorage.setCurrent(workspaceProfiles[0]);
      } else {
        setCurrentProfile(null);
        profileStorage.setCurrent(null);
      }
    }
  };

  const addWorkspace = (workspace: Workspace) => {
    const updated = [...workspaces, workspace];
    setWorkspaces(updated);
    workspaceStorage.setAll(updated);
    
    // Set as current if first workspace
    if (workspaces.length === 0) {
      setCurrentWorkspace(workspace);
      workspaceStorage.setCurrent(workspace);
    }
  };

  // Profile actions
  const switchProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setCurrentProfile(profile);
      profileStorage.setCurrent(profile);
    }
  };

  const addProfile = (profile: Profile) => {
    const updated = [...profiles, profile];
    setProfiles(updated);
    profileStorage.setAll(updated);
    
    // Set as current if first profile for workspace
    const workspaceProfiles = profiles.filter(p => p.workspaceId === profile.workspaceId);
    if (workspaceProfiles.length === 0) {
      setCurrentProfile(profile);
      profileStorage.setCurrent(profile);
    }
  };

  const updateProfile = (profileId: string, updates: Partial<Profile>) => {
    const updated = profiles.map(p => 
      p.id === profileId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    setProfiles(updated);
    profileStorage.setAll(updated);
    
    // Update current profile if it's the one being updated
    if (currentProfile?.id === profileId) {
      const updatedProfile = { ...currentProfile, ...updates, updatedAt: new Date().toISOString() };
      setCurrentProfile(updatedProfile);
      profileStorage.setCurrent(updatedProfile);
    }
  };

  const deleteProfile = (profileId: string) => {
    // Don't allow deletion if it's the only profile for the workspace
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      const workspaceProfiles = profiles.filter(p => p.workspaceId === profile.workspaceId);
      if (workspaceProfiles.length <= 1) {
        console.warn('Cannot delete the only profile for a workspace');
        return;
      }
    }
    
    const updated = profiles.filter(p => p.id !== profileId);
    setProfiles(updated);
    profileStorage.setAll(updated);
    
    // Switch to another profile if current was deleted
    if (currentProfile?.id === profileId && profile) {
      const remainingProfiles = updated.filter(p => p.workspaceId === profile.workspaceId);
      if (remainingProfiles.length > 0) {
        setCurrentProfile(remainingProfiles[0]);
        profileStorage.setCurrent(remainingProfiles[0]);
      }
    }
  };

  // Auth actions
  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      userStorage.set(newUser);
    } else {
      userStorage.clear();
    }
  };

  const setAuthenticated = (value: boolean) => {
    setIsAuthenticatedState(value);
    authStorage.setAuthenticated(value);
  };

  const setOnboardingComplete = (value: boolean) => {
    setHasCompletedOnboarding(value);
    onboardingStorage.setComplete(value);
  };

  const logout = () => {
    setUserState(null);
    setIsAuthenticatedState(false);
    setHasCompletedOnboarding(false);
    setCurrentWorkspace(null);
    setCurrentProfile(null);
    
    // Clear storage
    userStorage.clear();
    authStorage.clear();
    onboardingStorage.clear();
  };

  const value: AppContextType = {
    // User
    user,
    isAuthenticated,
    hasCompletedOnboarding,
    
    // Workspace
    currentWorkspace,
    workspaces,
    switchWorkspace,
    addWorkspace,
    
    // Profile
    currentProfile,
    profiles,
    switchProfile,
    addProfile,
    updateProfile,
    deleteProfile,
    
    // Usage
    usageData,
    
    // Auth
    setUser,
    setAuthenticated,
    setOnboardingComplete,
    logout
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
