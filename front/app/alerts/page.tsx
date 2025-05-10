"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, FileWarning, HardDrive, Network, RefreshCw, Filter } from "lucide-react"
import { useAppContext } from "@/context/app-context"

interface Alert {
  id: string
  type: string
  message: string
  timestamp: string
  severity: "low" | "medium" | "high" | "critical"
  status: "active" | "resolved" | "investigating"
  details: string
  icon: React.JSX.Element
}

const alerts: Alert[] = [
  {
    id: "1",
    type: "File Encryption",
    message: "Multiple file extension changes detected",
    timestamp: "Today, 10:25 AM",
    severity: "high",
    status: "active",
    details:
      "Process 'unknown.exe' (PID 1234) attempting to modify multiple files in Documents folder. Entropy analysis indicates encryption in progress.",
    icon: <FileWarning className="h-5 w-5" />,
  },
  {
    id: "2",
    type: "Suspicious Process",
    message: "Process attempting to modify system files",
    timestamp: "Today, 10:00 AM",
    severity: "medium",
    status: "investigating",
    details:
      "Process 'svchost.exe' (PID 5678) showing unusual behavior, attempting to modify protected system files in Windows directory.",
    icon: <HardDrive className="h-5 w-5" />,
  },
  {
    id: "3",
    type: "Network Activity",
    message: "Unusual outbound connection to unknown IP",
    timestamp: "Today, 9:30 AM",
    severity: "low",
    status: "resolved",
    details:
      "Process 'browser.exe' (PID 9012) established connection to IP 192.168.1.100 on port 8080. Connection has been terminated.",
    icon: <Network className="h-5 w-5" />,
  },
  {
    id: "4",
    type: "File Encryption",
    message: "High entropy file operations detected",
    timestamp: "Yesterday, 3:45 PM",
    severity: "critical",
    status: "resolved",
    details:
      "Process 'ransomware.exe' (PID 3456) was detected performing high-entropy write operations to multiple files. Process was terminated and isolated.",
    icon: <FileWarning className="h-5 w-5" />,
  },
]

const severityColors = {
  low: "bg-yellow-100 text-yellow-800",
  medium: "bg-orange-100 text-orange-800",
  high: "bg-red-100 text-red-800",
  critical: "bg-purple-100 text-purple-800",
}

const statusColors = {
  active: "bg-red-100 text-red-800",
  investigating: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
}

export default function AlertsPage() {
  const { alerts, resolveAlert, investigateAlert, refreshData } = useAppContext()
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null)

  const handleViewDetails = (id: string) => {
    setSelectedAlert(id === selectedAlert ? null : id)
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Alerts</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="investigating">Investigating</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Alerts</CardTitle>
                <CardDescription>Complete list of all detected threats and suspicious activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <div key={alert.id} className="flex flex-col space-y-3 p-4 rounded-md border">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className={`p-2 rounded-full ${severityColors[alert.severity]} bg-opacity-20`}>
                              {alert.icon}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium">{alert.type}</p>
                                <span className={`text-xs px-2 py-1 rounded-full ${severityColors[alert.severity]}`}>
                                  {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[alert.status]}`}>
                                  {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                                </span>
                              </div>
                              <p className="text-sm">{alert.message}</p>
                              <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(alert.id)}>
                              {selectedAlert === alert.id ? "Hide Details" : "View Details"}
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
                          </div>
                        </div>
                        {selectedAlert === alert.id && (
                          <div className="text-sm bg-muted p-3 rounded-md">
                            <p className="font-medium mb-1">Details:</p>
                            <p>{alert.details}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                      <AlertCircle className="h-10 w-10 mb-2" />
                      <p>No alerts found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
                <CardDescription>Currently active threats requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts
                    .filter((a) => a.status === "active")
                    .map((alert) => (
                      <div key={alert.id} className="flex flex-col space-y-3 p-4 rounded-md border">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className={`p-2 rounded-full ${severityColors[alert.severity]} bg-opacity-20`}>
                              {alert.icon}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium">{alert.type}</p>
                                <span className={`text-xs px-2 py-1 rounded-full ${severityColors[alert.severity]}`}>
                                  {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                                </span>
                              </div>
                              <p className="text-sm">{alert.message}</p>
                              <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(alert.id)}>
                              {selectedAlert === alert.id ? "Hide Details" : "View Details"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => investigateAlert(alert.id)}>
                              Investigate
                            </Button>
                            <Button size="sm" onClick={() => resolveAlert(alert.id)}>
                              Resolve
                            </Button>
                          </div>
                        </div>
                        {selectedAlert === alert.id && (
                          <div className="text-sm bg-muted p-3 rounded-md">
                            <p className="font-medium mb-1">Details:</p>
                            <p>{alert.details}</p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="investigating" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Investigating Alerts</CardTitle>
                <CardDescription>Threats being investigated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts
                    .filter((a) => a.status === "investigating")
                    .map((alert) => (
                      <div key={alert.id} className="flex flex-col space-y-3 p-4 rounded-md border">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className={`p-2 rounded-full ${severityColors[alert.severity]} bg-opacity-20`}>
                              {alert.icon}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium">{alert.type}</p>
                                <span className={`text-xs px-2 py-1 rounded-full ${severityColors[alert.severity]}`}>
                                  {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                                </span>
                              </div>
                              <p className="text-sm">{alert.message}</p>
                              <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(alert.id)}>
                              {selectedAlert === alert.id ? "Hide Details" : "View Details"}
                            </Button>
                            <Button size="sm" onClick={() => resolveAlert(alert.id)}>
                              Mark Resolved
                            </Button>
                          </div>
                        </div>
                        {selectedAlert === alert.id && (
                          <div className="text-sm bg-muted p-3 rounded-md">
                            <p className="font-medium mb-1">Details:</p>
                            <p>{alert.details}</p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resolved" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Resolved Alerts</CardTitle>
                <CardDescription>Resolved threats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts
                    .filter((a) => a.status === "resolved")
                    .map((alert) => (
                      <div key={alert.id} className="flex flex-col space-y-3 p-4 rounded-md border">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className={`p-2 rounded-full ${severityColors[alert.severity]} bg-opacity-20`}>
                              {alert.icon}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium">{alert.type}</p>
                                <span className={`text-xs px-2 py-1 rounded-full ${severityColors[alert.severity]}`}>
                                  {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                                </span>
                              </div>
                              <p className="text-sm">{alert.message}</p>
                              <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(alert.id)}>
                            {selectedAlert === alert.id ? "Hide Details" : "View Details"}
                          </Button>
                        </div>
                        {selectedAlert === alert.id && (
                          <div className="text-sm bg-muted p-3 rounded-md">
                            <p className="font-medium mb-1">Details:</p>
                            <p>{alert.details}</p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
