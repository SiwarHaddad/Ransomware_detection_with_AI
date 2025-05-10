"use client"

import { useAppContext } from "@/context/app-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileSearch, CheckCircle, AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"

interface ScanDetailsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ScanDetailsModal({ isOpen, onClose }: ScanDetailsModalProps) {
  const { isScanning, scanProgress, scannedFiles, currentScanningFile } = useAppContext()
  const [stats, setStats] = useState({
    totalFiles: 0,
    fileTypes: {} as Record<string, number>,
    directories: {} as Record<string, number>,
  })

  // Calculate statistics when scanned files change
  useEffect(() => {
    if (scannedFiles.length === 0) return

    const fileTypes: Record<string, number> = {}
    const directories: Record<string, number> = {}

    scannedFiles.forEach((file) => {
      // Get file extension
      const extension = file.split(".").pop() || "unknown"
      fileTypes[extension] = (fileTypes[extension] || 0) + 1

      // Get directory
      const directory = file.substring(0, file.lastIndexOf("\\"))
      directories[directory] = (directories[directory] || 0) + 1
    })

    setStats({
      totalFiles: scannedFiles.length,
      fileTypes,
      directories,
    })
  }, [scannedFiles])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isScanning ? (
              <>
                <FileSearch className="h-5 w-5 text-blue-500 animate-pulse" />
                Scan in Progress
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Scan Complete
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isScanning
              ? "Scanning your system for potential threats..."
              : `Scan completed. ${stats.totalFiles} files were scanned.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isScanning && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm">Progress</span>
                <span className="text-sm font-medium">{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="h-2" />

              {currentScanningFile && (
                <div className="text-sm">
                  Currently scanning: <span className="font-mono text-xs">{currentScanningFile}</span>
                </div>
              )}
            </>
          )}

          <div>
            <h4 className="text-sm font-medium mb-2">Scanned Files</h4>
            <ScrollArea className="h-[200px] rounded border p-2">
              <div className="space-y-1">
                {scannedFiles
                  .slice(-100)
                  .reverse()
                  .map((file, index) => (
                    <div key={index} className="text-xs font-mono flex items-center">
                      <span className="flex-1 truncate">{file}</span>
                      {file.endsWith(".exe") && (
                        <AlertTriangle className="h-3 w-3 text-yellow-500 ml-2 flex-shrink-0" />
                      )}
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>

          {!isScanning && stats.totalFiles > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">File Types</h4>
                <ScrollArea className="h-[100px] rounded border p-2">
                  <div className="space-y-1">
                    {Object.entries(stats.fileTypes).map(([type, count]) => (
                      <div key={type} className="text-xs flex justify-between">
                        <span>.{type}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Directories</h4>
                <ScrollArea className="h-[100px] rounded border p-2">
                  <div className="space-y-1">
                    {Object.entries(stats.directories).map(([dir, count]) => (
                      <div key={dir} className="text-xs flex justify-between">
                        <span className="truncate flex-1">{dir}</span>
                        <span className="font-medium ml-2">{count}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
