"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, CreditCard, Receipt, Trash2 } from "lucide-react"

export default function PaymentInvoicePage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [form, setForm] = useState({
    client: "",
    amount: "",
    method: "Credit Card",
    description: ""
  })

  // Load saved invoices
  useEffect(() => {
    const saved = localStorage.getItem("invoices")
    if (saved) setInvoices(JSON.parse(saved))
  }, [])

  // Save invoices to localStorage
  useEffect(() => {
    localStorage.setItem("invoices", JSON.stringify(invoices))
  }, [invoices])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const generateInvoice = () => {
    if (!form.client || !form.amount) return alert("Client & Amount are required!")
    const newInvoice = {
      id: Date.now(),
      client: form.client,
      amount: parseFloat(form.amount).toFixed(2),
      method: form.method,
      description: form.description,
      date: new Date().toLocaleDateString(),
      status: "Paid"
    }
    setInvoices([...invoices, newInvoice])
    setForm({ client: "", amount: "", method: "Credit Card", description: "" })
  }

  const deleteInvoice = (id: number) => {
    setInvoices(invoices.filter(inv => inv.id !== id))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <h1 className="text-2xl font-bold text-[#4A503D]">💳 Payment & Invoice Management</h1>

      {/* Payment Form */}
      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg text-[#7A8063]">Record a Payment</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            placeholder="Client Name" 
            name="client" 
            value={form.client} 
            onChange={handleChange}
          />
          <Input 
            placeholder="Amount (USD)" 
            name="amount" 
            type="number" 
            value={form.amount} 
            onChange={handleChange}
          />
          <select 
            name="method" 
            value={form.method} 
            onChange={handleChange}
            className="border rounded-lg p-2"
          >
            <option>Credit Card</option>
            <option>Bank Transfer</option>
            <option>PayPal</option>
            <option>Cash</option>
          </select>
          <Input 
            placeholder="Description (optional)" 
            name="description" 
            value={form.description} 
            onChange={handleChange}
          />
          <Button 
            onClick={generateInvoice} 
            className="bg-[#7A8063] hover:bg-[#4A503D] text-white col-span-2"
          >
            <CreditCard className="w-4 h-4 mr-2"/> Generate Invoice
          </Button>
        </CardContent>
      </Card>

      {/* Invoice Display Area */}
      {invoices.length > 0 && (
        <Card className="shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg text-[#7A8063]">Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full border">
              <thead className="bg-[#7A8063] text-white">
                <tr>
                  <th className="p-2 text-left">Invoice #</th>
                  <th className="p-2 text-left">Client</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Method</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={inv.id} className="border-b">
                    <td className="p-2">#{i + 1}</td>
                    <td className="p-2">{inv.client}</td>
                    <td className="p-2">${inv.amount}</td>
                    <td className="p-2">{inv.method}</td>
                    <td className="p-2">{inv.date}</td>
                    <td className="p-2 text-green-600">{inv.status}</td>
                    <td className="p-2 flex gap-2 justify-center">
                      <Button className="bg-[#7A8063] hover:bg-[#4A503D] text-white px-3 py-1 rounded-md">
                        <Download className="w-4 h-4"/>
                      </Button>
                      <Button 
                        onClick={() => deleteInvoice(inv.id)} 
                        className="bg-red-600 hover:bg-red-800 text-white px-3 py-1 rounded-md"
                      >
                        <Trash2 className="w-4 h-4"/>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
