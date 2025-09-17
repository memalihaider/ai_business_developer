"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Phone, 
  MessageSquare, 
  Mail, 
  MapPin, 
  Building2, 
  CreditCard,
  Plus,
  Trash2,
  Calendar,
  FileText,
  Printer,
  Download,
  Edit3
} from "lucide-react"

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

interface CompanyInfo {
  name: string
  phone: string
  whatsapp: string
  email: string
  offices: string[]
  bankDetails: {
    accountHolder: string
    bankName: string
    accountNumber: string
    iban: string
  }
}

interface InvoiceData {
  invoiceNumber: string
  date: string
  dueDate: string
  clientName: string
  clientEmail: string
  clientAddress: string
  clientPhone: string
  items: InvoiceItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  currency: string
  notes: string
  terms: string
}

const defaultCompanyInfo: CompanyInfo = {
  name: "Largify Solutions",
  phone: "+92-309-6993535",
  whatsapp: "+966 59 736 9443",
  email: "info@largifysolutions.com",
  offices: [
    "Hassan Bin Thabit road, Riyadh, Saudi Arabia",
    "Lahore, Punjab, Pakistan",
    "Burewala, Punjab, Pakistan"
  ],
  bankDetails: {
    accountHolder: "MUHAMMAD ALI HAIDER",
    bankName: "Meezan Bank - MEEZAN DIGITAL CENTRE",
    accountNumber: "00300109180495",
    iban: "PK27MEZN0000300109180495"
  }
}

const defaultInvoiceData: InvoiceData = {
  invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  clientName: "",
  clientEmail: "",
  clientAddress: "",
  clientPhone: "",
  items: [{
    id: "1",
    description: "",
    quantity: 1,
    rate: 0,
    amount: 0
  }],
  subtotal: 0,
  taxRate: 0,
  taxAmount: 0,
  totalAmount: 0,
  currency: "USD",
  notes: "",
  terms: "Payment is due within 30 days of invoice date. Late payments may incur additional charges."
}

interface CustomizableInvoiceTemplateProps {
  onSave?: (invoiceData: InvoiceData, companyInfo: CompanyInfo) => void
  initialData?: Partial<InvoiceData>
  initialCompanyInfo?: Partial<CompanyInfo>
  readOnly?: boolean
}

