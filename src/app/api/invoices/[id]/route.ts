import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/invoices/[id] - Get a specific invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            currency: true,
            paymentMethod: true,
            transactionId: true,
            cardLast4: true,
            cardBrand: true,
            processedAt: true,
            createdAt: true,
            updatedAt: true
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      invoice,
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

// PUT /api/invoices/[id] - Update a specific invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Prevent updating paid invoices
    if (existingInvoice.status === 'paid' && updateData.status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Cannot modify paid invoices' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updatePayload: any = {
      ...updateData,
      updatedAt: new Date(),
    }

    // Handle date fields
    if (updateData.dueDate) {
      updatePayload.dueDate = new Date(updateData.dueDate)
    }

    // Handle items update if provided
    if (updateData.items && Array.isArray(updateData.items)) {
      // Delete existing items and create new ones
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: params.id }
      })
      
      updatePayload.items = {
        create: updateData.items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity || 1,
          rate: item.rate || item.unitPrice || 0,
          amount: item.amount || ((item.quantity || 1) * (item.rate || item.unitPrice || 0)),
        }))
      }
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updatePayload,
      include: {
        items: true,
        payments: true,
      },
    })

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// DELETE /api/invoices/[id] - Delete a specific invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    })

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Prevent deleting paid invoices
    if (existingInvoice.status === 'paid') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete paid invoices' },
        { status: 400 }
      )
    }

    // Delete invoice items first
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: params.id }
    })

    // Delete the invoice
    await prisma.invoice.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}