"use client";

import { useState, useEffect } from "react";
import { Mail, Users, Clock, Send, Plus, Trash2, Play, Pause, CheckCircle2, Circle, Calendar, Target } from "lucide-react";

type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  phone?: string;
  status: "active" | "inactive" | "unsubscribed";
  createdAt: string;
  lastContact?: string;
};

type EmailSequence = {
  id: string;
  name: string;
  subject: string;
  content: string;
  dayInterval: number;
  isActive: boolean;
};

type ScheduledEmail = {
  id: string;
  leadId: string;
  sequenceId: string;
  scheduledDate: string;
  status: "pending" | "sent" | "failed";
  sentAt?: string;
};

export default function EmailFollowupsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [activeTab, setActiveTab] = useState<"leads" | "sequences" | "scheduled">("leads");
  const [showCreateSequence, setShowCreateSequence] = useState(false);
  const [newSequence, setNewSequence] = useState({
    name: "",
    subject: "",
    content: "",
    dayInterval: 3
  });

  // Fetch leads from database
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch('/api/contacts');
        if (response.ok) {
          const data = await response.json();
          setLeads(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching leads:', error);
      }
    };

    const fetchSequences = async () => {
      // Email sequences functionality has been removed
      setSequences([]);
    };

    const fetchScheduledEmails = async () => {
      try {
        const response = await fetch('/api/scheduled-emails');
        if (response.ok) {
          const data = await response.json();
          setScheduledEmails(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching scheduled emails:', error);
      }
    };

    fetchLeads();
    fetchSequences();
    fetchScheduledEmails();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchLeads();
      fetchScheduledEmails();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(lead => lead.id));
    }
  };

  const handleCreateSequence = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('Email sequences functionality has been removed');
  };

  const handleScheduleEmails = async (sequenceId: string) => {
    if (selectedLeads.length === 0) {
      alert('Please select leads first');
      return;
    }

    try {
      const response = await fetch('/api/schedule-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadIds: selectedLeads,
          sequenceId: sequenceId
        }),
      });

      if (response.ok) {
        const newScheduledEmails = await response.json();
        setScheduledEmails(prev => [...prev, ...newScheduledEmails]);
        setSelectedLeads([]);
        alert(`Scheduled emails for ${selectedLeads.length} leads`);
      }
    } catch (error) {
      console.error('Error scheduling emails:', error);
    }
  };

  const handleDeleteSequence = async (sequenceId: string) => {
    alert('Email sequences functionality has been removed');
  };

  const toggleSequenceStatus = async (sequenceId: string, isActive: boolean) => {
    alert('Email sequences functionality has been removed');
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Mail className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-semibold text-gray-900">Email Follow-ups</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {selectedLeads.length} leads selected
              </span>
              <button
                onClick={() => setShowCreateSequence(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Sequence
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: "leads", label: "Leads", icon: Users },
              { key: "sequences", label: "Email Sequences", icon: Mail },
              { key: "scheduled", label: "Scheduled Emails", icon: Clock }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "leads" && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Lead Management</h2>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedLeads.length === leads.length ? "Deselect All" : "Select All"}
                </button>
              </div>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleLeadSelection(lead.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {selectedLeads.includes(lead.id) ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {lead.firstName} {lead.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.company || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          lead.status === "active" 
                            ? "bg-green-100 text-green-800"
                            : lead.status === "inactive"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "sequences" && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sequences.map((sequence) => (
                <div key={sequence.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{sequence.name}</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleSequenceStatus(sequence.id, sequence.isActive)}
                        className={`p-1 rounded ${
                          sequence.isActive ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        {sequence.isActive ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteSequence(sequence.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600"><strong>Subject:</strong> {sequence.subject}</p>
                    <p className="text-sm text-gray-600"><strong>Interval:</strong> {sequence.dayInterval} days</p>
                    <p className="text-sm text-gray-600 line-clamp-3">{sequence.content}</p>
                  </div>
                  <button
                    onClick={() => handleScheduleEmails(sequence.id)}
                    disabled={selectedLeads.length === 0 || !sequence.isActive}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Schedule for Selected Leads
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "scheduled" && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Scheduled Emails</h2>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sequence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scheduledEmails.map((email) => {
                    const lead = leads.find(l => l.id === email.leadId);
                    const sequence = sequences.find(s => s.id === email.sequenceId);
                    return (
                      <tr key={email.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {lead ? `${lead.firstName} ${lead.lastName}` : "Unknown Lead"}
                          </div>
                          <div className="text-sm text-gray-500">{lead?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{sequence?.name || "Unknown Sequence"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(email.scheduledDate).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            email.status === "sent" 
                              ? "bg-green-100 text-green-800"
                              : email.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {email.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {email.sentAt ? new Date(email.sentAt).toLocaleString() : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Sequence Modal */}
      {showCreateSequence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Email Sequence</h3>
            <form onSubmit={handleCreateSequence} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sequence Name
                </label>
                <input
                  type="text"
                  value={newSequence.name}
                  onChange={(e) => setNewSequence({ ...newSequence, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={newSequence.subject}
                  onChange={(e) => setNewSequence({ ...newSequence, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Content
                </label>
                <textarea
                  value={newSequence.content}
                  onChange={(e) => setNewSequence({ ...newSequence, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Send Interval (days)
                </label>
                <select
                  value={newSequence.dayInterval}
                  onChange={(e) => setNewSequence({ ...newSequence, dayInterval: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>1 day</option>
                  <option value={2}>2 days</option>
                  <option value={3}>3 days</option>
                  <option value={4}>4 days</option>
                  <option value={5}>5 days</option>
                  <option value={7}>1 week</option>
                  <option value={14}>2 weeks</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateSequence(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Create Sequence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