export default function CustomizableInvoiceTemplate({
  onSave,
  initialData,
  initialCompanyInfo,
  readOnly = false
}: CustomizableInvoiceTemplateProps) {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    ...defaultInvoiceData,
    ...initialData
  })
  
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    ...defaultCompanyInfo,
    ...initialCompanyInfo
  })
  
  const [isEditing, setIsEditing] = useState(!readOnly)
  const [showBankDetails, setShowBankDetails] = useState(true)

  // Calculate totals
  React.useEffect(() => {
    const subtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0)
    const taxAmount = subtotal * (invoiceData.taxRate / 100)
    const totalAmount = subtotal + taxAmount
    
    setInvoiceData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      totalAmount
    }))
  }, [invoiceData.items, invoiceData.taxRate])

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0
    }
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, newItem]
    })
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...invoiceData.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate
    }
    
    setInvoiceData({ ...invoiceData, items: updatedItems })
  }

  const removeItem = (index: number) => {
    if (invoiceData.items.length > 1) {
      const updatedItems = invoiceData.items.filter((_, i) => i !== index)
      setInvoiceData({ ...invoiceData, items: updatedItems })
    }
  }

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!invoiceData.clientName || !invoiceData.clientEmail) {
        alert('Please fill in client name and email before saving.')
        return
      }
      
      if (invoiceData.items.length === 0 || !invoiceData.items[0].description) {
        alert('Please add at least one item before saving.')
        return
      }
      
      // Calculate totals
      const subtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0)
      const taxAmount = subtotal * (invoiceData.taxRate || 0) / 100
      const totalAmount = subtotal + taxAmount
      
      const invoicePayload = {
        clientName: invoiceData.clientName,
        clientEmail: invoiceData.clientEmail,
        clientAddress: invoiceData.clientAddress || '',
        clientPhone: invoiceData.clientPhone || '',
        description: invoiceData.description || 'Invoice from template',
        amount: totalAmount,
        currency: invoiceData.currency || 'USD',
        dueDate: invoiceData.dueDate || '',
        taxRate: invoiceData.taxRate || 0,
        terms: invoiceData.terms || '',
        items: invoiceData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        }))
      }
      
      let response
      if (invoiceData.id) {
        // Update existing invoice
        response = await fetch(`/api/invoices/${invoiceData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoicePayload)
        })
      } else {
        // Create new invoice
        response = await fetch('/api/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoicePayload)
        })
      }
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.invoice) {
          // Update the invoice data with the saved invoice
          setInvoiceData({
            ...invoiceData,
            id: result.invoice.id,
            invoiceNumber: result.invoice.invoiceNumber,
            createdAt: result.invoice.createdAt
          })
          alert(`Invoice ${invoiceData.id ? 'updated' : 'created'} successfully!`)
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save invoice')
      }
      
      // Also call the optional onSave prop if provided
      if (onSave) {
        onSave(invoiceData, companyInfo)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert(`Failed to save invoice: ${error.message}`)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleEmail = async () => {
    try {
      // Check if we have a valid invoice ID and email
      if (!invoiceData.id) {
        alert('Please save the invoice first before sending email.')
        return
      }
      
      if (!invoiceData.clientEmail) {
        alert('Please enter a client email address.')
        return
      }
      
      const response = await fetch('/api/invoices/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoiceData.id,
          recipientEmail: invoiceData.clientEmail,
          subject: `Invoice ${invoiceData.invoiceNumber || 'Template'} from ${companyInfo.name}`,
          message: `Dear ${invoiceData.clientName},\n\nPlease find attached your invoice.\n\nThank you for your business!\n\nBest regards,\n${companyInfo.name}`,
          includeAttachment: true
        })
      })
      
      if (response.ok) {
        alert('Invoice emailed successfully!')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }
    } catch (error) {
      console.error('Email error:', error)
      alert(`Failed to send invoice email: ${error.message}`)
    }
  }

  const handleExport = async () => {
    try {
      // First try with invoice ID if it exists
      let response;
      if (invoiceData.id) {
        response = await fetch(`/api/invoices/export?id=${invoiceData.id}&format=pdf`, {
          method: 'GET'
        })
      }
      
      // If no ID or request failed, send invoice data in body
      if (!invoiceData.id || !response || !response.ok) {
        response = await fetch(`/api/invoices/export?id=temp-${Date.now()}&format=pdf`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            invoice: {
              ...invoiceData,
              items: invoiceData.items || []
            }
          })
        })
      }
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoiceData.invoiceNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to export PDF')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert(`Failed to export PDF: ${error.message}. Please try again.`)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoiceData.currency
    }).format(amount)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-content, .invoice-content * {
            visibility: visible;
          }
          .invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            font-size: 12px;
            line-height: 1.3;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          @page {
            margin: 0.4in;
            size: A4;
          }
          .invoice-content h1 {
            font-size: 20px !important;
            margin-bottom: 8px !important;
          }
          .invoice-content h2 {
            font-size: 16px !important;
            margin-bottom: 6px !important;
          }
          .invoice-content h3 {
            font-size: 14px !important;
            margin-bottom: 4px !important;
          }
          .invoice-content .text-3xl {
            font-size: 20px !important;
          }
          .invoice-content .text-2xl {
            font-size: 16px !important;
          }
          .invoice-content .text-xl {
            font-size: 14px !important;
          }
          .invoice-content .text-lg {
            font-size: 13px !important;
          }
          .invoice-content .text-sm {
            font-size: 10px !important;
          }
          .invoice-content .text-xs {
            font-size: 9px !important;
          }
          .invoice-content .p-6 {
             padding: 12px !important;
           }
           .invoice-content .p-8 {
             padding: 16px !important;
           }
          .invoice-content .mb-8 {
            margin-bottom: 12px !important;
          }
          .invoice-content .mb-6 {
            margin-bottom: 8px !important;
          }
          .invoice-content .mb-4 {
            margin-bottom: 6px !important;
          }
          .invoice-content .gap-8 {
            gap: 12px !important;
          }
          .invoice-content .gap-4 {
            gap: 8px !important;
          }
          .invoice-content .space-y-4 > * + * {
            margin-top: 6px !important;
          }
          .invoice-content .space-y-2 > * + * {
            margin-top: 4px !important;
          }
          .invoice-content table {
            font-size: 10px !important;
          }
          .invoice-content .mt-8 {
            margin-top: 12px !important;
          }
          .invoice-content .pt-6 {
            padding-top: 8px !important;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-2xl font-bold text-gray-900">Invoice Template</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            {isEditing ? 'Preview' : 'Edit'}
          </Button>
          <Button
            variant="outline"
            onClick={handleEmail}
            className="flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Email
          </Button>

          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>
          {onSave && (
            <Button
              onClick={handleSave}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Save Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Template */}
      <Card className="invoice-container shadow-lg invoice-content">
        <CardContent className="p-6">
          {/* Header Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Company Information */}
            <div className="space-y-2">
              {isEditing ? (
                <Input
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                  className="text-3xl font-bold border-0 p-0 h-auto text-blue-600"
                  placeholder="Company Name"
                />
              ) : (
                <h1 className="text-3xl font-bold text-blue-600">{companyInfo.name}</h1>
              )}
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-500" />
                  {isEditing ? (
                    <Input
                      value={companyInfo.phone}
                      onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                      placeholder="Phone Number"
                      className="border-0 p-0 h-auto"
                    />
                  ) : (
                    <span>Phone: {companyInfo.phone}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-500" />
                  {isEditing ? (
                    <Input
                      value={companyInfo.whatsapp}
                      onChange={(e) => setCompanyInfo({...companyInfo, whatsapp: e.target.value})}
                      placeholder="WhatsApp Number"
                      className="border-0 p-0 h-auto"
                    />
                  ) : (
                    <span>Message: {companyInfo.whatsapp}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-500" />
                  {isEditing ? (
                    <Input
                      value={companyInfo.email}
                      onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
                      placeholder="Email Address"
                      className="border-0 p-0 h-auto"
                    />
                  ) : (
                    <span>Email: {companyInfo.email}</span>
                  )}
                </div>
              </div>
              
              {/* Office Locations */}
              <div className="space-y-1">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Office Locations:
                </h3>
                {companyInfo.offices.map((office, index) => (
                  <div key={index} className="flex items-start gap-1 text-xs text-gray-600">
                    <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    {isEditing ? (
                      <Input
                        value={office}
                        onChange={(e) => {
                          const newOffices = [...companyInfo.offices]
                          newOffices[index] = e.target.value
                          setCompanyInfo({...companyInfo, offices: newOffices})
                        }}
                        className="border-0 p-0 h-auto"
                      />
                    ) : (
                      <span>{office}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Invoice Details */}
            <div className="space-y-2">
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">INVOICE</h2>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Invoice Number:</span>
                    {isEditing ? (
                      <Input
                        value={invoiceData.invoiceNumber}
                        onChange={(e) => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})}
                        className="w-32 text-right border-0 p-0 h-auto"
                      />
                    ) : (
                      <span className="font-bold">{invoiceData.invoiceNumber}</span>
                    )}
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium">Date:</span>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={invoiceData.date}
                        onChange={(e) => setInvoiceData({...invoiceData, date: e.target.value})}
                        className="w-32 text-right border-0 p-0 h-auto"
                      />
                    ) : (
                      <span>{new Date(invoiceData.date).toLocaleDateString()}</span>
                    )}
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium">Due Date:</span>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={invoiceData.dueDate}
                        onChange={(e) => setInvoiceData({...invoiceData, dueDate: e.target.value})}
                        className="w-32 text-right border-0 p-0 h-auto"
                      />
                    ) : (
                      <span>{new Date(invoiceData.dueDate).toLocaleDateString()}</span>
                    )}
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium">Currency:</span>
                    {isEditing ? (
                      <Select
                        value={invoiceData.currency}
                        onValueChange={(value) => setInvoiceData({...invoiceData, currency: value})}
                      >
                        <SelectTrigger className="w-20 border-0 p-0 h-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="SAR">SAR</SelectItem>
                          <SelectItem value="PKR">PKR</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span>{invoiceData.currency}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Bill To:
            </h3>
            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
              {isEditing ? (
                <>
                  <Input
                    value={invoiceData.clientName}
                    onChange={(e) => setInvoiceData({...invoiceData, clientName: e.target.value})}
                    placeholder="Client Name"
                    className="font-semibold"
                  />
                  <Input
                    value={invoiceData.clientEmail}
                    onChange={(e) => setInvoiceData({...invoiceData, clientEmail: e.target.value})}
                    placeholder="Client Email"
                  />
                  <Input
                    value={invoiceData.clientPhone}
                    onChange={(e) => setInvoiceData({...invoiceData, clientPhone: e.target.value})}
                    placeholder="Client Phone"
                  />
                  <Textarea
                    value={invoiceData.clientAddress}
                    onChange={(e) => setInvoiceData({...invoiceData, clientAddress: e.target.value})}
                    placeholder="Client Address"
                    rows={2}
                  />
                </>
              ) : (
                <>
                  <div className="font-semibold text-lg">{invoiceData.clientName}</div>
                  <div className="text-gray-600">{invoiceData.clientEmail}</div>
                  {invoiceData.clientPhone && <div className="text-gray-600">{invoiceData.clientPhone}</div>}
                  {invoiceData.clientAddress && <div className="text-gray-600 whitespace-pre-line">{invoiceData.clientAddress}</div>}
                </>
              )}
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">Items & Services</h3>
              {isEditing && (
                <Button onClick={addItem} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="border border-gray-300 px-3 py-1.5 text-left">Description</th>
                    <th className="border border-gray-300 px-3 py-1.5 text-center w-20">Qty</th>
                    <th className="border border-gray-300 px-3 py-1.5 text-right w-32">Rate</th>
                    <th className="border border-gray-300 px-3 py-1.5 text-right w-32">Amount</th>
                    {isEditing && <th className="border border-gray-300 px-3 py-1.5 text-center w-16">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-1.5">
                        {isEditing ? (
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="Item description"
                            className="border-0 p-0"
                          />
                        ) : (
                          item.description
                        )}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="border-0 p-0 text-center"
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                            className="border-0 p-0 text-right"
                          />
                        ) : (
                          formatCurrency(item.rate)
                        )}
                      </td>
                      <td className="border border-gray-300 px-3 py-1.5 text-right font-semibold">
                        {formatCurrency(item.amount)}
                      </td>
                      {isEditing && (
                        <td className="border border-gray-300 px-3 py-1.5 text-center">
                          <Button
                            onClick={() => removeItem(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700"
                            disabled={invoiceData.items.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div></div>
            <div className="space-y-1">
              <div className="flex justify-between py-2 border-b">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(invoiceData.subtotal)}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="flex items-center gap-2">
                  Tax Rate:
                  {isEditing && (
                    <Input
                      type="number"
                      step="0.01"
                      value={invoiceData.taxRate}
                      onChange={(e) => setInvoiceData({...invoiceData, taxRate: parseFloat(e.target.value) || 0})}
                      className="w-16 border-0 p-0 h-auto text-center"
                    />
                  )}
                  {!isEditing && `(${invoiceData.taxRate}%)`}
                </span>
                <span className="font-semibold">{formatCurrency(invoiceData.taxAmount)}</span>
              </div>
              
              <div className="flex justify-between py-3 border-t-2 border-gray-800 text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-blue-600">{formatCurrency(invoiceData.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          {showBankDetails && (
            <div className="mb-4 bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Bank Account Details:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Account Holder:</span>
                  {isEditing ? (
                    <Input
                      value={companyInfo.bankDetails.accountHolder}
                      onChange={(e) => setCompanyInfo({
                        ...companyInfo,
                        bankDetails: {...companyInfo.bankDetails, accountHolder: e.target.value}
                      })}
                      className="mt-1"
                    />
                  ) : (
                    <div className="font-semibold">{companyInfo.bankDetails.accountHolder}</div>
                  )}
                </div>
                <div>
                  <span className="font-medium">Bank:</span>
                  {isEditing ? (
                    <Input
                      value={companyInfo.bankDetails.bankName}
                      onChange={(e) => setCompanyInfo({
                        ...companyInfo,
                        bankDetails: {...companyInfo.bankDetails, bankName: e.target.value}
                      })}
                      className="mt-1"
                    />
                  ) : (
                    <div className="font-semibold">{companyInfo.bankDetails.bankName}</div>
                  )}
                </div>
                <div>
                  <span className="font-medium">Account Number:</span>
                  {isEditing ? (
                    <Input
                      value={companyInfo.bankDetails.accountNumber}
                      onChange={(e) => setCompanyInfo({
                        ...companyInfo,
                        bankDetails: {...companyInfo.bankDetails, accountNumber: e.target.value}
                      })}
                      className="mt-1"
                    />
                  ) : (
                    <div className="font-semibold">{companyInfo.bankDetails.accountNumber}</div>
                  )}
                </div>
                <div>
                  <span className="font-medium">IBAN:</span>
                  {isEditing ? (
                    <Input
                      value={companyInfo.bankDetails.iban}
                      onChange={(e) => setCompanyInfo({
                        ...companyInfo,
                        bankDetails: {...companyInfo.bankDetails, iban: e.target.value}
                      })}
                      className="mt-1"
                    />
                  ) : (
                    <div className="font-semibold">{companyInfo.bankDetails.iban}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes and Terms */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Notes:</h3>
              {isEditing ? (
                <Textarea
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData({...invoiceData, notes: e.target.value})}
                  placeholder="Additional notes or comments"
                  rows={4}
                />
              ) : (
                <div className="text-sm text-gray-600 whitespace-pre-line">
                  {invoiceData.notes || 'No additional notes'}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Terms & Conditions:</h3>
              {isEditing ? (
                <Textarea
                  value={invoiceData.terms}
                  onChange={(e) => setInvoiceData({...invoiceData, terms: e.target.value})}
                  placeholder="Payment terms and conditions"
                  rows={4}
                />
              ) : (
                <div className="text-sm text-gray-600 whitespace-pre-line">
                  {invoiceData.terms}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t text-center text-xs text-gray-500">
            <p>Thank you for your business!</p>
            <p className="mt-2">This invoice was generated on {new Date().toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}