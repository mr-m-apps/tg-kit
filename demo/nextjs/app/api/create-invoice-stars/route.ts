import { NextRequest, NextResponse } from "next/server"
import { TelegramBot } from "@mr-m/tg-kit/bot"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      amount,
      label,
      description,
      payload,
      currency = "XTR",
      photo_url,
    } = body

    if (!amount) {
      return NextResponse.json(
        { error: "amount is required" },
        { status: 400 }
      )
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 }
      )
    }

    if (!label) {
      return NextResponse.json(
        { error: "label is required" },
        { status: 400 }
      )
    }

    if (!description) {
      return NextResponse.json(
        { error: "description is required" },
        { status: 400 }
      )
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN is not configured" },
        { status: 500 }
      )
    }

    const bot = new TelegramBot({ token: botToken })

    const invoicePayload = payload || JSON.stringify({
      service: "default",
      type: "default",
      timestamp: Date.now(),
      amount: amount,
      label: label,
    })

    const invoiceParams = {
      title: label,
      description: description,
      payload: invoicePayload,
      provider_token: "",
      currency: currency,
      prices: [{ amount: amount, label: label }],
      photo_url: photo_url || undefined,
    }

    const invoiceLink = await bot.createInvoiceLink(invoiceParams)

    return NextResponse.json({
      success: true,
      invoice_link: invoiceLink,
      data: {
        amount,
        label,
        description,
        currency,
        payload: invoicePayload,
        photo_url: photo_url || null,
      },
    })

  } catch (error: any) {
    console.error("Error creating invoice link:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create invoice link",
        details: error.parameters || undefined,
      },
      { status: error.status || 500 }
    )
  }
}
