"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import InvoiceTemplate from "@/components/invoice-template"

import { 
  CreditCard, 
  Receipt, 
  Download, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Mail, 
  Edit, 
  Trash2, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  User,
  Calendar,
  FileText,
  Wallet,
  Smartphone,
  Building2,
    CheckCircle,
    Clock,
    AlertCircle,
    Loader2,
    RefreshCw,
    Activity,
    PieChart,
    Maximize,
    Minimize,
    Monitor
} from "lucide-react"

interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  clientEmail: string
  clientAddress?: string
  clientPhone?: string
  amount: number
  subtotal: number
  taxAmount: number
  totalAmount: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  paymentMethod?: string
  description: string
  items: InvoiceItem[]
  taxRate: number
  dueDate: string
  createdAt: string
  updatedAt: string
  paidAt?: string
  terms?: string
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
  taxRate?: number
}

interface PaymentMethod {
  id: string
  type: 'card' | 'wallet' | 'bank' | 'custom'
  name: string
  icon: React.ReactNode
  enabled: boolean
}

interface Payment {
  id: string
  amount: number
  currency: string
  method: string
  status: 'pending' | 'completed' | 'failed'
  date: string
  description: string
  clientName: string
  clientEmail: string
  metadata?: any
}

interface AnalyticsData {
  paymentTrends: any[]
  revenueReports: any[]
  outstandingBalances: any
  clientAnalytics: any
  performanceMetrics: any
}

interface EmailTemplate {
  id: string
  name: string
  description: string
  subject: string
  htmlContent: string
  textContent: string
  category: string
  tags: string[]
  variables: string[]
  thumbnail?: string
  settings: {
    allowPersonalization: boolean
    trackOpens: boolean
    trackClicks: boolean
    enableABTesting: boolean
  }
  isActive: boolean
}

