"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useAppContext } from "@/context/app-context"

export default function FileActivityChart() {
  const { fileEvents, systemStatus } = useAppContext()
  const [data, setData] = useState<any[]>([])

  // Generate realistic data based on file events and system status
  useEffect(() => {
    // Group events by time (5-minute intervals)
    const now = new Date()
    const timeIntervals: Record<string, { reads: number; writes: number; deletes: number; time: string }> = {}

    // Initialize the last 12 five-minute intervals
    for (let i = 11; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60000)
      const timeKey = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      timeIntervals[timeKey] = {
        time: timeKey,
        reads: 0,
        writes: 0,
        deletes: 0,
      }
    }

    // Count events by type and time interval
    fileEvents.forEach((event) => {
      const eventTime = new Date(event.timestamp)
      const timeKey = eventTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

      // Only count events in our time window
      if (timeIntervals[timeKey]) {
        if (event.operation === "create") {
          timeIntervals[timeKey].writes += 1
        } else if (event.operation === "modify") {
          timeIntervals[timeKey].reads += 1
          timeIntervals[timeKey].writes += 1
        } else if (event.operation === "delete") {
          timeIntervals[timeKey].deletes += 1
        }
      }
    })

    // Add baseline activity
    Object.keys(timeIntervals).forEach((key) => {
      // Add baseline activity
      timeIntervals[key].reads += Math.floor(Math.random() * 50) + 100
      timeIntervals[key].writes += Math.floor(Math.random() * 30) + 20

      // If system is at risk or under attack, add suspicious activity spikes
      if (systemStatus === "At Risk" || systemStatus === "Under Attack") {
        const recentInterval = Object.keys(timeIntervals).indexOf(key) > 8
        if (recentInterval) {
          timeIntervals[key].writes += Math.floor(Math.random() * 200) + 100
          timeIntervals[key].deletes += Math.floor(Math.random() * 20) + 5
        }
      }
    })

    // Convert to array for chart
    const chartData = Object.values(timeIntervals)
    setData(chartData)
  }, [fileEvents, systemStatus])

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip
            formatter={(value, name) => [value, name === "reads" ? "Reads" : name === "writes" ? "Writes" : "Deletes"]}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="reads"
            stroke="#3b82f6"
            name="Reads"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="writes"
            stroke="#10b981"
            name="Writes"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="deletes"
            stroke="#ef4444"
            name="Deletes"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
