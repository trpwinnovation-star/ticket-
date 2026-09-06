'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, User, DEMO_USERS } from '@/lib/db';
import { TicketStore } from '@/lib/store';

interface RoleContextType {
  currentRole: Role;
  currentUser: User;
  switchRole: (role: Role) => void;
  refreshKey: number;
  triggerRefresh: () => void;
  resetDemoData: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>('GUEST_USER');
  const [currentUser, setCurrentUser] = useState<User>(DEMO_USERS[0]);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Sync role user whenever currentRole changes
  useEffect(() => {
    const users = TicketStore.getUsers();
    let matchingUser = users.find((u) => u.role === currentRole);
    if (!matchingUser) {
      matchingUser = DEMO_USERS.find((u) => u.role === currentRole) || DEMO_USERS[0];
    }
    setCurrentUser(matchingUser);
  }, [currentRole, refreshKey]);

  const switchRole = (role: Role) => {
    setCurrentRole(role);
  };

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const resetDemoData = () => {
    TicketStore.resetToDemoData();
    triggerRefresh();
  };

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        currentUser,
        switchRole,
        refreshKey,
        triggerRefresh,
        resetDemoData,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
