"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, FileText, Activity, Settings, FileSearch, Bell, Brain, Skull, Play, StopCircle, RefreshCw, FileWarning } from "lucide-react"; // Added FileWarning
import SystemStatusCard from "@/components/system-status-card";
import RecentAlerts from "@/components/recent-alerts";
import FileActivityChart from "@/components/file-activity-chart";
import { useAppContext } from "@/context/app-context";
import { ScanProgress } from "@/components/scan-progress";
import { ScanDetailsModal } from "@/components/scan-details-modal";
import { FileEventsList } from "@/components/file-events-list";
import { Badge } from "@/components/ui/badge";
import { AiAnalysisPanel } from "@/components/ai-analysis-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Home() {
  const {
    systemStatus,
    activeThreats,
    filesMonitored,
    aiEngineStatus,
    isScanning,
    runScan, // This now triggers the backend scan
    refreshData,
    alerts,
    targetDirectory,
    simulateRansomwareAttack,
    logs,
    detectorPid,
    startDetectorProcess,
    stopDetectorProcess,
    maliciousFiles, // Get malicious files
  } = useAppContext();

  const [showScanDetails, setShowScanDetails] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [cpuUsage, setCpuUsage] = useState(12);
  const [memoryUsage, setMemoryUsage] = useState(34);

  const formattedFilesMonitored = filesMonitored.toLocaleString();

  // Simulate real-time system metrics (frontend only for display)
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 20) + 10);
      setMemoryUsage(Math.floor(Math.random() * 15) + 30);
      setLastUpdated(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Get status details based on system status
  const getStatusDetails = () => {
    switch (systemStatus) {
      case "Protected":
        return "System is protected. No active threats detected.";
      case "At Risk":
        return `${activeThreats} active threat(s) detected. Investigation needed.`;
      case "Under Attack":
        return "Potential ransomware attack in progress! Immediate action required.";
      case "Scanning":
        return "System scan in progress...";
      case "Detector Offline":
         return "Real-time detector is offline. Start the detector for protection.";
      default:
        // Fallback for unknown status
        const exhaustiveCheck: never = systemStatus;
        return "System status unknown";
    }
  };

  // Check if there are any critical alerts
  const hasCriticalAlerts = alerts.some(
    (alert) => (alert.severity === "critical" || alert.severity === "high") && alert.status === "active",
  );

  // Determine if the detector is running or in a transitional state
  const isDetectorRunningOrStarting = aiEngineStatus === 'Online' || aiEngineStatus === 'Learning' || aiEngineStatus === 'Starting';

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-red-500" />
              <span className="text-xl font-bold">RansomGuard AI</span>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/alerts" className="text-sm font-medium relative">
                Alerts
                {hasCriticalAlerts && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </Link>
              <Link href="/reports" className="text-sm font-medium">
                Reports
              </Link>
              <Link href="/settings" className="text-sm font-medium">
                Settings
              </Link>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {hasCriticalAlerts && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </Button>
            </nav>
          </div>
        </header>
        <main className="flex-1 container py-6">
          <div className="flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex items-center justify-between flex-wrap gap-y-2"> {/* Added flex-wrap and gap-y */}
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                  <span className="ml-2 font-medium">Target Directory: {targetDirectory}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap"> {/* Added flex-wrap */}
                  <Button variant="outline" size="sm" onClick={refreshData}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Status/Logs
                  </Button>
                  {!isDetectorRunningOrStarting ? (
                      <Button size="sm" onClick={startDetectorProcess}>
                          <Play className="mr-2 h-4 w-4" />
                          Start Detector
                      </Button>
                  ) : (
                      <Button variant="outline" size="sm" onClick={stopDetectorProcess} disabled={aiEngineStatus === 'Starting'}>
                          <StopCircle className="mr-2 h-4 w-4" />
                          Stop Detector {detectorPid ? `(PID: ${detectorPid})` : ''}
                      </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={simulateRansomwareAttack}>
                      <Skull className="mr-2 h-4 w-4" />
                      Simulate Attack
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowScanDetails(true)}>
                      <FileSearch className="mr-2 h-4 w-4" />
                      Scan Details
                  </Button>
                  <Button
                      size="sm"
                      onClick={runScan}
                      disabled={isScanning}
                      className={systemStatus === "At Risk" || systemStatus === "Under Attack" ? "animate-pulse" : ""}
                  >
                      <Shield className="mr-2 h-4 w-4" />
                      {isScanning ? "Scanning..." : "Run Backend Scan"}
                  </Button>
                  <Button variant="outline" size="sm" >
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                  </Button>
              </div>
            </div>

            {/* Conditional Alert Bar */}
            {(systemStatus === "At Risk" || systemStatus === "Under Attack") && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-md flex items-center justify-between flex-wrap gap-2"> {/* Added flex-wrap gap-2 */}
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800">Alert: {systemStatus}</p>
                    <p className="text-sm text-red-600">{getStatusDetails()}</p>
                  </div>
                </div>
                <Button size="sm" variant="destructive" onClick={runScan} disabled={isScanning}>
                  {isScanning ? "Scanning..." : "Scan Now"}
                </Button>
              </div>
            )}

            {/* Scan Progress Bar */}
            <ScanProgress />

            {/* System Status Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <SystemStatusCard
                title="System Status" status={systemStatus} icon={<Shield className="h-5 w-5" />}
                statusColor={ systemStatus === "Protected" ? "bg-green-500" : systemStatus === "Scanning" ? "bg-blue-500" : systemStatus === "At Risk" ? "bg-orange-500" : systemStatus === "Detector Offline" ? "bg-gray-500" : "bg-red-500" }
                details={getStatusDetails()}
              />
              <SystemStatusCard
                title="Active Threats" status={activeThreats === 0 ? "None" : activeThreats.toString()} icon={<AlertTriangle className="h-5 w-5" />}
                statusColor={activeThreats === 0 ? "bg-green-500" : "bg-red-500"}
                details={ activeThreats === 0 ? "No active threats detected" : `${activeThreats} threats require attention` }
                trend={activeThreats > 0 ? "up" : "stable"}
                trendValue={activeThreats > 0 ? "+1 in last hour" : "No change"}
              />
              <SystemStatusCard
                title="Files Monitored" status={formattedFilesMonitored} icon={<FileText className="h-5 w-5" />}
                statusColor="bg-blue-500"
                details={`${filesMonitored > 0 ? 'Actively monitoring' : 'Monitoring'} ${formattedFilesMonitored} files in ${targetDirectory}`}
                trend="up" trendValue="+5 since last scan"
              />
              <SystemStatusCard
                title="AI Engine" status={aiEngineStatus} icon={<Activity className="h-5 w-5" />}
                statusColor={ aiEngineStatus === "Online" ? "bg-green-500" : aiEngineStatus === "Learning" ? "bg-blue-500" : aiEngineStatus === "Starting" ? "bg-yellow-500" : "bg-red-500" }
                details={`AI engine is ${aiEngineStatus.toLowerCase()} and ${ aiEngineStatus === "Online" ? "actively monitoring" : aiEngineStatus === "Learning" ? "analyzing patterns" : aiEngineStatus === "Starting" ? "initializing..." : "needs attention" }`}
              />
            </div>

            {/* Charts and Recent Alerts */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div><CardTitle>File Activity</CardTitle><CardDescription>Real-time monitoring of file system operations</CardDescription></div>
                    <Badge variant="outline" className="ml-2">Live</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <FileActivityChart />
                  <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                    <div>CPU: {cpuUsage}%</div> <div>Memory: {memoryUsage}%</div> <div>Disk I/O: {Math.floor(Math.random() * 30) + 10} MB/s</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div><CardTitle>Recent Alerts</CardTitle><CardDescription>Latest detected suspicious activities</CardDescription></div>
                    {hasCriticalAlerts && <Badge variant="destructive">Critical Alerts</Badge>}
                  </div>
                </CardHeader>
                <CardContent><RecentAlerts /></CardContent>
              </Card>
            </div>

            {/* AI Analysis Panel */}
            <AiAnalysisPanel />

            {/* Malicious Files Section */}
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                         <Skull className="h-5 w-5 text-destructive" /> Malicious Files Detected
                    </CardTitle>
                    <CardDescription>Files flagged by the detector as potentially harmful or part of an attack.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[200px] w-full rounded-md border">
                    {maliciousFiles.length === 0 ? (
                         <div className="flex items-center justify-center h-full text-muted-foreground">
                            No malicious files detected yet.
                         </div>
                    ) : (
                         <div className="p-2 space-y-1">
                         {maliciousFiles.map((file, index) => (
                              <div key={`${file.path}-${index}`} className="flex items-start sm:items-center justify-between p-2 border-b text-xs hover:bg-muted/50 gap-2 flex-col sm:flex-row">
                                   <div className="flex items-center gap-2 min-w-0">
                                        <FileWarning className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5 sm:mt-0" />
                                        <Tooltip delayDuration={100}>
                                            <TooltipTrigger asChild>
                                                 <span className="font-mono truncate flex-1 cursor-default" >
                                                    {file.path.split('\\').pop() || file.path}
                                                 </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" align="start">
                                                 <p className="font-mono">{file.path}</p>
                                            </TooltipContent>
                                         </Tooltip>
                                   </div>
                                   <div className="flex items-center justify-end gap-2 sm:gap-4 text-muted-foreground flex-shrink-0 w-full sm:w-auto pl-6 sm:pl-0">
                                         <Tooltip delayDuration={100}>
                                              <TooltipTrigger asChild>
                                                   <span className="text-red-600 cursor-default truncate max-w-[150px] sm:max-w-[200px]">
                                                      {file.reason.substring(0,30)}{file.reason.length > 30 ? '...' : ''}
                                                   </span>
                                              </TooltipTrigger>
                                              <TooltipContent side="top" align="end" className="max-w-xs">
                                                  <p>{file.reason}</p>
                                              </TooltipContent>
                                         </Tooltip>
                                        <span className="whitespace-nowrap">{file.timestamp}</span>
                                   </div>
                              </div>
                         ))}
                         </div>
                    )}
                    </ScrollArea>
                </CardContent>
             </Card>

            {/* Logs Section */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Detector Logs (Last 100 lines)</CardTitle></CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[200px] w-full rounded-md border p-4 text-xs font-mono">
                            <pre>{logs.detector || "No detector logs available."}</pre>
                        </ScrollArea>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Simulation Logs (Last 100 lines)</CardTitle></CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[200px] w-full rounded-md border p-4 text-xs font-mono">
                            <pre>{logs.simulation || "No simulation logs available."}</pre>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* File Events List */}
            <Card>
                <CardHeader>
                <CardTitle>File System Monitoring</CardTitle>
                <CardDescription>Real-time file system events in {targetDirectory} (parsed from logs)</CardDescription>
                </CardHeader>
                <CardContent>
                <FileEventsList />
                </CardContent>
            </Card>
          </div>
        </main>
        <ScanDetailsModal isOpen={showScanDetails} onClose={() => setShowScanDetails(false)} />
      </div>
    </TooltipProvider>
  );
}