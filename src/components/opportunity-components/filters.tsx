"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Filter, 
  X, 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar,
  TrendingUp,
  Sliders
} from "lucide-react";

interface Filters {
  industry: string;
  location: string;
  valueRange: string;
  priority: string;
  status: string;
  dateRange: string;
}

interface Props {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  activeFiltersCount?: number;
}

const industryOptions = [
  "Technology",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Retail",
  "Education",
  "Real Estate",
  "Energy",
  "Transportation",
  "Entertainment"
];

const valueRangeOptions = [
  { label: "Any Value", value: "all" },
  { label: "Under $10K", value: "0-10000" },
  { label: "$10K - $50K", value: "10000-50000" },
  { label: "$50K - $100K", value: "50000-100000" },
  { label: "$100K - $500K", value: "100000-500000" },
  { label: "$500K+", value: "500000+" }
];

const priorityOptions = [
  { label: "All Priorities", value: "all" },
  { label: "Critical", value: "Critical" },
  { label: "High", value: "High" },
  { label: "Medium", value: "Medium" },
  { label: "Low", value: "Low" }
];

const statusOptions = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "Active" },
  { label: "Pending", value: "Pending" },
  { label: "Review", value: "Review" },
  { label: "Closed", value: "Closed" }
];

const dateRangeOptions = [
  { label: "All Time", value: "all" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "This Year", value: "1y" }
];

export default function OpportunityFilters({ filters, setFilters, activeFiltersCount = 0 }: Props) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const handleChange = (key: keyof Filters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    setFilters({ 
      industry: "all", 
      location: "", 
      valueRange: "all",
      priority: "all",
      status: "all",
      dateRange: "all"
    });
  };

  const getActiveFilters = () => {
    const active = [];
    if (filters.industry && filters.industry !== "all") active.push({ key: 'industry', label: 'Industry', value: filters.industry });
    if (filters.location) active.push({ key: 'location', label: 'Location', value: filters.location });
    if (filters.valueRange && filters.valueRange !== "all") active.push({ key: 'valueRange', label: 'Value Range', value: valueRangeOptions.find(opt => opt.value === filters.valueRange)?.label || filters.valueRange });
    if (filters.priority && filters.priority !== "all") active.push({ key: 'priority', label: 'Priority', value: filters.priority });
    if (filters.status && filters.status !== "all") active.push({ key: 'status', label: 'Status', value: filters.status });
    if (filters.dateRange && filters.dateRange !== "all") active.push({ key: 'dateRange', label: 'Date Range', value: dateRangeOptions.find(opt => opt.value === filters.dateRange)?.label || filters.dateRange });
    return active;
  };

  const activeFilters = getActiveFilters();
  const hasActiveFilters = activeFilters.length > 0;

  const removeFilter = (key: keyof Filters) => {
    const resetValue = key === "location" ? "" : "all";
    handleChange(key, resetValue);
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-slate-800">Filters</h3>
              {hasActiveFilters && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                  {activeFilters.length}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  onClick={resetFilters}
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 hover:text-slate-800 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              )}
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-800"
              >
                <Sliders className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <Badge
                  key={filter.key}
                  className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
                  onClick={() => removeFilter(filter.key as keyof Filters)}
                >
                  <span className="text-xs">{filter.label}: {filter.value}</span>
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}

          {/* Basic Filters - Always Visible */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Industry
              </Label>
              <Select value={filters.industry} onValueChange={(value) => handleChange("industry", value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industryOptions.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Location
              </Label>
              <Input
                type="text"
                value={filters.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="Enter location"
                className="h-9"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Value Range
              </Label>
              <Select value={filters.valueRange} onValueChange={(value) => handleChange("valueRange", value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {valueRangeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Priority
              </Label>
              <Select value={filters.priority} onValueChange={(value) => handleChange("priority", value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters - Expandable */}
          {isExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Date Range
                </Label>
                <Select value={filters.dateRange} onValueChange={(value) => handleChange("dateRange", value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRangeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
