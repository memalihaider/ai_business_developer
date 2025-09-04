"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Users, Briefcase, FileText, PlusCircle, DollarSign } from "lucide-react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from "recharts"

export default function DashboardPage() {
  // State management
  const [tasks, setTasks] = useState<string[]>([])
  const [taskInput, setTaskInput] = useState("")
  const [leads, setLeads] = useState(124)
  const [proposals, setProposals] = useState(57)
  const [projects, setProjects] = useState(18)
  const [revenue, setRevenue] = useState(25000)
  const [activities, setActivities] = useState<string[]>([
    "📩 New proposal sent to ABC Ltd.",
    "👤 Lead “John Doe” added to CRM.",
    "💼 Deal “Website Project” moved to Negotiation."
  ])

  // Proposal form states
  const [clientName, setClientName] = useState("")
  const [projectTitle, setProjectTitle] = useState("")
  const [proposalNotes, setProposalNotes] = useState("")

  // Pipeline form states
  const [leadName, setLeadName] = useState("")
  const [stage, setStage] = useState("")

  // Functions
  const handleAddTask = () => {
    if (taskInput.trim() === "") return
    setTasks([...tasks, taskInput])
    setActivities([`✅ New task added: ${taskInput}`, ...activities])
    setTaskInput("")
  }

  const handleGenerateProposal = () => {
    if (!clientName || !projectTitle) return
    setProposals(proposals + 1)
    setActivities([`📩 Proposal generated for ${clientName} - ${projectTitle}`, ...activities])
    setClientName("")
    setProjectTitle("")
    setProposalNotes("")
  }

  const handleUpdatePipeline = () => {
    if (!leadName || !stage) return
    setProjects(projects + 1)
    setActivities([`🔄 Lead ${leadName} moved to stage: ${stage}`, ...activities])
    setLeadName("")
    setStage("")
  }

  const data = [
    { name: "Week 1", leads, proposals, projects, revenue },
    { name: "Week 2", leads: leads + 5, proposals: proposals + 2, projects: projects + 1, revenue: revenue + 2000 },
    { name: "Week 3", leads: leads + 10, proposals: proposals + 4, projects: projects + 2, revenue: revenue + 5000 },
    { name: "Week 4", leads: leads + 15, proposals: proposals + 7, projects: projects + 4, revenue: revenue + 8000 },
  ]

  return (
        <div className="p-6 space-y-6 min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#7A8063]">Welcome back 👋</h1>
        <div className="flex gap-2">
          <Input
            placeholder="New Task..."
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            className="w-48 h-8 text-sm border-[#7A8063]/40 focus:border-[#7A8055] focus:ring-[#7A8055]"
          />
          <Button
            size="sm"
            onClick={handleAddTask}
            className="bg-[#7A8063] hover:bg-[#7A8055] text-white h-8 text-xs"
          >
            <PlusCircle className="w-3 h-3 mr-1" /> Add Task
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-2 border-[#7A8063]/30 shadow-sm">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm text-[#7A8063]">Active Leads</CardTitle>
            <Users className="text-[#7A8063] w-4 h-4" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{leads}</p>
            <p className="text-xs text-gray-500">+12 this week</p>
          </CardContent>
        </Card>

        <Card className="p-2 border-[#7A8063]/30 shadow-sm">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm text-[#7A8063]">Proposals Sent</CardTitle>
            <FileText className="text-[#7A8063] w-4 h-4" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{proposals}</p>
            <p className="text-xs text-gray-500">3 awaiting response</p>
          </CardContent>
        </Card>

        <Card className="p-2 border-[#7A8063]/30 shadow-sm">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm text-[#7A8063]">Projects Won</CardTitle>
            <Briefcase className="text-[#7A8063] w-4 h-4" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{projects}</p>
            <p className="text-xs text-gray-500">Great progress 🚀</p>
          </CardContent>
        </Card>

        <Card className="p-2 border-[#7A8063]/30 shadow-sm">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm text-[#7A8063]">Revenue</CardTitle>
            <DollarSign className="text-[#7A8063] w-4 h-4" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">${revenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500">This quarter</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-2 border-[#7A8063]/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-[#7A8063]">Quick Proposal Draft</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="h-8 text-sm border-[#7A8063]/40 focus:border-[#7A8055]" />
            <Input placeholder="Project Title" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} className="h-8 text-sm border-[#7A8063]/40 focus:border-[#7A8055]" />
            <Textarea placeholder="Write proposal notes..." value={proposalNotes} onChange={(e) => setProposalNotes(e.target.value)} className="text-sm border-[#7A8063]/40 focus:border-[#7A8055]" />
            <Button
              size="sm"
              onClick={handleGenerateProposal}
              className="bg-[#7A8063] hover:bg-[#7A8055] text-white text-xs"
            >
              Generate Proposal
            </Button>
          </CardContent>
        </Card>

        <Card className="p-2 border-[#7A8063]/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-[#7A8063]">Pipeline Update</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Lead Name" value={leadName} onChange={(e) => setLeadName(e.target.value)} className="h-8 text-sm border-[#7A8063]/40 focus:border-[#7A8055]" />
            <Input placeholder="Stage (e.g. Contacted, In Progress)" value={stage} onChange={(e) => setStage(e.target.value)} className="h-8 text-sm border-[#7A8063]/40 focus:border-[#7A8055]" />
            <Button
              size="sm"
              onClick={handleUpdatePipeline}
              className="bg-[#7A8063] hover:bg-[#7A8055] text-white text-xs"
            >
              Update Pipeline
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-2 border-[#7A8063]/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-[#7A8063]">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            {activities.map((activity, idx) => (
              <p key={idx}>{activity}</p>
            ))}
          </CardContent>
        </Card>

        <Card className="p-2 border-[#7A8063]/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-[#7A8063]">Task List</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            {tasks.length === 0 ? (
              <p className="text-gray-500">No tasks yet</p>
            ) : (
              tasks.map((task, idx) => (
                <p key={idx} className="p-1 rounded bg-[#7A8063]/10">
                  ✅ {task}
                </p>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Graph Section */}
      <Card className="p-2 border-[#7A8063]/30 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm text-[#7A8063]">Business Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7A8063" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#7A8063" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
              <XAxis dataKey="name" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #7A8063" }} />
              <Area type="monotone" dataKey="revenue" stroke="#7A8063" fillOpacity={1} fill="url(#colorRevenue)" />
              <Line type="monotone" dataKey="leads" stroke="#7A8055" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="proposals" stroke="#9CA18C" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="projects" stroke="#5C6047" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
