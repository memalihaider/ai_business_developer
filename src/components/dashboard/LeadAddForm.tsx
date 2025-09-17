"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  UserPlus, 
  Mail, 
  Phone, 
  Building, 
  DollarSign, 
  Flag, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLeads } from "@/contexts/LeadContext"

interface LeadFormData {
  name: string
  email: string
  phone: string
  company: string
  value: string
  status: string
  priority: string
  notes: string
}

const LEAD_STATUSES = [
  { value: "New", label: "New", color: "bg-blue-100 text-blue-800" },
  { value: "Contacted", label: "Contacted", color: "bg-yellow-100 text-yellow-800" },
  { value: "Qualified", label: "Qualified", color: "bg-green-100 text-green-800" },
  { value: "Proposal", label: "Proposal Sent", color: "bg-purple-100 text-purple-800" },
  { value: "Negotiation", label: "In Negotiation", color: "bg-orange-100 text-orange-800" },
  { value: "Won", label: "Won", color: "bg-emerald-100 text-emerald-800" },
  { value: "Lost", label: "Lost", color: "bg-red-100 text-red-800" }
]

const PRIORITIES = [
  { value: "Low", label: "Low", color: "bg-gray-100 text-gray-800" },
  { value: "Medium", label: "Medium", color: "bg-blue-100 text-blue-800" },
  { value: "High", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "Urgent", label: "Urgent", color: "bg-red-100 text-red-800" }
]

export default function LeadAddForm({ onLeadAdded }: { onLeadAdded?: () => void }) {
  const { addLead, refreshLeads } = useLeads();
  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    value: "",
    status: "New",
    priority: "Medium",
    notes: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState("")

  const handleInputChange = (field: keyof LeadFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear any previous error status when user starts typing
    if (submitStatus === 'error') {
      setSubmitStatus('idle')
      setErrorMessage("")
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setErrorMessage("Lead name is required")
      return false
    }
    if (!formData.email.trim()) {
      setErrorMessage("Email is required")
      return false
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrorMessage("Please enter a valid email address")
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      setSubmitStatus('error')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage("")

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          value: formData.value || null,
          phone: formData.phone || null,
          company: formData.company || null,
          notes: formData.notes || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create lead')
      }

      const newLead = await response.json()
      
      // Add to context immediately for real-time updates
      if (newLead) {
        addLead(newLead)
      }
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        value: "",
        status: "New",
        priority: "Medium",
        notes: ""
      })
      
      setSubmitStatus('success')
      
      // Call the callback to refresh data
      if (onLeadAdded) {
        onLeadAdded()
      }
      
      // Refresh leads in context to ensure sync
      await refreshLeads()
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSubmitStatus('idle')
      }, 3000)
      
    } catch (error) {
      console.error('Error creating lead:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create lead')
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.name.trim() && formData.email.trim()

  return (
    <Card className="p-6 border-[#7A8063]/30 dark:border-[#7A8063]/20 shadow-lg dark:shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-[#7A8063] flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Add New Lead
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Messages */}
        {submitStatus === 'success' && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Lead added successfully! It will appear in your leads page.
            </AlertDescription>
          </Alert>
        )}
        
        {submitStatus === 'error' && errorMessage && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <UserPlus className="w-3 h-3" />
              Lead Name *
            </label>
            <Input 
              placeholder="Enter lead name" 
              value={formData.name} 
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="border-[#7A8063]/40 focus:border-[#7A8055] focus:ring-[#7A8055]/20 transition-all duration-300" 
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              Email *
            </label>
            <Input 
              type="email"
              placeholder="Enter email address" 
              value={formData.email} 
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="border-[#7A8063]/40 focus:border-[#7A8055] focus:ring-[#7A8055]/20 transition-all duration-300" 
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              Phone
            </label>
            <Input 
              placeholder="Enter phone number" 
              value={formData.phone} 
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="border-[#7A8063]/40 focus:border-[#7A8055] focus:ring-[#7A8055]/20 transition-all duration-300" 
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Building className="w-3 h-3" />
              Company
            </label>
            <Input 
              placeholder="Enter company name" 
              value={formData.company} 
              onChange={(e) => handleInputChange('company', e.target.value)}
              className="border-[#7A8063]/40 focus:border-[#7A8055] focus:ring-[#7A8055]/20 transition-all duration-300" 
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Potential Value
            </label>
            <Input 
              placeholder="e.g. $5,000" 
              value={formData.value} 
              onChange={(e) => handleInputChange('value', e.target.value)}
              className="border-[#7A8063]/40 focus:border-[#7A8055] focus:ring-[#7A8055]/20 transition-all duration-300" 
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)} disabled={isSubmitting}>
              <SelectTrigger className="border-[#7A8063]/40 focus:border-[#7A8055] focus:ring-[#7A8055]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs", status.color)}>
                        {status.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Flag className="w-3 h-3" />
              Priority
            </label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)} disabled={isSubmitting}>
              <SelectTrigger className="border-[#7A8063]/40 focus:border-[#7A8055] focus:ring-[#7A8055]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs", priority.color)}>
                        {priority.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Notes
          </label>
          <Textarea 
            placeholder="Add any additional notes about this lead..." 
            value={formData.notes} 
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="border-[#7A8063]/40 focus:border-[#7A8055] focus:ring-[#7A8055]/20 transition-all duration-300 min-h-[80px] resize-none" 
            disabled={isSubmitting}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="w-full bg-gradient-to-r from-[#7A8063] to-[#5C6047] hover:from-[#7A8055] hover:to-[#4A4D3A] text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding Lead...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Lead
            </>
          )}
        </Button>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          * Required fields. New leads will appear in your leads page immediately.
        </p>
      </CardContent>
    </Card>
  )
}