"use client"

import * as React from "react"
import { Label } from "./label"
import { Input } from "./input"

export function TimePicker({ date, setDate }) {
  const [localDate, setLocalDate] = React.useState(date || new Date())

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(localDate)
    const newHour = parseInt(e.target.value)
    if (!isNaN(newHour) && newHour >= 0 && newHour <= 23) {
      newDate.setHours(newHour)
      setLocalDate(newDate)
      setDate(newDate)
    }
  }

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(localDate)
    const newMinute = parseInt(e.target.value)
    if (!isNaN(newMinute) && newMinute >= 0 && newMinute <= 59) {
      newDate.setMinutes(newMinute)
      setLocalDate(newDate)
      setDate(newDate)
    }
  }

  const hours = localDate.getHours().toString().padStart(2, '0')
  const minutes = localDate.getMinutes().toString().padStart(2, '0')

  return (
    <div className="flex space-x-2 p-3">
      <div className="grid gap-1 text-center">
        <Label htmlFor="hours" className="text-xs">Hours</Label>
        <Input
          id="hours"
          type="number"
          value={hours}
          onChange={handleHourChange}
          className="w-12 h-8 text-center"
          min={0}
          max={23}
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="minutes" className="text-xs">Minutes</Label>
        <Input
          id="minutes"
          type="number"
          value={minutes}
          onChange={handleMinuteChange}
          className="w-12 h-8 text-center"
          min={0}
          max={59}
        />
      </div>
    </div>
  )
}