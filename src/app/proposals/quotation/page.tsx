"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Copy, Send, FileText, Users, File, Save, Eye, History, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";

// Types
interface QuotationItem {
  id?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total?: number;
  category?: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
}

interface QuotationTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  items: QuotationItem[];
  terms?: string;
  paymentTerms?: string;
  taxRate: number;
  currency: string;
}

interface Quotation {
  id?: string;
  quotationNumber?: string;
  title: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  description?: string;
  status?: string;
  validUntil?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  currency: string;
  notes?: string;
  terms?: string;
  paymentTerms?: string;
  items: QuotationItem[];
}

export default function QuotationGeneratorPage() {
  const router = useRouter();
  
  // Form state
  const [quotation, setQuotation] = useState<Quotation>({
    title: "",
    clientId: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    description: "",
    validUntil: "",
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    discount: 0,
    total: 0,
    currency: "USD",
    notes: "",
    terms: "",
    paymentTerms: "",
    items: [{ name: "", description: "", quantity: 1, unitPrice: 0, category: "" }]
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" | "" }>({ text: "", type: "" });
  
  // Data state
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<QuotationTemplate | null>(null);
  const [savedQuotations, setSavedQuotations] = useState<Quotation[]>([]);
  
  // Dialog states
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSavedQuotations, setShowSavedQuotations] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<string | null>(null);
  const [deletingQuotation, setDeletingQuotation] = useState(false);

  // Load initial data
  useEffect(() => {
    loadClients();
    loadTemplates();
    loadSavedQuotations();
  }, []);

  // Calculate totals when items, tax, or discount change
  useEffect(() => {
    calculateTotals();
  }, [quotation.items, quotation.taxRate, quotation.discount]);

  // Load clients
  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();
      if (data.clients) {
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  // Load templates
  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/quotation-templates');
      const data = await response.json();
      if (data.templates) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  // Load saved quotations
  const loadSavedQuotations = async () => {
    try {
      const response = await fetch('/api/quotations');
      const data = await response.json();
      if (data.quotations) {
        setSavedQuotations(data.quotations);
      }
    } catch (error) {
      console.error('Error loading saved quotations:', error);
    }
  };

  // Currency formatting function
  const formatCurrency = (amount: number, currency: string) => {
    const currencySymbols: { [key: string]: string } = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$',
      PKR: '₨',
      AED: 'د.إ',
      SAR: '﷼',
      QAR: 'ر.ق',
      KWD: 'د.ك',
      BHD: '.د.ب',
      OMR: 'ر.ع.',
      INR: '₹',
      JPY: '¥',
      CNY: '¥',
      AUD: 'A$'
    };
    
    const symbol = currencySymbols[currency] || currency;
    const formattedAmount = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // For Arabic currencies, place symbol after the amount
    if (['AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR'].includes(currency)) {
      return `${formattedAmount} ${symbol}`;
    }
    
    return `${symbol} ${formattedAmount}`;
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = quotation.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const discountAmount = subtotal * (quotation.discount / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = subtotalAfterDiscount * (quotation.taxRate / 100);
    const total = subtotalAfterDiscount + taxAmount;
    
    setQuotation(prev => ({
      ...prev,
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100
    }));
  };

  // Handle quotation field updates
  const updateQuotation = (field: keyof Quotation, value: any) => {
    setQuotation(prev => ({ ...prev, [field]: value }));
  };

  // Handle item updates
  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const updatedItems = [...quotation.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setQuotation(prev => ({ ...prev, items: updatedItems }));
  };

  // Add/remove items
  const addItem = () => {
    setQuotation(prev => ({
      ...prev,
      items: [...prev.items, { name: "", description: "", quantity: 1, unitPrice: 0, category: "" }]
    }));
  };

  const removeItem = (index: number) => {
    if (quotation.items.length > 1) {
      setQuotation(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  // Select client
  const selectClient = (client: Client) => {
    setQuotation(prev => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone || "",
      clientAddress: client.address || ""
    }));
    setShowClientDialog(false);
  };

  // Apply template
  const applyTemplate = (template: QuotationTemplate) => {
    const templateItems = typeof template.items === 'string' 
      ? JSON.parse(template.items) 
      : template.items;
    
    setQuotation(prev => ({
      ...prev,
      title: template.name,
      description: template.description || "",
      notes: template.notes || "",
      terms: template.terms || "",
      paymentTerms: template.paymentTerms || "",
      items: templateItems || prev.items
    }));
    setSelectedTemplate(template);
    setShowTemplateDialog(false);
    setMessage({ text: `Template "${template.name}" applied successfully!`, type: "success" });
  };

  // Save quotation
  const saveQuotation = async () => {
    if (!quotation.title || !quotation.clientName || quotation.items.some(item => !item.name)) {
      setMessage({ text: "Please fill in all required fields (title, client, and item names)", type: "error" });
      return;
    }

    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotation)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: "Quotation saved successfully!", type: "success" });
        // Update quotation with returned data
        setQuotation(prev => ({ ...prev, id: data.quotation.id, quotationNumber: data.quotation.quotationNumber }));
        // Reload saved quotations
        loadSavedQuotations();
        // Optionally redirect to quotation list or view
        setTimeout(() => {
          router.push(`/quotations/${data.quotation.id}`);
        }, 1500);
      } else {
        setMessage({ text: data.error || "Failed to save quotation", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "An error occurred while saving the quotation", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Delete quotation
  const deleteQuotation = async (quotationId: string) => {
    setDeletingQuotation(true);
    try {
      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setMessage({ text: "Quotation deleted successfully!", type: "success" });
        // Reload saved quotations
        loadSavedQuotations();
      } else {
        const data = await response.json();
        setMessage({ text: data.error || "Failed to delete quotation", type: "error" });
      }
    } catch (error) {
      console.error('Error deleting quotation:', error);
      setMessage({ text: "Error deleting quotation", type: "error" });
    } finally {
      setDeletingQuotation(false);
      setShowDeleteConfirm(false);
      setQuotationToDelete(null);
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (quotationId: string) => {
    setQuotationToDelete(quotationId);
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (quotationToDelete) {
      deleteQuotation(quotationToDelete);
    }
  };

  // Reset form
  const resetForm = () => {
    setQuotation({
      title: "",
      clientId: "",
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      description: "",
      validUntil: "",
      subtotal: 0,
      taxRate: 0,
      taxAmount: 0,
      discount: 0,
      total: 0,
      currency: "USD",
      notes: "",
      terms: "",
      paymentTerms: "",
      items: [{ name: "", description: "", quantity: 1, unitPrice: 0, category: "" }]
    });
    setSelectedTemplate(null);
    setMessage({ text: "", type: "" });
  };

  // PDF download
  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("QUOTATION", 20, 30);
    
    // Quotation details
    doc.setFontSize(12);
    doc.text(`Title: ${quotation.title}`, 20, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);
    if (quotation.validUntil) {
      doc.text(`Valid Until: ${new Date(quotation.validUntil).toLocaleDateString()}`, 20, 70);
    }
    
    // Client information
    let yPos = 90;
    doc.setFontSize(14);
    doc.text("Client Information:", 20, yPos);
    doc.setFontSize(12);
    yPos += 15;
    doc.text(`Name: ${quotation.clientName}`, 20, yPos);
    if (quotation.clientEmail) {
      yPos += 10;
      doc.text(`Email: ${quotation.clientEmail}`, 20, yPos);
    }
    if (quotation.clientPhone) {
      yPos += 10;
      doc.text(`Phone: ${quotation.clientPhone}`, 20, yPos);
    }
    if (quotation.clientAddress) {
      yPos += 10;
      doc.text(`Address: ${quotation.clientAddress}`, 20, yPos);
    }
    
    // Items
    yPos += 25;
    doc.setFontSize(14);
    doc.text("Items:", 20, yPos);
    doc.setFontSize(12);
    yPos += 15;
    
    quotation.items.forEach((item, index) => {
      const itemText = `${index + 1}. ${item.name} - ${item.description}`;
      const priceText = `Qty: ${item.quantity} × ${quotation.currency} ${item.unitPrice.toFixed(2)} = ${quotation.currency} ${(item.quantity * item.unitPrice).toFixed(2)}`;
      doc.text(itemText, 20, yPos);
      yPos += 10;
      doc.text(priceText, 30, yPos);
      yPos += 15;
    });
    
    // Totals
    yPos += 10;
    doc.text(`Subtotal: ${quotation.currency} ${quotation.subtotal.toFixed(2)}`, 20, yPos);
    if (quotation.discount > 0) {
      yPos += 10;
      doc.text(`Discount (${quotation.discount}%): -${quotation.currency} ${(quotation.subtotal * quotation.discount / 100).toFixed(2)}`, 20, yPos);
    }
    if (quotation.taxRate > 0) {
      yPos += 10;
      doc.text(`Tax (${quotation.taxRate}%): ${quotation.currency} ${quotation.taxAmount.toFixed(2)}`, 20, yPos);
    }
    yPos += 15;
    doc.setFontSize(14);
    doc.text(`TOTAL: ${quotation.currency} ${quotation.total.toFixed(2)}`, 20, yPos);
    
    // Notes and terms
    if (quotation.notes) {
      yPos += 25;
      doc.setFontSize(12);
      doc.text(`Notes: ${quotation.notes}`, 20, yPos);
    }
    
    if (quotation.terms) {
      yPos += 15;
      doc.text(`Terms: ${quotation.terms}`, 20, yPos);
    }
    
    if (quotation.paymentTerms) {
      yPos += 15;
      doc.text(`Payment Terms: ${quotation.paymentTerms}`, 20, yPos);
    }
    
    doc.save(`quotation-${quotation.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    setMessage({ text: "PDF downloaded successfully!", type: "success" });
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    const itemsText = quotation.items.map((item, i) => 
      `${i + 1}. ${item.name} - ${item.description}\n   Qty: ${item.quantity} × ${quotation.currency} ${item.unitPrice.toFixed(2)} = ${quotation.currency} ${(item.quantity * item.unitPrice).toFixed(2)}`
    ).join('\n');
    
    const text = `QUOTATION: ${quotation.title}\n\nClient: ${quotation.clientName}\nEmail: ${quotation.clientEmail}\n\nItems:\n${itemsText}\n\nSubtotal: ${quotation.currency} ${quotation.subtotal.toFixed(2)}\nTax: ${quotation.currency} ${quotation.taxAmount.toFixed(2)}\nDiscount: -${quotation.currency} ${(quotation.subtotal * quotation.discount / 100).toFixed(2)}\nTOTAL: ${quotation.currency} ${quotation.total.toFixed(2)}\n\nNotes: ${quotation.notes}`;
    
    navigator.clipboard.writeText(text);
    setMessage({ text: "Quotation copied to clipboard!", type: "success" });
  };

  // Copy AI output
  const copyAIText = () => {
    if (generatedQuotation) {
      navigator.clipboard.writeText(generatedQuotation);
      setMessage({ text: "📋 Quotation copied to clipboard!", type: "success" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Quotation Generator</h1>
              <p className="text-gray-600 mt-1">Create professional quotations with ease</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowTemplateDialog(true)} variant="outline" size="sm">
                <File className="w-4 h-4 mr-2" />
                Templates
              </Button>
              <Button onClick={() => setShowSavedQuotations(true)} variant="outline" size="sm">
                <History className="w-4 h-4 mr-2" />
                Saved Quotations
              </Button>
              <Button onClick={downloadPDF} variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button onClick={resetForm} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          {/* Message Alert */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg border ${
              message.type === "success" ? "border-green-500 bg-green-50 text-green-700" :
              message.type === "error" ? "border-red-500 bg-red-50 text-red-700" :
              "border-blue-500 bg-blue-50 text-blue-700"
            }`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow duration-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                  <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div>
                    <Label htmlFor="title" className="text-sm font-semibold text-gray-700 mb-2 block">Quotation Title *</Label>
                    <Input
                      id="title"
                      value={quotation.title}
                      onChange={(e) => updateQuotation('title', e.target.value)}
                      placeholder="Enter a descriptive title for your quotation"
                      required
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="validUntil" className="text-sm font-semibold text-gray-700 mb-2 block">Valid Until</Label>
                      <Input
                        id="validUntil"
                        type="date"
                        value={quotation.validUntil}
                        onChange={(e) => updateQuotation('validUntil', e.target.value)}
                        className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency" className="text-sm font-semibold text-gray-700">Currency</Label>
                      <Select value={quotation.currency} onValueChange={(value) => updateQuotation('currency', value)}>
                        <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value="USD">🇺🇸 USD ($) - US Dollar</SelectItem>
                          <SelectItem value="EUR">🇪🇺 EUR (€) - Euro</SelectItem>
                          <SelectItem value="GBP">🇬🇧 GBP (£) - British Pound</SelectItem>
                          <SelectItem value="CAD">🇨🇦 CAD ($) - Canadian Dollar</SelectItem>
                          <SelectItem value="PKR">🇵🇰 PKR (₨) - Pakistani Rupee</SelectItem>
                          <SelectItem value="AED">🇦🇪 AED (د.إ) - UAE Dirham</SelectItem>
                          <SelectItem value="SAR">🇸🇦 SAR (﷼) - Saudi Riyal</SelectItem>
                          <SelectItem value="QAR">🇶🇦 QAR (ر.ق) - Qatari Riyal</SelectItem>
                          <SelectItem value="KWD">🇰🇼 KWD (د.ك) - Kuwaiti Dinar</SelectItem>
                          <SelectItem value="BHD">🇧🇭 BHD (.د.ب) - Bahraini Dinar</SelectItem>
                          <SelectItem value="OMR">🇴🇲 OMR (ر.ع.) - Omani Rial</SelectItem>
                          <SelectItem value="INR">🇮🇳 INR (₹) - Indian Rupee</SelectItem>
                          <SelectItem value="JPY">🇯🇵 JPY (¥) - Japanese Yen</SelectItem>
                          <SelectItem value="CNY">🇨🇳 CNY (¥) - Chinese Yuan</SelectItem>
                          <SelectItem value="AUD">🇦🇺 AUD ($) - Australian Dollar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-sm font-semibold text-gray-700 mb-2 block">Description</Label>
                    <Textarea
                      id="description"
                      value={quotation.description}
                      onChange={(e) => updateQuotation('description', e.target.value)}
                      placeholder="Provide a detailed description of the services or products being quoted"
                      rows={3}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder-gray-400 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Client Information */}
              <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow duration-200">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-lg font-bold text-gray-800">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                      Client Information
                    </div>
                    <Button onClick={() => setShowClientDialog(true)} variant="outline" size="sm" className="bg-white hover:bg-green-50 border-green-200 text-green-700 hover:text-green-800">
                      <Users className="w-4 h-4 mr-2" />
                      Select Client
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clientName">Client Name *</Label>
                      <Input
                        id="clientName"
                        value={quotation.clientName}
                        onChange={(e) => updateQuotation('clientName', e.target.value)}
                        placeholder="Enter client name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientEmail">Email</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={quotation.clientEmail}
                        onChange={(e) => updateQuotation('clientEmail', e.target.value)}
                        placeholder="client@example.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clientPhone">Phone</Label>
                      <Input
                        id="clientPhone"
                        value={quotation.clientPhone}
                        onChange={(e) => updateQuotation('clientPhone', e.target.value)}
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientAddress">Address</Label>
                      <Input
                        id="clientAddress"
                        value={quotation.clientAddress}
                        onChange={(e) => updateQuotation('clientAddress', e.target.value)}
                        placeholder="Client address"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow duration-200">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-gray-100">
                  <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Plus className="w-5 h-5 text-purple-600" />
                    </div>
                    Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {quotation.items.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Item {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            disabled={quotation.items.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Item Name *</Label>
                            <Input
                              value={item.name}
                              onChange={(e) => updateItem(index, 'name', e.target.value)}
                              placeholder="Item name"
                              required
                            />
                          </div>
                          <div>
                            <Label>Category</Label>
                            <Input
                              value={item.category}
                              onChange={(e) => updateItem(index, 'category', e.target.value)}
                              placeholder="Category"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="Item description"
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label>Unit Price</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label>Total</Label>
                            <Input
                              value={formatCurrency(item.quantity * item.unitPrice, quotation.currency)}
                              disabled
                              className="bg-gray-50 font-semibold text-gray-700"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button type="button" onClick={addItem} variant="outline" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing & Terms */}
              <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow duration-200">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-100">
                  <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FileText className="w-5 h-5 text-orange-600" />
                    </div>
                    Pricing & Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="taxRate">Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={quotation.taxRate}
                        onChange={(e) => updateQuotation('taxRate', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="discount">Discount (%)</Label>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={quotation.discount}
                        onChange={(e) => updateQuotation('discount', Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Input
                      id="paymentTerms"
                      value={quotation.paymentTerms}
                      onChange={(e) => updateQuotation('paymentTerms', e.target.value)}
                      placeholder="e.g., Net 30, Due on receipt"
                    />
                  </div>
                  <div>
                    <Label htmlFor="terms">Terms & Conditions</Label>
                    <Textarea
                      id="terms"
                      value={quotation.terms}
                      onChange={(e) => updateQuotation('terms', e.target.value)}
                      placeholder="Terms and conditions"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={quotation.notes}
                      onChange={(e) => updateQuotation('notes', e.target.value)}
                      placeholder="Additional notes"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <Button 
                  onClick={() => setShowPreview(true)} 
                  variant="outline" 
                  className="flex-1 h-12 bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold transition-all duration-200"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Preview Document
                </Button>
                <Button 
                  onClick={saveQuotation} 
                  disabled={saving} 
                  className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving Quotation...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Quotation
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              <Card className="shadow-lg border-gray-200 bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-100">
                  <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-800">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    Quotation Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                       <span className="text-sm font-medium text-gray-600">Subtotal:</span>
                       <span className="font-semibold text-gray-900">{formatCurrency(quotation.subtotal, quotation.currency)}</span>
                     </div>
                     {quotation.discount > 0 && (
                       <div className="flex justify-between items-center py-2 border-b border-gray-100">
                         <span className="text-sm font-medium text-green-600">Discount ({quotation.discount}%):</span>
                         <span className="font-semibold text-green-600">-{formatCurrency(quotation.subtotal * quotation.discount / 100, quotation.currency)}</span>
                       </div>
                     )}
                     {quotation.taxRate > 0 && (
                       <div className="flex justify-between items-center py-2 border-b border-gray-100">
                         <span className="text-sm font-medium text-gray-600">Tax ({quotation.taxRate}%):</span>
                         <span className="font-semibold text-gray-900">{formatCurrency(quotation.taxAmount, quotation.currency)}</span>
                       </div>
                     )}
                     <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mt-4">
                       <div className="flex justify-between items-center">
                         <span className="text-lg font-bold text-gray-800">Total Amount:</span>
                         <span className="text-2xl font-bold text-blue-600">{formatCurrency(quotation.total, quotation.currency)}</span>
                       </div>
                     </div>
                  </div>
                </CardContent>
              </Card>

              {selectedTemplate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                       <File className="w-5 h-5" />
                       Applied Template
                     </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selectedTemplate.name}</p>
                        <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Client Selection Dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Client</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {clients.length > 0 ? (
              <div className="space-y-2">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => selectClient(client)}
                  >
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-gray-600">{client.email}</div>
                    {client.phone && <div className="text-sm text-gray-600">{client.phone}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No clients found</p>
                <p className="text-sm">Add clients first to select them here</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Template</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {templates.length > 0 ? (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => applyTemplate(template)}
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-gray-600">{template.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                 <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
                 <p>No templates found</p>
                 <p className="text-sm">Create templates to reuse quotation structures</p>
               </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved Quotations Dialog */}
      <Dialog open={showSavedQuotations} onOpenChange={setShowSavedQuotations}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Saved Quotations</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] space-y-4">
            {savedQuotations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No saved quotations found.</p>
                <p className="text-sm">Create and save your first quotation to see it here.</p>
              </div>
            ) : (
              savedQuotations.map((savedQuotation) => (
                <div key={savedQuotation.id} className="border rounded-lg p-6 space-y-4 bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{savedQuotation.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          #{savedQuotation.quotationNumber}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <span className="font-medium">Client:</span> {savedQuotation.clientName}
                        </div>
                        <div>
                          <span className="font-medium">Total:</span> {savedQuotation.currency} {savedQuotation.total?.toFixed(2) || '0.00'}
                        </div>
                        <div>
                          <span className="font-medium">Valid Until:</span> {savedQuotation.validUntil ? new Date(savedQuotation.validUntil).toLocaleDateString() : 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Status:</span> 
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {savedQuotation.status || 'Draft'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(savedQuotation.id!)}
                      disabled={deletingQuotation}
                      className="ml-4"
                    >
                      {deletingQuotation && quotationToDelete === savedQuotation.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  {savedQuotation.description && (
                    <div className="border-t pt-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Description:</span> {savedQuotation.description}
                      </p>
                    </div>
                  )}
                  
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-gray-900 mb-2">Items ({savedQuotation.items?.length || 0}):</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {savedQuotation.items?.map((item, index) => (
                        <div key={item.id || index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                          <span className="flex-1">{item.description}</span>
                          <span className="text-gray-600 mx-2">Qty: {item.quantity}</span>
                          <span className="font-medium">{savedQuotation.currency} {(item.quantity * item.unitPrice).toFixed(2)}</span>
                        </div>
                      )) || (
                        <p className="text-sm text-gray-500 italic">No items</p>
                      )}
                    </div>
                  </div>
                  
                  {(savedQuotation.paymentTerms || savedQuotation.terms || savedQuotation.notes) && (
                    <div className="border-t pt-3 space-y-2">
                      {savedQuotation.paymentTerms && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">Payment Terms:</span>
                          <p className="text-gray-700 mt-1">{savedQuotation.paymentTerms}</p>
                        </div>
                      )}
                      {savedQuotation.terms && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">Terms & Conditions:</span>
                          <p className="text-gray-700 mt-1">{savedQuotation.terms}</p>
                        </div>
                      )}
                      {savedQuotation.notes && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">Notes:</span>
                          <p className="text-gray-700 mt-1">{savedQuotation.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              Are you sure you want to delete this quotation? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deletingQuotation}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deletingQuotation}
            >
              {deletingQuotation ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quotation Preview</DialogTitle>
          </DialogHeader>
          <div className="bg-white p-8 border rounded-lg">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">QUOTATION</h1>
              <p className="text-gray-600">Date: {new Date().toLocaleDateString()}</p>
              {quotation.validUntil && (
                <p className="text-gray-600">Valid Until: {new Date(quotation.validUntil).toLocaleDateString()}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-bold mb-2">From:</h3>
                <p>Your Company Name</p>
                <p>Your Address</p>
                <p>Your Contact Info</p>
              </div>
              <div>
                <h3 className="font-bold mb-2">To:</h3>
                <p className="font-medium">{quotation.clientName}</p>
                {quotation.clientEmail && <p>{quotation.clientEmail}</p>}
                {quotation.clientPhone && <p>{quotation.clientPhone}</p>}
                {quotation.clientAddress && <p>{quotation.clientAddress}</p>}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">{quotation.title}</h2>
              {quotation.description && <p className="text-gray-700 mb-4">{quotation.description}</p>}
            </div>

            <div className="mb-8">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-3 text-left">Item</th>
                    <th className="border border-gray-300 p-3 text-left">Description</th>
                    <th className="border border-gray-300 p-3 text-right">Qty</th>
                    <th className="border border-gray-300 p-3 text-right">Unit Price</th>
                    <th className="border border-gray-300 p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-3">{item.name}</td>
                      <td className="border border-gray-300 p-3">{item.description}</td>
                      <td className="border border-gray-300 p-3 text-right">{item.quantity}</td>
                      <td className="border border-gray-300 p-3 text-right">{quotation.currency} {item.unitPrice.toFixed(2)}</td>
                      <td className="border border-gray-300 p-3 text-right">{quotation.currency} {(item.quantity * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mb-8">
              <div className="w-64">
                <div className="flex justify-between py-2">
                  <span>Subtotal:</span>
                  <span>{quotation.currency} {quotation.subtotal.toFixed(2)}</span>
                </div>
                {quotation.discount > 0 && (
                  <div className="flex justify-between py-2 text-green-600">
                    <span>Discount ({quotation.discount}%):</span>
                    <span>-{quotation.currency} {(quotation.subtotal * quotation.discount / 100).toFixed(2)}</span>
                  </div>
                )}
                {quotation.taxRate > 0 && (
                  <div className="flex justify-between py-2">
                    <span>Tax ({quotation.taxRate}%):</span>
                    <span>{quotation.currency} {quotation.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 font-bold text-lg border-t">
                  <span>Total:</span>
                  <span>{quotation.currency} {quotation.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {(quotation.terms || quotation.paymentTerms || quotation.notes) && (
              <div className="space-y-4">
                {quotation.paymentTerms && (
                  <div>
                    <h3 className="font-bold mb-2">Payment Terms:</h3>
                    <p>{quotation.paymentTerms}</p>
                  </div>
                )}
                {quotation.terms && (
                  <div>
                    <h3 className="font-bold mb-2">Terms & Conditions:</h3>
                    <p>{quotation.terms}</p>
                  </div>
                )}
                {quotation.notes && (
                  <div>
                    <h3 className="font-bold mb-2">Notes:</h3>
                    <p>{quotation.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
