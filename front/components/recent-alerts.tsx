"use client"

import { AlertCircle } from "lucide-react"
import { useAppContext } from "@/context/app-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { AlertDetailModal } from "@/components/alert-detail-modal"

const severityColors = {
  low: "bg-yellow-100 text-yellow-800",
  medium: "bg-orange-100 text-orange-800",
  high: "bg-red-100 text-red-800",
  critical: "bg-purple-100 text-purple-800",
}

export default function RecentAlerts() {
  const { alerts, resolveAlert, investigateAlert } = useAppContext()
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Get only the most recent 3 alerts
  const recentAlerts = alerts.slice(0, 3)

  const handleViewDetails = (alertId: string) => {
    setSelectedAlert(alertId)
    setIsModalOpen(true)
  }

  if (recentAlerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
        <AlertCircle className="h-10 w-10 mb-2" />
        <p>No recent alerts</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {recentAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start space-x-4 p-3 rounded-md border ${
            alert.severity === "critical" || alert.severity === "high" ? "bg-red-50 border-red-200 animate-pulse" : ""
          }`}
        >
          <div className={`p-2 rounded-full ${severityColors[alert.severity]} bg-opacity-20`}>{alert.icon}</div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-medium">{alert.type}</p>
                <Badge
                  variant={
                    alert.severity === "critical" || alert.severity === "high"
                      ? "destructive"
                      : alert.severity === "medium"
                        ? "default"
                        : "outline"
                  }
                >
                  {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                </Badge>
              </div>
              {alert.status === "active" && (
                <span className="animate-ping h-2 w-2 rounded-full bg-red-600 opacity-75"></span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{alert.message}</p>
            <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => handleViewDetails(alert.id)}>
                View Details
              </Button>
              {alert.status === "active" && (
                <>
                  <Button variant="outline" size="sm" onClick={() => investigateAlert(alert.id)}>
                    Investigate
                  </Button>
                  <Button size="sm" onClick={() => resolveAlert(alert.id)}>
                    Resolve
                  </Button>
                </>
              )}
              {alert.status === "investigating" && (
                <Button size="sm" onClick={() => resolveAlert(alert.id)}>
                  Mark Resolved
                </Button>
              )}
              {alert.status === "resolved" && <span className="text-xs text-green-600 font-medium">Resolved</span>}
            </div>
          </div>
        </div>
      ))}

      {selectedAlert && (
        <AlertDetailModal
          alert={alerts.find((a) => a.id === selectedAlert) || null}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onResolve={resolveAlert}
          onInvestigate={investigateAlert}
        />
      )}
    </div>
  )
}
