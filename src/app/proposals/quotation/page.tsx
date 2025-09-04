"use client";
import { useState, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2, Copy } from "lucide-react";
import jsPDF from "jspdf";

// Item type
interface Item {
  description: string;
  quantity: number;
  price: number;
}

export default function QuotationGeneratorPage() {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>([{ description: "", quantity: 1, price: 0 }]);
  const [currency, setCurrency] = useState("USD");
  const [taxRate, setTaxRate] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [quotationNumber, setQuotationNumber] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [validUntil, setValidUntil] = useState<string>("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [generatedQuotation, setGeneratedQuotation] = useState<string>("");

  // Auto-generate quotation number & date
  useEffect(() => {
    const random = Math.floor(100000 + Math.random() * 900000);
    setQuotationNumber(`QTN-${random}`);
    setDate(new Date().toISOString().split("T")[0]);
  }, []);

  // Handle item updates
  const handleItemChange = (index: number, field: keyof Item, value: string | number) => {
    const next = [...items];
    if (field === "quantity" || field === "price") {
      const num = Number(value);
      (next[index] as any)[field] = isNaN(num) ? 0 : num;
    } else {
      (next[index] as any)[field] = value;
    }
    setItems(next);
  };

  // Add/remove items
  const addItem = () => setItems((prev) => [...prev, { description: "", quantity: 1, price: 0 }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  // Reset form
  const clearAll = () => {
    setClientName("");
    setClientEmail("");
    setProjectTitle("");
    setNotes("");
    setItems([{ description: "", quantity: 1, price: 0 }]);
    setCurrency("USD");
    setTaxRate(0);
    setDiscount(0);
    setValidUntil("");
    setGeneratedQuotation("");
    setMessage({ text: "", type: "" });
  };

  // Totals
  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.price, 0);
  const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const discountValue = Math.round(subtotal * (discount / 100) * 100) / 100;
  const total = Math.round((subtotal + tax - discountValue) * 100) / 100;

  // Backend call (AI quotation)
  const handleGenerate = async () => {
    if (!clientName || !projectTitle || items.every((i) => !i.description)) {
      setMessage({ text: "⚠️ Please fill client name, project title, and at least one item.", type: "error" });
      return;
    }
    if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      setMessage({ text: "⚠️ Invalid email format.", type: "error" });
      return;
    }

    setLoading(true);
    setGeneratedQuotation("");
    try {
      const res = await fetch("/api/generateQuotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotationNumber, date, validUntil, clientName, clientEmail, projectTitle, notes, items, currency, taxRate, discount, total }),
      });
      const data = await res.json();
      if (data.quotation) {
        setGeneratedQuotation(data.quotation);
        setMessage({ text: "✅ Quotation generated successfully!", type: "success" });
      } else {
        setMessage({ text: "⚠️ No quotation returned from AI.", type: "error" });
      }
    } catch {
      setMessage({ text: "❌ Failed to generate quotation.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // PDF download
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(`Quotation #: ${quotationNumber}`, 10, 10);
    doc.text(`Client: ${clientName} (${clientEmail})`, 10, 20);
    doc.text(`Project: ${projectTitle}`, 10, 30);
    doc.text(`Date: ${date}`, 10, 40);

    let y = 60;
    items.forEach((it, idx) => {
      doc.text(`${idx + 1}. ${it.description} - ${it.quantity} × ${it.price}`, 10, y);
      y += 10;
    });

    doc.text(`Subtotal: ${subtotal} ${currency}`, 10, y + 10);
    doc.text(`Tax: ${tax} ${currency}`, 10, y + 20);
    doc.text(`Discount: -${discountValue} ${currency}`, 10, y + 30);
    doc.text(`Total: ${total} ${currency}`, 10, y + 40);

    if (notes) doc.text(`Notes: ${notes}`, 10, y + 60);
    if (generatedQuotation) {
      doc.text("AI Generated Quotation:", 10, y + 80);
      doc.text(doc.splitTextToSize(generatedQuotation, 180), 10, y + 90);
    }
    doc.save(`${quotationNumber}.pdf`);
  };

  // Copy AI output
  const copyAIText = () => {
    if (generatedQuotation) {
      navigator.clipboard.writeText(generatedQuotation);
      setMessage({ text: "📋 Quotation copied to clipboard!", type: "success" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <Card className="lg:col-span-2 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Quotation Generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            {/* Quotation Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Quotation #</Label>
                <Input value={quotationNumber} disabled />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label>Valid Until</Label>
                <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </div>
              <div>
                <Label>Currency</Label>
                <Select onValueChange={(val) => setCurrency(val)} defaultValue="USD">
                  <SelectTrigger>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="PKR">PKR (₨)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Client & Project */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Client Name</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g., Qudsia" />
              </div>
              <div>
                <Label>Client Email</Label>
                <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@example.com" />
              </div>
              <div>
                <Label>Project Title</Label>
                <Input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="e.g., Branding Package" />
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-800">Quotation Items</h3>
                <Button variant="outline" onClick={addItem} className="text-xs rounded-lg">+ Add Item</Button>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="grid grid-cols-12 bg-gray-100/70 px-3 py-2 text-xs font-medium text-gray-600">
                  <div className="col-span-7">Description</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Unit Price</div>
                  <div className="col-span-1 text-right"></div>
                </div>
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 items-center gap-2 px-3 py-3 border-t">
                    <div className="col-span-7">
                      <Input placeholder="e.g., Logo Design" value={item.description} onChange={(e) => handleItemChange(i, "description", e.target.value)} className="text-sm" />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" min={1} value={item.quantity} onChange={(e: ChangeEvent<HTMLInputElement>) => handleItemChange(i, "quantity", e.target.value)} className="text-right text-sm" />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" min={0} step="0.01" value={item.price} onChange={(e: ChangeEvent<HTMLInputElement>) => handleItemChange(i, "price", e.target.value)} className="text-right text-sm" />
                    </div>
                    <div className="col-span-1 text-right">
                      <Button variant="outline" onClick={() => removeItem(i)} className="h-8 px-2 text-xs">Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax & Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tax %</Label>
                <Input type="number" min={0} value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
              </div>
              <div>
                <Label>Discount %</Label>
                <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add terms, delivery timeline, or special notes…" rows={3} />
            </div>

            {/* Actions & Message */}
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={clearAll} className="rounded-xl px-5">Clear</Button>
              <Button onClick={handleGenerate} disabled={loading} className="rounded-xl px-6 bg-[#7A8063] hover:bg-[#6a7355] text-white">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Generate Quotation"}
              </Button>
              <Button variant="secondary" className="rounded-xl px-6" onClick={downloadPDF}>Download PDF</Button>
            </div>

            {message.text && (
              <p className={`text-sm font-medium ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
                {message.text}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Right: Preview */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-800">Preview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            {/* Client + Project Info */}
            <div>
              <div className="font-medium text-gray-800">{projectTitle || "Project Title"}</div>
              <div className="text-gray-500">{clientName || "Client Name"} {clientEmail && `• ${clientEmail}`}</div>
              <div className="text-gray-500">Quotation #: {quotationNumber}</div>
              <div className="text-gray-500">Date: {date} {validUntil && `• Valid Until: ${validUntil}`}</div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="flex justify-between border-b pb-1">
                  <div className="text-gray-700">{it.description || "Item"}</div>
                  <div className="text-gray-600">{it.quantity} × {Number(it.price).toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium">{subtotal.toFixed(2)} {currency}</span></div>
              {taxRate > 0 && (<div className="flex justify-between"><span className="text-gray-600">Tax ({taxRate}%)</span><span className="font-medium">{tax.toFixed(2)} {currency}</span></div>)}
              {discount > 0 && (<div className="flex justify-between"><span className="text-gray-600">Discount ({discount}%)</span><span className="font-medium">-{discountValue.toFixed(2)} {currency}</span></div>)}
              <div className="flex justify-between text-gray-800 font-semibold"><span>Total</span><span>{total.toFixed(2)} {currency}</span></div>
            </div>

            {/* Notes */}
            {notes && (
              <div className="pt-2">
                <div className="text-gray-600">Notes</div>
                <p className="text-gray-700">{notes}</p>
              </div>
            )}

            {/* AI Generated Quotation */}
            {loading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            )}
            {generatedQuotation && (
              <div className="pt-4 border-t">
                <h3 className="font-medium text-gray-800">AI Generated Quotation</h3>
                <div className="bg-gray-50 p-3 rounded-lg max-h-64 overflow-y-auto text-gray-700 whitespace-pre-line">
                  {generatedQuotation}
                </div>
                <div className="flex gap-3 mt-3">
                  <Button variant="outline" size="sm" onClick={copyAIText}><Copy className="h-4 w-4 mr-1" /> Copy</Button>
                  <Button variant="outline" size="sm" onClick={handleGenerate}>Regenerate</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
