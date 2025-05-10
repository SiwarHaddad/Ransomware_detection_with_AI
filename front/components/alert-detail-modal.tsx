"use client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Brain } from "lucide-react"
import type { Alert } from "@/context/app-context"
import { useAppContext } from "@/context/app-context"

interface AlertDetailModalProps {
  alert: Alert | null
  isOpen: boolean
  onClose: () => void
  onResolve?: (id: string) => void
  onInvestigate?: (id: string) => void
}

export function AlertDetailModal({ alert, isOpen, onClose, onResolve, onInvestigate }: AlertDetailModalProps) {
  const { blockProcess, createBackup } = useAppContext()

  if (!alert) return null

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

  const handleBlockProcess = async (pid: number, processName: string) => {
    const success = await blockProcess(pid, processName)
    if (success) {
      // Could show a toast notification here
      console.log(`Process ${processName} (PID: ${pid}) blocked successfully`)
    }
  }

  const handleCreateBackup = async () => {
    await createBackup()
    // Could show a toast notification here
    console.log("Backup created successfully")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{alert.type}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${severityColors[alert.severity]}`}>
              {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[alert.status]}`}>
              {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
            </span>
          </DialogTitle>
          <DialogDescription>{alert.message}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Details</h4>
            <p className="text-sm">{alert.details}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Timestamp</h4>
            <p className="text-sm">{alert.timestamp}</p>
          </div>

          {alert.aiAnalysis && (
            <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
              <h4 className="text-sm font-medium mb-1 flex items-center">
                <Brain className="h-4 w-4 mr-2 text-purple-500" />
                AI Analysis
              </h4>
              <p className="text-sm">{alert.aiAnalysis}</p>
            </div>
          )}

          {alert.affectedFiles && alert.affectedFiles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">Affected Files</h4>
              <ScrollArea className="h-[100px] rounded border p-2">
                <div className="space-y-1">
                  {alert.affectedFiles.map((file, index) => (
                    <div key={index} className="text-xs flex items-center">
                      <FileText className="h-3 w-3 mr-2 text-blue-500" />
                      <span className="font-mono">{file}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {alert.suspiciousProcesses && alert.suspiciousProcesses.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">Suspicious Processes</h4>
              <div className="space-y-2">
                {alert.suspiciousProcesses.map((process, index) => (
                  <div key={index} className="text-xs p-2 border rounded flex items-start justify-between">
                    <div>
                      <div className="font-medium">
                        {process.name} (PID: {process.pid})
                      </div>
                      <div className="text-muted-foreground mt-1">{process.reason}</div>
                    </div>
                    {!process.reason.includes("BLOCKED") && alert.status !== "resolved" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="ml-2"
                        onClick={() => handleBlockProcess(process.pid, process.name)}
                      >
                        Block Process
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-1">Recommended Actions</h4>
            <ul className="text-sm list-disc pl-5 space-y-1">
              <li>Isolate affected system</li>
              <li>Backup important files</li>
              <li>Run deep scan</li>
              {alert.suspiciousProcesses && alert.suspiciousProcesses.length > 0 && <li>Block suspicious processes</li>}
            </ul>
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCreateBackup}>
              Create Backup
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
          <div className="flex gap-2">
            {alert.status === "active" && (
              <>
                {onInvestigate && (
                  <Button variant="outline" onClick={() => onInvestigate(alert.id)}>
                    Investigate
                  </Button>
                )}
                {onResolve && <Button onClick={() => onResolve(alert.id)}>Resolve</Button>}
              </>
            )}
            {alert.status === "investigating" && onResolve && (
              <Button onClick={() => onResolve(alert.id)}>Mark Resolved</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
