"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DatePickerWithRangeProps {
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
  className?: string
}

export function DatePickerWithRange({
  date,
  onDateChange,
  className,
}: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [fromDate, setFromDate] = React.useState(date?.from?.toISOString().split('T')[0] || '')
  const [toDate, setToDate] = React.useState(date?.to?.toISOString().split('T')[0] || '')

  const handleFromDateChange = (value: string) => {
    setFromDate(value)
    const newFromDate = value ? new Date(value) : undefined
    const newToDate = toDate ? new Date(toDate) : undefined
    onDateChange?.({
      from: newFromDate,
      to: newToDate
    })
  }

  const handleToDateChange = (value: string) => {
    setToDate(value)
    const newFromDate = fromDate ? new Date(fromDate) : undefined
    const newToDate = value ? new Date(value) : undefined
    onDateChange?.({
      from: newFromDate,
      to: newToDate
    })
  }

  const formatDateRange = () => {
    if (!date?.from) {
      return "Pick a date range"
    }
    if (date.from && !date.to) {
      return date.from.toLocaleDateString()
    }
    if (date.from && date.to) {
      return `${date.from.toLocaleDateString()} - ${date.to.toLocaleDateString()}`
    }
    return "Pick a date range"
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="from-date" className="text-sm font-medium">
                From Date
              </label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => handleFromDateChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="to-date" className="text-sm font-medium">
                To Date
              </label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => handleToDateChange(e.target.value)}
              />
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              className="w-full"
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}