export default function ComprehensivePaymentPage() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  // Email templates removed - no longer needed
  const [isLoading, setIsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState("30")
  const [currency, setCurrency] = useState("USD")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailInvoice, setEmailInvoice] = useState<Invoice | null>(null)
  const [emailForm, setEmailForm] = useState({
    recipientEmail: '',
    subject: '',
    message: '',
    includeAttachment: true
  })
  const [emailSending, setEmailSending] = useState(false)
  const [pageWidth, setPageWidth] = useState<'narrow' | 'normal' | 'wide'>('normal')
  
  // Edit functionality state
  const [isEditing, setIsEditing] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  
  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    currency: "USD",
    method: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    description: "",
    clientName: "",
    clientEmail: "",
    metadata: {}
  })
  
  // Invoice form state
  const [invoiceForm, setInvoiceForm] = useState({
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    clientPhone: "",
    description: "",
    amount: "",
    currency: "USD",
    dueDate: "",
    taxRate: "0",
    terms: "",
    items: [{ id: "1", description: "", quantity: 1, rate: 0, amount: 0, taxRate: 0 }] as InvoiceItem[]
  })

  // Email form removed - no longer needed

  // Template editing states removed - no longer needed

  // Custom payment methods state
  const [customPaymentMethods, setCustomPaymentMethods] = useState<PaymentMethod[]>([])
  const [showAddCustomMethod, setShowAddCustomMethod] = useState(false)
  const [customMethodForm, setCustomMethodForm] = useState({
    name: "",
    type: "wallet" as 'wallet' | 'bank'
  })

  // Payment methods configuration
  const defaultPaymentMethods: PaymentMethod[] = [
    { id: "google-pay", type: "wallet", name: "Google Pay", icon: <Wallet className="w-5 h-5" />, enabled: true },
    { id: "bank-transfer", type: "bank", name: "Direct Bank Account", icon: <Building2 className="w-5 h-5" />, enabled: true },
    { id: "jazzcash", type: "wallet", name: "JazzCash", icon: <Smartphone className="w-5 h-5" />, enabled: true },
    { id: "payoneer", type: "wallet", name: "Payoneer", icon: <CreditCard className="w-5 h-5" />, enabled: true },
    { id: "nayapay", type: "wallet", name: "NayaPay", icon: <Wallet className="w-5 h-5" />, enabled: true },
    { id: "meezab-bank", type: "bank", name: "Meezab Bank", icon: <Building2 className="w-5 h-5" />, enabled: true },
    { id: "easypaisa", type: "wallet", name: "Easy Paisa", icon: <Smartphone className="w-5 h-5" />, enabled: true }
  ]

  // Combined payment methods (default + custom)
  const paymentMethods = [...defaultPaymentMethods, ...customPaymentMethods]

  // Function to add custom payment method
  const addCustomPaymentMethod = () => {
    if (customMethodForm.name.trim()) {
      const newMethod: PaymentMethod = {
        id: `custom-${Date.now()}`,
        type: "custom",
        name: customMethodForm.name,
        icon: customMethodForm.type === "bank" ? <Building2 className="w-5 h-5" /> : <Wallet className="w-5 h-5" />,
        enabled: true
      }
      setCustomPaymentMethods([...customPaymentMethods, newMethod])
      setCustomMethodForm({ name: "", type: "wallet" })
      setShowAddCustomMethod(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    loadInitialData()
  }, [])

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        refreshData()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isLoading])

  // Refresh analytics when filters change
  useEffect(() => {
    if (invoices.length > 0) {
      loadAnalytics()
    }
  }, [dateRange, currency])

  const loadInitialData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        loadPayments(),
        loadInvoices(),
        loadAnalytics()
      ])
    } catch (error) {
      console.error("Error loading initial data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        loadPayments(),
        loadInvoices(),
        loadAnalytics()
      ])
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const loadPayments = async () => {
    try {
      const response = await fetch('/api/payments')
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error("Error loading payments:", error)
      // Fallback to localStorage
      const savedPayments = localStorage.getItem('payments')
      if (savedPayments) {
        setPayments(JSON.parse(savedPayments))
      }
    }
  }

  const loadInvoices = async () => {
    try {
      const response = await fetch('/api/invoices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
      } else {
        console.error('Failed to load invoices:', response.status, response.statusText)
        // Fallback to localStorage
        const savedInvoices = localStorage.getItem("comprehensive-invoices")
        if (savedInvoices) {
          setInvoices(JSON.parse(savedInvoices))
        }
      }
    } catch (error) {
      console.error("Error loading invoices:", error)
      // Fallback to localStorage
      const savedInvoices = localStorage.getItem("comprehensive-invoices")
      if (savedInvoices) {
        setInvoices(JSON.parse(savedInvoices))
      }
    }
  }

  const loadAnalytics = async () => {
    try {
      // Load analytics data with individual error handling
      const fetchAnalytics = async (type: string) => {
        try {
          const response = await fetch(`/api/analytics?type=${type}&period=${dateRange}d&currency=${currency}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          if (response.ok) {
            const data = await response.json()
            return data.data || {}
          } else {
            console.error(`Failed to load ${type} analytics:`, response.status, response.statusText)
            return {}
          }
        } catch (error) {
          console.error(`Error loading ${type} analytics:`, error)
          return {}
        }
      }

      const [paymentsData, revenueData, invoicesData, clientsData] = await Promise.all([
        fetchAnalytics('payments'),
        fetchAnalytics('revenue'),
        fetchAnalytics('invoices'),
        fetchAnalytics('clients')
      ])

      setAnalytics({
        paymentTrends: paymentsData,
        revenueReports: revenueData,
        outstandingBalances: invoicesData,
        clientAnalytics: clientsData,
        performanceMetrics: {}
      })
      
      // Force a re-render to update calculated analytics
      setRefreshing(false)
    } catch (error) {
      console.error("Error loading analytics:", error)
      // Set default empty analytics to prevent UI errors
      setAnalytics({
        paymentTrends: {},
        revenueReports: {},
        outstandingBalances: {},
        clientAnalytics: {},
        performanceMetrics: {}
      })
    }
  }

  // Email template functions removed - no longer needed

  const saveInvoices = (updatedInvoices: Invoice[]) => {
    localStorage.setItem("comprehensive-invoices", JSON.stringify(updatedInvoices))
    setInvoices(updatedInvoices)
  }

  const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString().slice(-6)
    return `INV-${timestamp}`
  }

  const createInvoice = async () => {
    if (!invoiceForm.clientName || !invoiceForm.clientEmail || invoiceForm.items.length === 0) {
      alert("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    try {
      const subtotal = invoiceForm.items.reduce((sum, item) => sum + item.amount, 0)
      const taxAmount = subtotal * (parseFloat(invoiceForm.taxRate) / 100)
      const totalAmount = subtotal + taxAmount
      
      // Create manual invoice
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: invoiceForm.clientName,
          clientEmail: invoiceForm.clientEmail,
          clientAddress: invoiceForm.clientAddress,
          clientPhone: invoiceForm.clientPhone,
          currency: invoiceForm.currency,
          dueDate: invoiceForm.dueDate,
          notes: invoiceForm.description,
          terms: invoiceForm.terms,
          items: invoiceForm.items,
          subtotal,
          taxAmount,
          totalAmount
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        await Promise.all([
        loadInvoices(), // Refresh invoices list
        loadAnalytics() // Refresh analytics
      ])
        
        // Reset form
        setInvoiceForm({
          clientName: "",
          clientEmail: "",
          clientAddress: "",
          clientPhone: "",
          description: "",
          amount: "",
          currency: "USD",
          dueDate: "",
          taxRate: "0",
          terms: "",
          items: [{ id: "1", description: "", quantity: 1, rate: 0, amount: 0, taxRate: 0 }]
        })
        
        alert("Invoice created successfully!")
      } else {
        const error = await response.json()
        alert(`Invoice creation failed: ${error.error}`)
      }
    } catch (error) {
      console.error("Error creating invoice:", error)
      alert("Error creating invoice")
    } finally {
      setIsLoading(false)
    }
  }

  const processPayment = async () => {
    if (!paymentForm.amount || !paymentForm.method) {
      alert("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount) * 100, // Convert to cents
          currency: paymentForm.currency,
          paymentMethod: paymentForm.method,
          description: paymentForm.description,
          clientName: paymentForm.clientName,
          clientEmail: paymentForm.clientEmail,
          metadata: paymentForm.metadata
        }),
      })

      if (response.ok) {
        const data = await response.json()
        await loadPayments() // Refresh payments list
        await Promise.all([
          loadInvoices(), // Refresh invoices list
          loadAnalytics() // Refresh analytics
        ])
        
        alert(`Payment of ${paymentForm.currency} ${paymentForm.amount} processed successfully!`)
        
        // Reset form
        setPaymentForm({
          amount: "",
          currency: "USD",
          method: "",
          cardNumber: "",
          expiryDate: "",
          cvv: "",
          cardholderName: "",
          description: "",
          clientName: "",
          clientEmail: "",
          metadata: {}
        })
      } else {
        const error = await response.json()
        alert(`Payment failed: ${error.error}`)
      }
    } catch (error) {
      console.error("Payment processing error:", error)
      alert("Payment processing failed")
    } finally {
      setIsLoading(false)
    }
  }

  const addInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0
    }
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, newItem]
    })
  }

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...invoiceForm.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate
    }
    
    setInvoiceForm({ ...invoiceForm, items: updatedItems })
  }

  const removeInvoiceItem = (index: number) => {
    if (invoiceForm.items.length > 1) {
      const updatedItems = invoiceForm.items.filter((_, i) => i !== index)
      setInvoiceForm({ ...invoiceForm, items: updatedItems })
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />
      case 'sent': return <Send className="w-4 h-4" />
      case 'overdue': return <AlertCircle className="w-4 h-4" />
      case 'draft': return <FileText className="w-4 h-4" />
      case 'cancelled': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  // Export functionality
  const exportInvoice = async (invoiceId: string, format: 'pdf' | 'csv' | 'excel') => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/invoices/export?id=${invoiceId}&format=${format}`, {
        method: 'GET'
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoiceId}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        alert(`Invoice exported as ${format.toUpperCase()} successfully!`)
      } else {
        alert('Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed')
    } finally {
      setIsLoading(false)
    }
  }



  // sendInvoiceEmail function removed - no longer needed

  // sendEmail function removed - no longer needed

  // View invoice details
  const viewInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowInvoiceDetails(true)
  }

  // Delete invoice functionality
  const confirmDeleteInvoice = (invoice: Invoice) => {
    setInvoiceToDelete(invoice)
    setShowDeleteConfirm(true)
  }

  const deleteInvoice = async () => {
    if (!invoiceToDelete) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/invoices?id=${invoiceToDelete.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await Promise.all([
          loadInvoices(), // Refresh invoices list
          loadAnalytics() // Refresh analytics
        ])
        setShowDeleteConfirm(false)
        setInvoiceToDelete(null)
        alert('Invoice deleted successfully!')
      } else {
        const error = await response.json()
        alert(`Delete failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('Error deleting invoice')
    } finally {
      setIsLoading(false)
    }
  }

  // Email invoice functionality
  const openEmailModal = (invoice: Invoice) => {
    setEmailInvoice(invoice)
    setEmailForm({
      recipientEmail: invoice.clientEmail || '',
      subject: `Invoice ${invoice.invoiceNumber} from Largify Solutions`,
      message: '',
      includeAttachment: true
    })
    setShowEmailModal(true)
  }

  const sendInvoiceEmail = async () => {
    if (!emailInvoice) return
    
    setEmailSending(true)
    try {
      const response = await fetch('/api/invoices/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoiceId: emailInvoice.id,
          recipientEmail: emailForm.recipientEmail,
          subject: emailForm.subject,
          message: emailForm.message,
          includeAttachment: emailForm.includeAttachment
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('Invoice sent successfully!')
        setShowEmailModal(false)
        setEmailInvoice(null)
        setEmailForm({
          recipientEmail: '',
          subject: '',
          message: '',
          includeAttachment: true
        })
      } else {
        alert(`Email failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Error sending email')
    } finally {
      setEmailSending(false)
    }
  }

  // Edit invoice functionality
  const editInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setInvoiceForm({
      clientName: invoice.clientName || '',
      clientEmail: invoice.clientEmail || '',
      clientAddress: invoice.clientAddress || '',
      clientPhone: invoice.clientPhone || '',
      description: invoice.description || '',
      amount: invoice.amount?.toString() || '',
      currency: invoice.currency || 'USD',
      dueDate: invoice.dueDate || '',
      taxRate: invoice.taxRate?.toString() || '0',
      terms: invoice.terms || '',
      items: invoice.items || [{ id: "1", description: "", quantity: 1, rate: 0, amount: 0, taxRate: 0 }]
    })
    setIsEditing(true)
    // Switch to the create-invoice tab for editing
    const tabsTrigger = document.querySelector('[value="create-invoice"]') as HTMLElement
    if (tabsTrigger) {
      tabsTrigger.click()
    }
  }

  const saveEditedInvoice = async () => {
    if (!editingInvoice) return
    
    try {
      const response = await fetch(`/api/invoices/${editingInvoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...invoiceForm,
          amount: parseFloat(invoiceForm.amount) || 0,
          taxRate: parseFloat(invoiceForm.taxRate) || 0
        })
      })
      
      if (response.ok) {
        alert('Invoice updated successfully!')
        setIsEditing(false)
        setEditingInvoice(null)
        loadInvoices() // Refresh the invoice list
      } else {
        alert('Failed to update invoice')
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      alert('Error updating invoice')
    }
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditingInvoice(null)
    // Reset form to default state
    setInvoiceForm({
      clientName: "",
      clientEmail: "",
      clientAddress: "",
      clientPhone: "",
      description: "",
      amount: "",
      currency: "USD",
      dueDate: "",
      taxRate: "0",
      terms: "",
      items: [{ id: "1", description: "", quantity: 1, rate: 0, amount: 0, taxRate: 0 }]
    })
  }

  // Analytics calculations - Fixed to use totalAmount instead of amount
  const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.totalAmount || inv.amount || 0), 0)
  const pendingAmount = invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + (inv.totalAmount || inv.amount || 0), 0)
  const overdueAmount = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (inv.totalAmount || inv.amount || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className={`mx-auto space-y-6 transition-all duration-300 ${
        pageWidth === 'narrow' ? 'max-w-4xl' : 
        pageWidth === 'wide' ? 'max-w-full px-8' : 
        'max-w-7xl'
      }`}>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Payment Management - Largify Solutions</h1>
            <p className="text-slate-600 mt-1">Comprehensive payment processing and invoice management system</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Page Width Controls */}
            <div className="flex items-center gap-1 mr-4">
              <Button
                variant={pageWidth === 'narrow' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPageWidth('narrow')}
                className="px-2"
              >
                <Minimize className="w-4 h-4" />
              </Button>
              <Button
                variant={pageWidth === 'normal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPageWidth('normal')}
                className="px-2"
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant={pageWidth === 'wide' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPageWidth('wide')}
                className="px-2"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
            <Button onClick={() => setActiveTab("create-invoice")} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg border border-blue-100 rounded-xl p-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 hover:bg-white/50 transition-all duration-200 rounded-lg">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="create-invoice" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 hover:bg-white/50 transition-all duration-200 rounded-lg">
              <Plus className="w-4 h-4" />
              Create Invoice
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 hover:bg-white/50 transition-all duration-200 rounded-lg">
              <Receipt className="w-4 h-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="invoice-template" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 hover:bg-white/50 transition-all duration-200 rounded-lg">
              <FileText className="w-4 h-4" />
              Template
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Payment Dashboard</h2>
              <div className="flex items-center gap-2">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshData}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                      <p className="text-2xl font-bold">${(totalRevenue || 0).toFixed(2)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Pending Payments</p>
                      <p className="text-2xl font-bold">${(pendingAmount || 0).toFixed(2)}</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm font-medium">Overdue Amount</p>
                      <p className="text-2xl font-bold">${(overdueAmount || 0).toFixed(2)}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Total Invoices</p>
                      <p className="text-2xl font-bold">{invoices.length}</p>
                    </div>
                    <Receipt className="w-8 h-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Recent Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No invoices created yet</p>
                    <Button 
                      onClick={() => setActiveTab("create-invoice")} 
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      Create Your First Invoice
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoices.slice(0, 5).map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(invoice.status)}
                          <div>
                            <p className="font-medium">{invoice.invoiceNumber}</p>
                            <p className="text-sm text-slate-600">{invoice.clientName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(invoice.amount || 0).toFixed(2)}</p>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>



          {/* Create Invoice Tab */}
          <TabsContent value="create-invoice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Edit className="w-5 h-5" />
                      Edit Invoice - {editingInvoice?.invoiceNumber}
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Create New Invoice
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Client Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Client Name *</label>
                    <Input
                      placeholder="Client Name"
                      value={invoiceForm.clientName}
                      onChange={(e) => setInvoiceForm({...invoiceForm, clientName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Client Email *</label>
                    <Input
                      type="email"
                      placeholder="client@example.com"
                      value={invoiceForm.clientEmail}
                      onChange={(e) => setInvoiceForm({...invoiceForm, clientEmail: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Client Phone</label>
                    <Input
                      placeholder="+1 (555) 123-4567"
                      value={invoiceForm.clientPhone}
                      onChange={(e) => setInvoiceForm({...invoiceForm, clientPhone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Client Address</label>
                    <Textarea
                      placeholder="Client address..."
                      value={invoiceForm.clientAddress}
                      onChange={(e) => setInvoiceForm({...invoiceForm, clientAddress: e.target.value})}
                      rows={2}
                    />
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Currency</label>
                    <Select value={invoiceForm.currency} onValueChange={(value) => setInvoiceForm({...invoiceForm, currency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Due Date</label>
                    <Input
                      type="date"
                      value={invoiceForm.dueDate}
                      onChange={(e) => setInvoiceForm({...invoiceForm, dueDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tax Rate (%)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={invoiceForm.taxRate}
                      onChange={(e) => setInvoiceForm({...invoiceForm, taxRate: e.target.value})}
                    />
                  </div>
                </div>

                {/* Description and Terms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Textarea
                      placeholder="Invoice description..."
                      value={invoiceForm.description}
                      onChange={(e) => setInvoiceForm({...invoiceForm, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Payment Terms</label>
                    <Textarea
                      placeholder="Payment terms and conditions..."
                      value={invoiceForm.terms}
                      onChange={(e) => setInvoiceForm({...invoiceForm, terms: e.target.value})}
                    />
                  </div>
                </div>

                {/* Invoice Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium">Invoice Items</label>
                    <Button onClick={addInvoiceItem} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {invoiceForm.items.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-slate-50 rounded-lg">
                        <div className="col-span-5">
                          <label className="block text-xs font-medium mb-1">Description</label>
                          <Input
                            placeholder="Item description"
                            value={item.description}
                            onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium mb-1">Qty</label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium mb-1">Rate</label>
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateInvoiceItem(index, 'rate', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium mb-1">Amount</label>
                          <Input
                            value={(item.amount || 0).toFixed(2)}
                            readOnly
                            className="bg-gray-100"
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            onClick={() => removeInvoiceItem(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={invoiceForm.items.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invoice Summary */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${invoiceForm.items.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({invoiceForm.taxRate}%):</span>
                      <span>${(invoiceForm.items.reduce((sum, item) => sum + (item.amount || 0), 0) * (parseFloat(invoiceForm.taxRate) / 100)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>${(invoiceForm.items.reduce((sum, item) => sum + (item.amount || 0), 0) * (1 + parseFloat(invoiceForm.taxRate) / 100)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Create/Edit Invoice Buttons */}
                {isEditing ? (
                  <div className="flex gap-3">
                    <Button 
                      onClick={saveEditedInvoice} 
                      disabled={isLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-lg py-3"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <Receipt className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={cancelEdit} 
                      variant="outline"
                      className="flex-1 text-lg py-3"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={createInvoice} 
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Invoice...
                      </>
                    ) : (
                      <>
                        <Receipt className="w-4 h-4 mr-2" />
                        Create Invoice
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Management Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Invoice Management
                  </CardTitle>
                  <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        placeholder="Search invoices..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredInvoices.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No invoices found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Invoice #</th>
                          <th className="text-left p-3 font-medium">Client</th>
                          <th className="text-left p-3 font-medium">Amount</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Due Date</th>
                          <th className="text-left p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInvoices.map((invoice) => (
                          <tr key={invoice.id} className="border-b hover:bg-slate-50">
                            <td className="p-3 font-medium">{invoice.invoiceNumber}</td>
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{invoice.clientName}</p>
                                <p className="text-sm text-slate-600">{invoice.clientEmail}</p>
                              </div>
                            </td>
                            <td className="p-3 font-medium">{invoice.currency} {(invoice.amount || 0).toFixed(2)}</td>
                            <td className="p-3">
                              <Badge className={getStatusColor(invoice.status)}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(invoice.status)}
                                  {invoice.status}
                                </div>
                              </Badge>
                            </td>
                            <td className="p-3">{invoice.dueDate || 'N/A'}</td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  title="View Invoice"
                                  onClick={() => viewInvoiceDetails(invoice)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  title="Edit Invoice"
                                  onClick={() => editInvoice(invoice)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  title="Email Invoice"
                                  onClick={() => openEmailModal(invoice)}
                                >
                                  <Mail className="w-4 h-4" />
                                </Button>


                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-600" 
                                  title="Delete Invoice"
                                  onClick={() => confirmDeleteInvoice(invoice)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* Email Management Tab removed - no longer needed */}
          {/* Invoice Template Tab */}
          <TabsContent value="invoice-template" className="space-y-6">
            <InvoiceTemplate />
          </TabsContent>

        </Tabs>
      </div>

      {/* Template Editor Dialog removed - no longer needed */}

      {/* Add Custom Payment Method Dialog */}
      <Dialog open={showAddCustomMethod} onOpenChange={setShowAddCustomMethod}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Method Name</label>
              <Input
                placeholder="e.g., Sadapay, Oraan, etc."
                value={customMethodForm.name}
                onChange={(e) => setCustomMethodForm({...customMethodForm, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Method Type</label>
              <Select
                value={customMethodForm.type}
                onValueChange={(value: 'wallet' | 'bank') => setCustomMethodForm({...customMethodForm, type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wallet">Digital Wallet</SelectItem>
                  <SelectItem value="bank">Bank Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={addCustomPaymentMethod} className="flex-1">
                Add Method
              </Button>
              <Button variant="outline" onClick={() => setShowAddCustomMethod(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Details Modal */}
      <Dialog open={showInvoiceDetails} onOpenChange={setShowInvoiceDetails}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible print:shadow-none print:border-none">
          <style jsx global>{`
            @media print {
              body { margin: 0; padding: 0; }
              .print\:hidden { display: none !important; }
              .print\:block { display: block !important; }
              .print\:break-after-page { page-break-after: always; }
              .print\:break-inside-avoid { page-break-inside: avoid; }
              .print\:text-black { color: black !important; }
              .print\:bg-white { background-color: white !important; }
              .print\:p-0 { padding: 0 !important; }
              .print\:m-0 { margin: 0 !important; }
              .print\:w-full { width: 100% !important; }
              .print\:max-w-none { max-width: none !important; }
            }
          `}</style>
          <DialogHeader className="print:hidden">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Receipt className="w-6 h-6 text-blue-600" />
              Professional Invoice Preview
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="bg-white print:bg-white">
              {/* Customizable Invoice Display Component */}
              <div className="p-4 sm:p-6 print:p-8 space-y-6 w-full mx-auto font-sans leading-relaxed">
                
                {/* Customizable Company Header */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-8 pb-6 border-b-4 border-blue-600">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xl">LS</span>
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">Largify Solutions</h1>
                        <p className="text-sm text-gray-600 font-medium">Professional Business Services</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="font-medium">123 Business Avenue, Suite 100</p>
                      <p className="font-medium">New York, NY 10001</p>
                      <p className="font-medium">Phone: (555) 123-4567 | Email: info@largifysolutions.com</p>
                    </div>
                  </div>
                  <div className="text-right mt-4 md:mt-0">
                    <h2 className="text-4xl font-bold text-blue-600 mb-4 tracking-wide">INVOICE</h2>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
                      <p className="text-sm text-gray-600 font-medium mb-1">Invoice Number</p>
                      <p className="text-xl font-bold text-blue-800">{selectedInvoice.invoiceNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Customizable Invoice & Client Information Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
                  <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-200">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Invoice Details
                    </h3>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-600">Issue Date:</span>
                        <span className="text-sm font-semibold text-gray-900">{new Date(selectedInvoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-600">Due Date:</span>
                        <span className="text-sm font-semibold text-gray-900">{selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Upon Receipt'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-600">Status:</span>
                        <div className="text-sm font-semibold text-gray-900">
                          <Badge className={`${getStatusColor(selectedInvoice.status)} font-medium`}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(selectedInvoice.status)}
                              {selectedInvoice.status.toUpperCase()}
                            </div>
                          </Badge>
                        </div>
                      </div>
                      {selectedInvoice.paidAt && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium text-gray-600">Paid Date:</span>
                          <span className="text-sm font-semibold text-green-600">{new Date(selectedInvoice.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-4 sm:p-6 rounded-xl border shadow-sm min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-blue-200">
                      <User className="w-5 h-5 text-blue-600" />
                      Bill To
                    </h3>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-600">Client Name:</span>
                        <span className="text-sm font-bold text-gray-900">{selectedInvoice.clientName}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-600">Email:</span>
                        <span className="text-sm font-semibold text-gray-900">{selectedInvoice.clientEmail}</span>
                      </div>
                      {selectedInvoice.clientAddress && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium text-gray-600">Address:</span>
                          <span className="text-sm font-semibold text-gray-900">{selectedInvoice.clientAddress}</span>
                        </div>
                      )}
                      {selectedInvoice.clientPhone && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium text-gray-600">Phone:</span>
                          <span className="text-sm font-semibold text-gray-900">{selectedInvoice.clientPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Customizable Invoice Items Table */}
                <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm mb-8 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6 pb-3 border-b border-gray-200">
                    <FileText className="w-6 h-6 text-blue-600" />
                    Services & Products
                  </h3>
                  
                  <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                          <th className="text-left p-3 sm:p-4 font-semibold tracking-wide">Description</th>
                          <th className="text-center p-3 sm:p-4 font-semibold w-20 sm:w-24 tracking-wide">Qty</th>
                          <th className="text-right p-3 sm:p-4 font-semibold w-28 sm:w-32 tracking-wide">Unit Price</th>
                          <th className="text-right p-3 sm:p-4 font-semibold w-28 sm:w-32 tracking-wide">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {selectedInvoice.items?.map((item, index) => (
                          <tr key={item.id || index} className={`border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="p-3 sm:p-4">
                              <div className="font-semibold text-gray-900 break-words">{item.description}</div>
                            </td>
                            <td className="p-3 sm:p-4 text-center font-semibold text-gray-700">{item.quantity}</td>
                            <td className="p-3 sm:p-4 text-right font-semibold text-gray-700 whitespace-nowrap">{selectedInvoice.currency} {item.rate.toFixed(2)}</td>
                            <td className="p-3 sm:p-4 text-right font-bold text-blue-600 whitespace-nowrap">{selectedInvoice.currency} {item.amount.toFixed(2)}</td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={4} className="p-12 text-center text-gray-500">
                              <FileText className="w-16 h-16 mx-auto mb-3 opacity-40" />
                              <p className="text-lg font-medium">No items found</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Customizable Financial Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8">
                  {/* Payment Terms & Instructions */}
                  <div className="bg-amber-50 border border-amber-200 p-4 sm:p-6 rounded-xl shadow-sm min-w-0">
                    <h4 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2 pb-2 border-b border-amber-200">
                      <Wallet className="w-5 h-5" />
                      Payment Terms & Instructions
                    </h4>
                    <div className="space-y-3 text-sm text-amber-700">
                      <div className="flex flex-col space-y-1">
                        <span className="font-semibold">Payment Due:</span> 
                        <span>{selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Upon Receipt'}</span>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="font-semibold">Payment Methods:</span> 
                        <span>Bank Transfer, Credit Card, Check</span>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="font-semibold">Late Fee:</span> 
                        <span>1.5% per month on overdue amounts</span>
                      </div>
                      {selectedInvoice.terms && (
                        <div className="mt-4 pt-3 border-t border-amber-300">
                          <div className="flex flex-col space-y-1">
                            <span className="font-semibold">Additional Terms:</span>
                          </div>
                          <p className="mt-2">{selectedInvoice.terms}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm min-w-0">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-200">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Invoice Summary
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 font-medium">Subtotal:</span>
                        <span className="font-semibold text-gray-900 whitespace-nowrap">{selectedInvoice.currency} {(selectedInvoice.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 font-medium">Tax ({selectedInvoice.taxRate || 0}%):</span>
                        <span className="font-semibold text-gray-900 whitespace-nowrap">{selectedInvoice.currency} {(selectedInvoice.taxAmount || 0).toFixed(2)}</span>
                      </div>
                      <div className="border-t-2 border-gray-300 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg sm:text-xl font-bold text-gray-900">Total Amount:</span>
                          <span className="text-xl sm:text-2xl font-bold text-blue-600 whitespace-nowrap">{selectedInvoice.currency} {(selectedInvoice.totalAmount || selectedInvoice.amount || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      {selectedInvoice.status === 'paid' && (
                        <div className="bg-green-50 border border-green-200 p-4 rounded-xl mt-4">
                          <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-semibold">Payment Received</span>
                          </div>
                          {selectedInvoice.paidAt && (
                            <p className="text-sm text-green-700 mt-2">Paid on {new Date(selectedInvoice.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Professional Footer */}
                <div className="border-t-2 border-gray-200 pt-6 mt-8">
                  <div className="text-center space-y-2">
                    <p className="text-lg font-semibold text-gray-900">Thank you for your business!</p>
                    <p className="text-sm text-gray-600">For questions about this invoice, please contact us at info@largifysolutions.com or (555) 123-4567</p>
                    <div className="flex justify-center items-center gap-4 mt-4 text-xs text-gray-500">
                      <span>Invoice generated on {new Date().toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Largify Solutions - Professional Business Services</span>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {(selectedInvoice.description || selectedInvoice.terms) && (
                  <div className="space-y-4 mt-8">
                    {selectedInvoice.description && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Description</h3>
                        <p className="text-slate-700 bg-slate-50 p-3 rounded">{selectedInvoice.description}</p>
                      </div>
                    )}
                    {selectedInvoice.terms && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Terms & Conditions</h3>
                        <p className="text-slate-700 bg-slate-50 p-3 rounded">{selectedInvoice.terms}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">

                <Button 
                  variant="outline" 
                  onClick={() => setShowInvoiceDetails(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
       </Dialog>

       {/* Delete Confirmation Dialog */}
       <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2 text-red-600">
               <Trash2 className="w-5 h-5" />
               Delete Invoice
             </DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <p className="text-slate-700">
               Are you sure you want to delete invoice <strong>{invoiceToDelete?.invoiceNumber}</strong>?
             </p>
             <p className="text-sm text-slate-500">
               This action cannot be undone. The invoice will be permanently removed from your records.
             </p>
             {invoiceToDelete?.status === 'paid' && (
               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                 <p className="text-yellow-800 text-sm font-medium">
                   ⚠️ Warning: This invoice has been marked as paid. Deleting it may affect your financial records.
                 </p>
               </div>
             )}
             <div className="flex gap-3 pt-4">
               <Button 
                 variant="outline" 
                 onClick={() => setShowDeleteConfirm(false)}
                 className="flex-1"
                 disabled={isLoading}
               >
                 Cancel
               </Button>
               <Button 
                 onClick={deleteInvoice}
                 className="flex-1 bg-red-600 hover:bg-red-700"
                 disabled={isLoading}
               >
                 {isLoading ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     Deleting...
                   </>
                 ) : (
                   <>
                     <Trash2 className="w-4 h-4 mr-2" />
                     Delete Invoice
                   </>
                 )}
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>

       {/* Email Invoice Modal */}
       <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <Mail className="w-5 h-5" />
               Email Invoice
             </DialogTitle>
           </DialogHeader>
           {emailInvoice && (
             <div className="space-y-4">
               <div className="bg-slate-50 p-4 rounded-lg">
                 <h4 className="font-medium text-slate-900 mb-2">Invoice Details</h4>
                 <div className="grid grid-cols-2 gap-4 text-sm">
                   <div>
                     <span className="text-slate-600">Invoice Number:</span>
                     <span className="ml-2 font-medium">{emailInvoice.invoiceNumber}</span>
                   </div>
                   <div>
                     <span className="text-slate-600">Amount:</span>
                     <span className="ml-2 font-medium">{emailInvoice.currency} {(emailInvoice.totalAmount || emailInvoice.amount || 0).toFixed(2)}</span>
                   </div>
                   <div>
                     <span className="text-slate-600">Client:</span>
                     <span className="ml-2 font-medium">{emailInvoice.clientName}</span>
                   </div>
                   <div>
                     <span className="text-slate-600">Status:</span>
                     <span className="ml-2 font-medium capitalize">{emailInvoice.status}</span>
                   </div>
                 </div>
               </div>

               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">
                     Recipient Email *
                   </label>
                   <input
                     type="email"
                     value={emailForm.recipientEmail}
                     onChange={(e) => setEmailForm({...emailForm, recipientEmail: e.target.value})}
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Enter recipient email address"
                     required
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">
                     Subject
                   </label>
                   <input
                     type="text"
                     value={emailForm.subject}
                     onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Email subject"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">
                     Message (Optional)
                   </label>
                   <textarea
                     value={emailForm.message}
                     onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                     placeholder="Add a personal message (optional)"
                   />
                 </div>

                 <div className="flex items-center gap-2">
                   <input
                     type="checkbox"
                     id="includeAttachment"
                     checked={emailForm.includeAttachment}
                     onChange={(e) => setEmailForm({...emailForm, includeAttachment: e.target.checked})}
                     className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                   />
                   <label htmlFor="includeAttachment" className="text-sm text-slate-700">
                     Include PDF attachment
                   </label>
                 </div>
               </div>

               <div className="flex gap-3 pt-4 border-t">
                 <Button 
                   variant="outline" 
                   onClick={() => setShowEmailModal(false)}
                   className="flex-1"
                   disabled={emailSending}
                 >
                   Cancel
                 </Button>
                 <Button 
                   onClick={sendInvoiceEmail}
                   className="flex-1"
                   disabled={emailSending || !emailForm.recipientEmail}
                 >
                   {emailSending ? (
                     <>
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                       Sending...
                     </>
                   ) : (
                     <>
                       <Mail className="w-4 h-4 mr-2" />
                       Send Invoice
                     </>
                   )}
                 </Button>
               </div>
             </div>
           )}
         </DialogContent>
       </Dialog>
    </div>
  )
}
