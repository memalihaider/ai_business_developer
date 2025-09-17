"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  List, 
  Download, 
  FileText, 
  Search, 
  Filter, 
  TrendingUp, 
  DollarSign,
  Building2,
  Calendar,
  Eye,
  Star,
  Brain
} from "lucide-react";

interface Opportunity {
  id: number;
  title: string;
  industry: string;
  value: string;
  priority?: string;
  confidence?: number;
  status?: string;
  dateAdded?: string;
  description?: string;
}

interface Props {
  opportunities: Opportunity[];
  onAnalyze?: (opportunity: Opportunity) => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-800 border-green-200';
    case 'Pending': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Review': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function OpportunityList({ opportunities, onAnalyze }: Props) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'title' | 'industry' | 'value' | 'priority'>('title');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  const filteredOpportunities = React.useMemo(() => {
    let filtered = opportunities.filter(opp => 
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.industry.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (sortBy === 'value') {
        aValue = parseFloat(a.value.replace(/[^0-9.-]+/g, '')) || 0;
        bValue = parseFloat(b.value.replace(/[^0-9.-]+/g, '')) || 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [opportunities, searchTerm, sortBy, sortOrder]);

  const exportToCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Title,Industry,Value,Priority,Status,Date Added\n"
      + filteredOpportunities.map(opp => 
          `"${opp.title}","${opp.industry}","${opp.value}","${opp.priority || 'N/A'}","${opp.status || 'N/A'}","${opp.dateAdded || 'N/A'}"`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `opportunities_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    // Enhanced PDF export simulation
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Opportunities Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Opportunities Report</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Industry</th>
                  <th>Value</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredOpportunities.map(opp => `
                  <tr>
                    <td>${opp.title}</td>
                    <td>${opp.industry}</td>
                    <td>${opp.value}</td>
                    <td>${opp.priority || 'N/A'}</td>
                    <td>${opp.status || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <List className="w-5 h-5 text-emerald-500" />
            Opportunities List
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
              {filteredOpportunities.length}
            </Badge>
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64 h-9"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                className="text-xs hover:bg-slate-50"
              >
                <Download className="w-3 h-3 mr-1" />
                CSV
              </Button>
              <Button
                onClick={exportToPDF}
                variant="outline"
                size="sm"
                className="text-xs hover:bg-slate-50"
              >
                <FileText className="w-3 h-3 mr-1" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredOpportunities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center">
              <List className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-slate-600 mb-2">
              {searchTerm ? 'No opportunities match your search' : 'No opportunities found'}
            </p>
            <p className="text-xs text-slate-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Start scanning to discover new opportunities'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3">
              {filteredOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="p-4 rounded-xl bg-gradient-to-r from-white to-slate-50 border border-slate-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-slate-800 text-sm">{opp.title}</h4>
                    {opp.priority && (
                      <Badge className={`text-xs ${getPriorityColor(opp.priority)}`}>
                        {opp.priority}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Building2 className="w-3 h-3" />
                      <span>{opp.industry}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <DollarSign className="w-3 h-3" />
                      <span className="font-medium">{opp.value}</span>
                    </div>
                    
                    {opp.status && (
                      <Badge className={`text-xs w-fit ${getStatusColor(opp.status)}`}>
                        {opp.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th 
                      className="text-left py-3 px-4 font-semibold text-slate-700 cursor-pointer hover:text-slate-900 transition-colors"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center gap-1">
                        Title
                        {sortBy === 'title' && (
                          <TrendingUp className={`w-3 h-3 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 font-semibold text-slate-700 cursor-pointer hover:text-slate-900 transition-colors"
                      onClick={() => handleSort('industry')}
                    >
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        Industry
                        {sortBy === 'industry' && (
                          <TrendingUp className={`w-3 h-3 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
                        )}
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-4 font-semibold text-slate-700 cursor-pointer hover:text-slate-900 transition-colors"
                      onClick={() => handleSort('value')}
                    >
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Value
                        {sortBy === 'value' && (
                          <TrendingUp className={`w-3 h-3 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
                        )}
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Priority
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpportunities.map((opp, index) => (
                    <tr
                      key={opp.id}
                      className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${
                        index % 2 === 0 ? 'bg-white/50' : 'bg-slate-50/30'
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-800">{opp.title}</div>
                        {opp.description && (
                          <div className="text-xs text-slate-500 mt-1 truncate max-w-xs">
                            {opp.description}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-600">{opp.industry}</td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-emerald-600">{opp.value}</span>
                      </td>
                      <td className="py-4 px-4">
                        {opp.priority ? (
                          <Badge className={`text-xs ${getPriorityColor(opp.priority)}`}>
                            {opp.priority}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {opp.status ? (
                          <Badge className={`text-xs ${getStatusColor(opp.status)}`}>
                            {opp.status}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-slate-100"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-slate-100"
                            onClick={() => onAnalyze?.(opp)}
                            title="Analyze Opportunity"
                          >
                            <Brain className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-slate-100"
                          >
                            <Star className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
