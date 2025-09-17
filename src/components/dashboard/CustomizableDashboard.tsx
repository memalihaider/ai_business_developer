"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, DollarSign, FileText, Activity, BarChart3 } from 'lucide-react';
import QuickNotes from './QuickNotes';
import LeadAddForm from './LeadAddForm';
import DashboardCustomizer from './DashboardCustomizer';

interface DashboardSection {
  id: string;
  type: 'quick-notes' | 'lead-form' | 'metrics' | 'recent-activity' | 'charts' | 'custom';
  title: string;
  visible: boolean;
  order: number;
  config?: Record<string, any>;
}

interface CustomizableDashboardProps {
  metrics?: any;
  loading?: boolean;
  refresh?: () => void;
}

const DEFAULT_SECTIONS: DashboardSection[] = [
  { id: 'metrics', type: 'metrics', title: 'Performance Metrics', visible: true, order: 0 },
  { id: 'quick-notes', type: 'quick-notes', title: 'Quick Notes', visible: true, order: 1 },
  { id: 'lead-form', type: 'lead-form', title: 'Lead Add Form', visible: true, order: 2 },
  { id: 'recent-activity', type: 'recent-activity', title: 'Recent Activity', visible: true, order: 3 },
  { id: 'charts', type: 'charts', title: 'Analytics Charts', visible: true, order: 4 }
];

export default function CustomizableDashboard({ metrics, loading, refresh }: CustomizableDashboardProps) {
  const [sections, setSections] = useState<DashboardSection[]>(DEFAULT_SECTIONS);

  // Load sections from localStorage on mount
  useEffect(() => {
    const savedSections = localStorage.getItem('dashboard-sections');
    if (savedSections) {
      try {
        setSections(JSON.parse(savedSections));
      } catch (error) {
        console.error('Error loading dashboard sections:', error);
        setSections(DEFAULT_SECTIONS);
      }
    }
  }, []);

  // Save sections to localStorage when they change
  const handleSectionsChange = (newSections: DashboardSection[]) => {
    setSections(newSections);
    localStorage.setItem('dashboard-sections', JSON.stringify(newSections));
  };

  const renderSection = (section: DashboardSection) => {
    if (!section.visible) return null;

    switch (section.type) {
      case 'metrics':
        return (
          <div key={section.id} className="grid grid-cols-1 lg:grid-cols-2 gap-6 col-span-full">
            {/* Leads Card */}
            <Card className="p-4 border-[#7A8063]/30 shadow-lg bg-gradient-to-br from-white to-blue-50 hover:shadow-xl hover:scale-105 transition-all duration-300 group min-h-[140px] flex flex-col justify-between">
              <CardHeader className="flex items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-[#7A8063] group-hover:text-[#5C6047] transition-colors">
                  Total Leads
                </CardTitle>
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Users className="text-blue-600 w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics?.leads.total || 0}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +{metrics?.leads.thisMonth || 0} this month
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Proposals Card */}
            <Card className="p-4 border-[#7A8063]/30 shadow-lg bg-gradient-to-br from-white to-emerald-50 hover:shadow-xl hover:scale-105 transition-all duration-300 group min-h-[140px] flex flex-col justify-between">
              <CardHeader className="flex items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-[#7A8063] group-hover:text-[#5C6047] transition-colors">
                  Total Proposals
                </CardTitle>
                <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                  <FileText className="text-emerald-600 w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics?.proposals.total || 0}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +{metrics?.proposals.thisMonth || 0} this month
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Card */}
            <Card className="p-4 border-[#7A8063]/30 shadow-lg bg-gradient-to-br from-white to-yellow-50 hover:shadow-xl hover:scale-105 transition-all duration-300 group min-h-[140px] flex flex-col justify-between">
              <CardHeader className="flex items-center justify-between pb-3">
                <CardTitle className="text-sm font-medium text-[#7A8063] group-hover:text-[#5C6047] transition-colors">
                  Revenue
                </CardTitle>
                <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                  <DollarSign className="text-yellow-600 w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-gray-900">
                    ${metrics?.revenue.total || 0}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +${metrics?.revenue.thisMonth || 0} this month
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>


          </div>
        );

      case 'quick-notes':
        return (
          <div key={section.id} className="w-full">
            <QuickNotes />
          </div>
        );

      case 'lead-form':
        return (
          <div key={section.id} className="w-full">
            <LeadAddForm onLeadAdded={refresh} />
          </div>
        );

      case 'recent-activity':
        return (
          <Card key={section.id} className="col-span-full border-[#7A8063]/30 shadow-lg bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#7A8063] flex items-center gap-2">
                <Activity className="w-5 h-5" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New lead added: John Doe</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Proposal sent to ABC Corp</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Follow-up scheduled</p>
                    <p className="text-xs text-gray-500">3 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'charts':
        return (
          <Card key={section.id} className="col-span-full border-[#7A8063]/30 shadow-lg bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#7A8063] flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Analytics charts will be displayed here</p>
                  <p className="text-sm">Connect your data source to view charts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'custom':
        return (
          <Card key={section.id} className="border-[#7A8063]/30 shadow-lg bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#7A8063]">
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500">
                  <p>Custom section content</p>
                  <p className="text-sm">Configure this section to display custom content</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const visibleSections = sections
    .filter(section => section.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-8">
      {/* Customization Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Customize your dashboard layout and sections</p>
        </div>
        <DashboardCustomizer sections={sections} onSectionsChange={handleSectionsChange} />
      </div>

      {/* Dynamic Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 auto-rows-min">
        {visibleSections.map(section => renderSection(section))}
      </div>

      {visibleSections.length === 0 && (
        <Card className="border-[#7A8063]/30 shadow-lg bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No sections visible</h3>
              <p className="mb-4">Add or enable sections to customize your dashboard</p>
              <DashboardCustomizer sections={sections} onSectionsChange={handleSectionsChange} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}