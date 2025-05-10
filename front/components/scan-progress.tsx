"use client"

import { useAppContext } from "@/context/app-context"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileSearch } from "lucide-react"

export function ScanProgress() {
  const { isScanning, scanProgress, scannedFiles, currentScanningFile } = useAppContext()

  if (!isScanning) {
    return null
  }

  return (
    <div className="space-y-4 p-4 border rounded-md bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-blue-500 animate-pulse" />
          <h3 className="font-medium">Scanning in progress...</h3>
        </div>
        <span className="text-sm font-medium">{scanProgress}%</span>
      </div>

      <Progress value={scanProgress} className="h-2" />

      {currentScanningFile && (
        <div className="text-sm text-muted-foreground">
          Currently scanning: <span className="font-mono text-xs">{currentScanningFile}</span>
        </div>
      )}

      <div className="mt-2">
        <h4 className="text-sm font-medium mb-1">Recently scanned files:</h4>
        <ScrollArea className="h-[100px] rounded border p-2 bg-background">
          <div className="space-y-1">
            {scannedFiles
              .slice(-10)
              .reverse()
              .map((file, index) => (
                <div key={index} className="text-xs font-mono text-muted-foreground">
                  {file}
                </div>
              ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
