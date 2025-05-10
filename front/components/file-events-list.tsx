// front/components/file-events-list.tsx
"use client";

import { useAppContext } from "@/context/app-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, FilePlus, FileX, FileEdit, AlertTriangle, Shield } from "lucide-react";
import type { FileEvent, Alert, AlertSeverity } from "@/context/app-context";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function FileEventsList() {
  // Use Alert type from context for relatedAlert
  const { fileEvents, alerts }: { fileEvents: FileEvent[], alerts: Alert[] } = useAppContext();

  const getOperationIcon = (operation: string) => {
    switch (operation?.toLowerCase()) { // Handle potential undefined/case issues
      case "create":
        return <FilePlus className="h-4 w-4 text-green-500" />;
      case "modify":
        return <FileEdit className="h-4 w-4 text-blue-500" />;
      case "delete":
        return <FileX className="h-4 w-4 text-red-500" />;
      case "rename": // Add rename if backend logs it
         return <FileEdit className="h-4 w-4 text-orange-500" />; // Example icon
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventDescription = (event: FileEvent) => { // Use FileEvent from app-context
    const fileName = event.path.split("\\").pop() || event.path;
    // Make operation capitalized
    const operationDisplay = event.operation ? event.operation.charAt(0).toUpperCase() + event.operation.slice(1) : 'Unknown Op';
    return `${operationDisplay}: ${fileName}`;
  };

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Real-Time File System Events (from Logs)</h3>
        <ScrollArea className="h-[300px] rounded-md border">
          <div className="p-4 space-y-2">
            {fileEvents.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                No file events parsed from logs yet. Start detector.
              </div>
            ) : (
              fileEvents.map((event, index) => { // event is FileEvent from app-context
                const relatedAlert = alerts.find(
                  (alert) => alert.status === 'active' && alert.affectedFiles?.includes(event.path)
                );

                // Use AlertSeverity type here
                let threatLevel: { level: AlertSeverity; label: string } | null = null;
                let tooltipContent: string | null = null;

                if (relatedAlert) {
                    threatLevel = { level: relatedAlert.severity, label: relatedAlert.type };
                    tooltipContent = relatedAlert.details;
                }
                // Removed the basic entropy check here - rely on backend alerts

                return (
                  <div
                    key={`${event.timestamp}-${event.path}-${index}`} // More unique key
                    className={`flex items-start space-x-2 p-2 text-xs rounded-md ${
                      threatLevel?.level === "critical"
                        ? "bg-red-50 border border-red-300"
                        : threatLevel?.level === "high"
                          ? "bg-orange-50 border border-orange-300"
                          : threatLevel?.level === "medium"
                            ? "bg-yellow-50 border border-yellow-300"
                            : "border" // Default border for normal events
                    }`}
                  >
                    <div className="mt-0.5">{getOperationIcon(event.operation)}</div>
                    <div className="flex-1 space-y-1 min-w-0"> {/* Added min-w-0 here for better truncation */}
                      <div className="flex items-center justify-between">
                         <Tooltip delayDuration={150}>
                             <TooltipTrigger asChild>
                                 {/* Ensure getEventDescription returns string */}
                                 <span className="font-medium truncate max-w-[70%] cursor-default">{getEventDescription(event)}</span>
                             </TooltipTrigger>
                             <TooltipContent side="top" align="start" className="max-w-xs"> {/* Added max-w-xs */}
                                 <p className="font-mono break-all">{event.path}</p> {/* Added break-all */}
                                 {tooltipContent && <p className="mt-1 text-muted-foreground">{tooltipContent}</p>}
                             </TooltipContent>
                         </Tooltip>
                        <span className="text-muted-foreground whitespace-nowrap ml-2"> {/* Added ml-2 */}
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-muted-foreground truncate max-w-[60%]"> {/* Added truncation */}
                          {event.process ? `Process: ${event.process.name} (PID: ${event.process.pid})` : 'Process: Unknown'}
                        </div>
                        {threatLevel && (
                          <Badge
                            variant={
                              threatLevel.level === "critical" || threatLevel.level === "high"
                                ? "destructive"
                                : threatLevel.level === "medium" ? "default" : "outline"
                            }
                            className={
                                `ml-2 flex-shrink-0 ${ // Added ml-2 and flex-shrink-0
                                threatLevel.level === "medium" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" :
                                threatLevel.level === "low" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : ""}`
                            }
                          >
                             {/* Shorten label if needed */}
                             {threatLevel.label.length > 15 ? threatLevel.level : threatLevel.label} ({threatLevel.level})
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}