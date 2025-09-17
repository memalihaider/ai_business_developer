"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  value?: string;
  status?: string;
  owner?: string;
  priority?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface LeadContextType {
  leads: Lead[];
  setLeads: (leads: Lead[]) => void;
  addLead: (lead: Lead) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  refreshLeads: () => Promise<void>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

export function LeadProvider({ children, token }: { children: ReactNode; token: string | null }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  const addLead = useCallback((newLead: Lead) => {
    setLeads(prevLeads => [newLead, ...prevLeads]);
  }, []);

  const updateLead = useCallback((id: string, updates: Partial<Lead>) => {
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === id ? { ...lead, ...updates } : lead
      )
    );
  }, []);

  const deleteLead = useCallback((id: string) => {
    setLeads(prevLeads => prevLeads.filter(lead => lead.id !== id));
  }, []);

  const refreshLeads = useCallback(async () => {
    if (!token) {
      console.log('No token available, skipping leads refresh');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/leads', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error refreshing leads:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const value: LeadContextType = {
    leads,
    setLeads,
    addLead,
    updateLead,
    deleteLead,
    refreshLeads,
    loading,
    setLoading
  };

  return (
    <LeadContext.Provider value={value}>
      {children}
    </LeadContext.Provider>
  );
}

export function useLeads() {
  const context = useContext(LeadContext);
  if (context === undefined) {
    throw new Error('useLeads must be used within a LeadProvider');
  }
  return context;
}

export type { Lead };