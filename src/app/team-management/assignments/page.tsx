'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Users, User, Calendar, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  photo?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  deadline?: string;
}

interface Assignment {
  id: string;
  status: string;
  assignedAt: string;
  notes?: string;
  teamMember: TeamMember;
  project: Project;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  const [newAssignment, setNewAssignment] = useState({
    projectId: '',
    teamMemberId: '',
    department: '',
    assignmentType: 'individual', // 'individual' or 'department'
    status: 'assigned',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, membersRes, projectsRes] = await Promise.all([
        fetch('/api/team-management/assignments'),
        fetch('/api/team-management/members'),
        fetch('/api/team-management/projects')
      ]);

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        setAssignments(assignmentsData);
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setTeamMembers(membersData);
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAssignment.projectId) {
      toast.error('Please select a project');
      return;
    }

    if (newAssignment.assignmentType === 'individual' && !newAssignment.teamMemberId) {
      toast.error('Please select a team member');
      return;
    }

    if (newAssignment.assignmentType === 'department' && !newAssignment.department) {
      toast.error('Please select a department');
      return;
    }

    setFormLoading(true);
    try {
      const response = await fetch('/api/team-management/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAssignment),
      });

      if (response.ok) {
        toast.success('Assignment created successfully!');
        setShowCreateForm(false);
        setNewAssignment({
          projectId: '',
          teamMemberId: '',
          department: '',
          assignmentType: 'individual',
          status: 'assigned',
          notes: ''
        });
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create assignment');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
    } finally {
      setFormLoading(false);
    }
  };

  const updateAssignmentStatus = async (assignmentId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/team-management/assignments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: assignmentId,
          status: newStatus
        }),
      });

      if (response.ok) {
        toast.success('Assignment status updated!');
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update assignment');
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('Failed to update assignment');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <Clock className="h-4 w-4" />;
      case 'in-progress': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.teamMember.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.teamMember.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const departments = [...new Set(teamMembers.map(member => member.department))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading assignments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Project Assignments
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Assign projects to team members and track progress
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Assignment
          </Button>
        </motion.div>

        {/* Create Assignment Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Create New Assignment</h3>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project *</Label>
                  <Select 
                    value={newAssignment.projectId} 
                    onValueChange={(value) => setNewAssignment(prev => ({ ...prev, projectId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assignment Type</Label>
                  <Select 
                    value={newAssignment.assignmentType} 
                    onValueChange={(value) => setNewAssignment(prev => ({ 
                      ...prev, 
                      assignmentType: value,
                      teamMemberId: '',
                      department: ''
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Individual Member
                        </div>
                      </SelectItem>
                      <SelectItem value="department">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Entire Department
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newAssignment.assignmentType === 'individual' && (
                <div className="space-y-2">
                  <Label>Team Member *</Label>
                  <Select 
                    value={newAssignment.teamMemberId} 
                    onValueChange={(value) => setNewAssignment(prev => ({ ...prev, teamMemberId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-2">
                            <span>{member.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {member.department}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newAssignment.assignmentType === 'department' && (
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select 
                    value={newAssignment.department} 
                    onValueChange={(value) => setNewAssignment(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Add any notes or instructions..."
                  value={newAssignment.notes}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? 'Creating...' : 'Create Assignment'}
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-lg p-6 space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search assignments by project, member, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Showing {filteredAssignments.length} of {assignments.length} assignments
          </div>
        </motion.div>

        {/* Assignments List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {filteredAssignments.map((assignment, index) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {assignment.project.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {assignment.project.description}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(assignment.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(assignment.status)}
                              {assignment.status.replace('-', ' ').toUpperCase()}
                            </div>
                          </Badge>
                          <Badge className={getPriorityColor(assignment.project.priority)}>
                            {assignment.project.priority.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{assignment.teamMember.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {assignment.teamMember.department}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}</span>
                        </div>
                        {assignment.project.deadline && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Due: {new Date(assignment.project.deadline).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      {assignment.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                          {assignment.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Select 
                        value={assignment.status} 
                        onValueChange={(value) => updateAssignmentStatus(assignment.id, value)}
                      >
                        <SelectTrigger className="w-full lg:w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredAssignments.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-gray-400 mb-4">
              <Users className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No assignments found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or filters'
                : 'Get started by creating your first assignment'}
            </p>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Assignment
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}