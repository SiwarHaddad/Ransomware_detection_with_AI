// front/context/app-context.tsx
"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Activity, FileWarning, HardDrive, Network, AlertTriangle, Skull } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// --- Type Definitions ---
type SystemStatus = "Protected" | "At Risk" | "Under Attack" | "Scanning" | "Detector Offline";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
type AlertStatus = "active" | "resolved" | "investigating";
type IconType = "FileWarning" | "HardDrive" | "Network" | "Activity" | "AlertTriangle";

// Define FileEvent HERE, using string for operation
export type FileEvent = {
  path: string;
  operation: string; // Use string, as parsed from logs
  timestamp: number; // Milliseconds since epoch
  process?: {
    name: string;
    pid: number;
  };
  metadata?: {
    entropy?: number;
  };
};

export interface Alert {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  severity: AlertSeverity;
  status: AlertStatus;
  details: string;
  iconType: IconType;
  icon?: React.ReactNode;
  affectedFiles?: string[];
  suspiciousProcesses?: {
    pid: number;
    name: string;
    reason: string;
  }[];
  aiAnalysis?: string;
}

interface LogData {
  detector: string;
  simulation: string;
}

export interface MaliciousFileInfo {
    path: string;
    timestamp: string;
    reason: string;
}

interface AppContextType {
  systemStatus: SystemStatus;
  activeThreats: number;
  filesMonitored: number;
  aiEngineStatus: "Online" | "Offline" | "Learning" | "Starting";
  alerts: Alert[];
  isScanning: boolean;
  scanProgress: number;
  scannedFiles: string[];
  currentScanningFile: string | null;
  fileEvents: FileEvent[]; // Uses the FileEvent type defined above
  aiPredictions: {
    timestamp: string;
    prediction: string;
    confidence: number;
    threatType?: string;
  }[];
  targetDirectory: string;
  logs: LogData;
  detectorPid: number | null;
  maliciousFiles: MaliciousFileInfo[];
  runScan: () => Promise<void>;
  resolveAlert: (id: string) => void;
  investigateAlert: (id: string) => void;
  refreshData: () => Promise<void>;
  blockProcess: (pid: number, processName: string) => Promise<boolean>;
  createBackup: () => Promise<void>;
  simulateRansomwareAttack: () => Promise<void>;
  startDetectorProcess: () => Promise<void>;
  stopDetectorProcess: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_BASE_URL = "http://localhost:5001";

// --- Helper Functions ---
const getIconComponent = (iconType: IconType): React.JSX.Element => {
    switch (iconType) {
        case "FileWarning": return <FileWarning className="h-5 w-5" />;
        case "HardDrive": return <HardDrive className="h-5 w-5" />;
        case "Network": return <Network className="h-5 w-5" />;
        case "Activity": return <Activity className="h-5 w-5" />;
        case "AlertTriangle": return <AlertTriangle className="h-5 w-5 text-orange-500" />;
        default: return <FileWarning className="h-5 w-5" />;
      }
};
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
      if (typeof window === "undefined") return defaultValue;
      try {
        const stored = localStorage.getItem(key);
        if (stored && stored !== 'undefined' && stored !== 'null') {
          return JSON.parse(stored);
        }
        return defaultValue;
      } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
        try { localStorage.removeItem(key); }
        catch (removeError) { console.error(`Failed to remove corrupted key ${key}:`, removeError); }
        return defaultValue;
      }
};
const saveToStorage = <T,>(key: string, value: T): void => {
     if (typeof window === "undefined") return;
     try {
         if (value === undefined || value === null) { localStorage.removeItem(key); }
         else { localStorage.setItem(key, JSON.stringify(value)); }
     } catch (error) { console.error(`Error saving ${key} to localStorage:`, error); }
};
// --- End Helper Functions ---


export function AppProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  // --- State Definitions ---
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(() => loadFromStorage("systemStatus", "Detector Offline"));
  const [activeThreats, setActiveThreats] = useState<number>(() => loadFromStorage("activeThreats", 0));
  const [filesMonitored, setFilesMonitored] = useState<number>(() => loadFromStorage("filesMonitored", 0));
  const [aiEngineStatus, setAiEngineStatus] = useState<AppContextType["aiEngineStatus"]>(() => loadFromStorage("aiEngineStatus", "Offline"));
  const [alerts, setAlerts] = useState<Alert[]>(() => {
      const stored = loadFromStorage<Omit<Alert, "icon">[]>("alerts", []);
      // Ensure alerts are initialized with icons
      return stored.map(alert => ({ ...alert, icon: getIconComponent(alert.iconType) }));
  });
  const [detectorPid, setDetectorPid] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scannedFiles, setScannedFiles] = useState<string[]>([]);
  const [currentScanningFile, setCurrentScanningFile] = useState<string | null>(null);
  const [fileEvents, setFileEvents] = useState<FileEvent[]>([]); // Use FileEvent from context
  const [aiPredictions, setAiPredictions] = useState<AppContextType["aiPredictions"]>(() => loadFromStorage("aiPredictions", []));
  const [logs, setLogs] = useState<LogData>({ detector: "", simulation: "" });
  const [maliciousFiles, setMaliciousFiles] = useState<MaliciousFileInfo[]>(() => loadFromStorage("maliciousFiles", []));
  const [targetDirectory, setTargetDirectory] = useState<string>("C:\\test");

  // --- Local Storage Sync ---
  useEffect(() => { saveToStorage("systemStatus", systemStatus); }, [systemStatus]);
  useEffect(() => { saveToStorage("activeThreats", activeThreats); }, [activeThreats]);
  useEffect(() => { saveToStorage("filesMonitored", filesMonitored); }, [filesMonitored]);
  useEffect(() => { saveToStorage("aiEngineStatus", aiEngineStatus); }, [aiEngineStatus]);
  useEffect(() => {
      const serializableAlerts = alerts.map(({ icon, ...rest }) => rest);
      saveToStorage("alerts", serializableAlerts);
   }, [alerts]);
   useEffect(() => { saveToStorage("aiPredictions", aiPredictions); }, [aiPredictions]);
   useEffect(() => { saveToStorage("maliciousFiles", maliciousFiles); }, [maliciousFiles]);
  // --- End Local Storage ---

  // --- Log Parsing Function ---
  const parseDetectorLogs = useCallback((logContent: string) => {
    if (!logContent) return;

    const lines = logContent.split('\n').filter((line: string) => line.trim() !== '');
    const newAlerts: Omit<Alert, 'icon'>[] = []; // Create without icon initially
    const newPredictions: AppContextType["aiPredictions"] = [];
    const newFileEvents: FileEvent[] = []; // Use FileEvent from context
    const newMaliciousFilesBatch: MaliciousFileInfo[] = [];
    let backupInProgress = false; // Declare backupInProgress

    lines.forEach((line: string) => {
        try {
            const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3})/);
            const rawTimestamp = timestampMatch ? timestampMatch[1] : null;
            const displayTimestamp = rawTimestamp ? new Date(rawTimestamp.replace(',', '.')).toLocaleString() : new Date().toLocaleString();
            const epochTimestamp = rawTimestamp ? new Date(rawTimestamp.replace(',', '.')).getTime() : Date.now(); // Declare epochTimestamp

            const logMessage = timestampMatch ? line.substring(timestampMatch[0].length).trim() : line.trim();
            const levelMatch = logMessage.match(/^- (\w+) - (.*)/);
            // const logLevel = levelMatch ? levelMatch[1] : 'INFO';
            const messageContent = levelMatch ? levelMatch[2] : logMessage;

            let alertToAdd: Omit<Alert, 'icon'> | null = null;
            let predictionToAdd: AppContextType["aiPredictions"][0] | null = null;
            let fileEventToAdd: FileEvent | null = null;
            let maliciousFileToAdd: MaliciousFileInfo | null = null;

            // --- Structured Log Parsing ---
            if (messageContent.startsWith("[CRITICAL ALERT]")) {
                const reason = messageContent.replace("[CRITICAL ALERT] Reason: ", "");
                const filePathMatch = reason.match(/(?:File=|created|modified|note):?\s*(C:\\.*?)(?:$|\s*\(PID| - |\s*Prob=)/i);
                const filePath = filePathMatch ? filePathMatch[1].trim() : undefined;
                const typeMatch = reason.match(/^(.*?):/);
                const type = typeMatch ? typeMatch[1] : "Critical Event";
                let iconType: IconType = "AlertTriangle";
                if (type.includes("Ransom note")) iconType = "FileWarning";
                else if (type.includes("AI detected")) iconType = "Activity";

                alertToAdd = {
                    id: `${epochTimestamp}-crit-${Math.random()}`, type,
                    message: reason.substring(0, 100) + (reason.length > 100 ? '...' : ''),
                    timestamp: displayTimestamp, severity: 'critical', status: 'active', details: reason, iconType,
                    affectedFiles: filePath ? [filePath] : [],
                };
                if(filePath) maliciousFileToAdd = { path: filePath, timestamp: displayTimestamp, reason: reason };

            } else if (messageContent.startsWith("[Warning]")) {
                 const reason = messageContent.replace("[Warning] Reason: ", "");
                 const filePathMatch = reason.match(/(?:File=|created|modified|note):?\s*(C:\\.*?)(?:$|\s*\(PID| - |\s*Prob=)/i);
                 const filePath = filePathMatch ? filePathMatch[1].trim() : undefined;
                 const typeMatch = reason.match(/^(.*?):/);
                 const type = typeMatch ? typeMatch[1] : "Warning Event";
                 let severity: AlertSeverity = 'medium';
                 let iconType: IconType = "AlertTriangle";

                 if (type.includes("AI detected")) { iconType = "Activity"; severity = 'high'; }
                 else if (type.includes("Ransom note")) { iconType = "FileWarning"; severity = 'high'; }
                 else if (type.includes("Suspicious process")) { iconType = "HardDrive"; severity = 'medium'; }
                 else if (type.includes("Rapid modification")) { iconType = "Activity"; severity = 'medium'; }


                  alertToAdd = {
                     id: `${epochTimestamp}-warn-${Math.random()}`, type,
                     message: reason.substring(0, 100) + (reason.length > 100 ? '...' : ''),
                     timestamp: displayTimestamp, severity, status: 'active', details: reason, iconType,
                     affectedFiles: filePath ? [filePath] : [],
                 };
                 if(filePath && severity === 'high') maliciousFileToAdd = { path: filePath, timestamp: displayTimestamp, reason: reason };

            } else if (messageContent.startsWith("[AI_DETECT")) {
                 const probMatch = messageContent.match(/Probability=([\d.]+)/);
                 const fileMatch = messageContent.match(/File=([^,\s]+)/);
                 const confidence = probMatch ? parseFloat(probMatch[1]) : 0;
                 const filePath = fileMatch ? fileMatch[1].trim() : undefined;
                 predictionToAdd = { timestamp: displayTimestamp, prediction: "AI Detection", confidence, threatType: "File Analysis" };
                 if (confidence > 0.85) {
                    const reason = `AI High Confidence (${confidence.toFixed(2)}) detection on file: ${filePath || 'Unknown'}`;
                    alertToAdd = {
                        id: `${epochTimestamp}-ai-${Math.random()}`, type: "AI High Confidence",
                        message: reason, timestamp: displayTimestamp, severity: 'high', status: 'active', details: reason, iconType: "Activity",
                        affectedFiles: filePath ? [filePath] : [],
                        aiAnalysis: messageContent,
                    };
                    if(filePath) maliciousFileToAdd = { path: filePath, timestamp: displayTimestamp, reason: reason };
                 }
            } else if (messageContent.startsWith("[PROCESS_BLOCKED]") || messageContent.startsWith("[PROCESS_KILLED]")) {
                  predictionToAdd = { timestamp: displayTimestamp, prediction: "Process Action Taken", confidence: 1.0 };
            } else if (messageContent.startsWith("[BACKUP_START]")) {
                backupInProgress = true;
                predictionToAdd = { timestamp: displayTimestamp, prediction: "Backup Started", confidence: 1.0 };
            } else if (messageContent.startsWith("[BACKUP_END]")) {
                backupInProgress = false;
                predictionToAdd = { timestamp: displayTimestamp, prediction: "Backup Completed", confidence: 1.0 };
            }
            // --- Basic File Event Parsing ---
             else if (messageContent.startsWith("File created:")) {
                 const path = messageContent.replace("File created: ", "").trim();
                  if (!path.includes("_backup_")) {
                     fileEventToAdd = { path, operation: "create", timestamp: epochTimestamp };
                  }
             } else if (messageContent.startsWith("File modified:")) {
                  const path = messageContent.replace("File modified: ", "").trim();
                   if (!path.includes("_backup_")) {
                       fileEventToAdd = { path, operation: "modify", timestamp: epochTimestamp };
                   }
             }
             else if (messageContent.startsWith("File deleted:")) {
                 const path = messageContent.replace("File deleted: ", "").trim();
                  if (!path.includes("_backup_")) {
                      fileEventToAdd = { path, operation: "delete", timestamp: epochTimestamp };
                  }
             }
             else if (messageContent.startsWith("File moved:")) { // Example for rename/move
                 const pathsMatch = messageContent.match(/File moved: (.*?) -> (.*)/);
                  if(pathsMatch && pathsMatch.length === 3) {
                      const oldPath = pathsMatch[1].trim();
                      const newPath = pathsMatch[2].trim();
                       if (!oldPath.includes("_backup_") && !newPath.includes("_backup_")) {
                           fileEventToAdd = { path: newPath, operation: "rename", timestamp: epochTimestamp }; // Report event for the new path
                       }
                  }
             }


            // Add parsed items to temporary arrays
            if (alertToAdd) newAlerts.push(alertToAdd);
            if (predictionToAdd) newPredictions.push(predictionToAdd);
            if (fileEventToAdd) newFileEvents.push(fileEventToAdd);
            if (maliciousFileToAdd) newMaliciousFilesBatch.push(maliciousFileToAdd);

        } catch (e) { console.error("Error parsing log line:", line, e); }
    });

   // --- Update State ---
    setAlerts(prevAlerts => {
        const existingAlertIds = new Set(prevAlerts.map(a => a.id));
        // Filter out alerts that might be duplicates based on details and recent timestamp
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        const recentExistingDetails = new Set(
            prevAlerts
                .filter(a => new Date(a.timestamp).getTime() > fiveMinutesAgo)
                .map(a => a.details)
        );

        const uniqueNewAlerts = newAlerts.filter(a =>
            !existingAlertIds.has(a.id) && !recentExistingDetails.has(a.details)
        );

        if (uniqueNewAlerts.length === 0) return prevAlerts;

        const newAlertsWithIcons = uniqueNewAlerts.map(a => ({...a, icon: getIconComponent(a.iconType)}));
        const updatedAlerts = [...newAlertsWithIcons, ...prevAlerts].slice(0, 50);

        // Update activeThreats based on the new list immediately
        const newActiveCount = updatedAlerts.filter(a => a.status === 'active').length;
        if (newActiveCount !== activeThreats) {
             setActiveThreats(newActiveCount);
        }

        return updatedAlerts;
    });

    if (newMaliciousFilesBatch.length > 0) {
       setMaliciousFiles(prevMalicious => {
           const existingPaths = new Set(prevMalicious.map(f => f.path));
           const uniqueNewFiles = newMaliciousFilesBatch.filter(f => !existingPaths.has(f.path));
           if (uniqueNewFiles.length === 0) return prevMalicious;
           const updatedList = [...uniqueNewFiles, ...prevMalicious].slice(0, 100);
           return updatedList;
       });
   }

    if (newPredictions.length > 0) {
       setAiPredictions(prev => {
           const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
           const recentPredictionSignatures = new Set(
                prev
                    .filter(p => new Date(p.timestamp).getTime() > fiveMinutesAgo)
                    .map(p => `${p.prediction}-${p.threatType || ''}`)
           );
           const uniqueNewPreds = newPredictions.filter(p => !recentPredictionSignatures.has(`${p.prediction}-${p.threatType || ''}`));
           if (uniqueNewPreds.length === 0) return prev;
           const updatedPreds = [...uniqueNewPreds, ...prev].slice(0, 30);
           return updatedPreds;
       });
    }

    if (newFileEvents.length > 0) {
       setFileEvents(prev => [...newFileEvents, ...prev].slice(0, 100));
    }

     // --- Update System Status ---
     setAlerts(currentAlerts => { // Use functional update to get latest alerts state
          const currentActiveThreats = currentAlerts.filter(a => a.status === 'active').length;
          const isCriticalPresent = currentAlerts.some(a => a.status === 'active' && a.severity === 'critical');
          const currentEngineStatus = aiEngineStatus;
          let newSystemStatus: SystemStatus;

          if (currentEngineStatus === 'Offline') {
               newSystemStatus = 'Detector Offline';
          } else if (isScanning) {
               newSystemStatus = 'Scanning';
          } else if (currentEngineStatus === 'Online') {
               if (currentActiveThreats > 0) {
                   newSystemStatus = isCriticalPresent ? 'Under Attack' : 'At Risk';
               } else {
                   newSystemStatus = 'Protected';
               }
          } else {
               // Keep previous status if Starting/Learning unless it was Offline
               newSystemStatus = (systemStatus === 'Detector Offline' && (currentEngineStatus === 'Starting' || currentEngineStatus === 'Learning'))
                                   ? 'Protected' // Optimistic update
                                   : systemStatus;
          }

          if (newSystemStatus !== systemStatus) {
             setSystemStatus(newSystemStatus);
          }
          return currentAlerts;
     });

  }, [activeThreats, setActiveThreats, setMaliciousFiles, setAiPredictions, setFileEvents, setSystemStatus, aiEngineStatus, isScanning, systemStatus ]); // Dependencies


  // --- API Interaction Functions ---
   const fetchLogs = useCallback(async () => {
     let detectorLogContent = ""; // Keep track of fetched logs
     try {
       const [detectorRes, simulationRes] = await Promise.all([
         fetch(`${API_BASE_URL}/logs/detector`).catch(e => { console.error("Fetch detector log error:", e); return null; }),
         fetch(`${API_BASE_URL}/logs/simulation`).catch(e => { console.error("Fetch simulation log error:", e); return null; }),
       ]);

       const detectorData = detectorRes && detectorRes.ok ? await detectorRes.json() : { status: 'error', logs: detectorRes ? `Fetch failed (${detectorRes.status})` : 'Fetch failed' };
       const simulationData = simulationRes && simulationRes.ok ? await simulationRes.json() : { status: 'error', logs: simulationRes ? `Fetch failed (${simulationRes.status})` : 'Fetch failed' };


       const newLogData = {
          detector: detectorData.status === 'success' ? detectorData.logs : `Error: ${detectorData.message || detectorData.logs || 'Could not fetch detector logs.'}`,
          simulation: simulationData.status === 'success' ? simulationData.logs : `Error: ${simulationData.message || simulationData.logs || 'Could not fetch simulation logs.'}`,
       };
       setLogs(newLogData);

       if (detectorData.status === 'success' && detectorData.logs) {
           detectorLogContent = detectorData.logs;
       } else if (detectorData.status !== 'success') {
           console.warn("Detector logs fetch failed:", detectorData.message || detectorData.logs);
       }

     } catch (error) {
       console.error("Failed to fetch or parse logs:", error);
       setLogs({ detector: "Error fetching detector logs.", simulation: "Error fetching simulation logs." });
       toast({ title: "Log Fetch Error", description: `Could not fetch logs: ${String(error)}`, variant: "destructive" });
     } finally {
         if (detectorLogContent) {
              parseDetectorLogs(detectorLogContent);
         }
     }
   }, [toast, parseDetectorLogs]); // Added parseDetectorLogs


  const checkDetectorStatus = useCallback(async (showToast = false) => {
    let currentStatus: AppContextType["aiEngineStatus"] = "Offline";
    let currentPid: number | null = null;
    try {
        const response = await fetch(`${API_BASE_URL}/detector/status`);
        if (!response.ok) {
             let errorMsg = response.statusText;
             try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (parseError) { /* Ignore */ }
             throw new Error(errorMsg || `HTTP error ${response.status}`);
        }
        const data = await response.json();
        if (data.status === 'running') {
            currentStatus = "Online";
            currentPid = data.pid;
            if (showToast) toast({ title: "Detector Status", description: `Detector is running (PID: ${data.pid}).` });
        } else {
            currentStatus = "Offline";
            currentPid = null;
             if (showToast) toast({ title: "Detector Status", description: "Detector is not running.", variant: "destructive" });
        }
    } catch (error) {
        console.error("Failed to check detector status:", error);
        currentStatus = "Offline";
        currentPid = null;
        if (showToast) toast({ title: "Status Check Error", description: `Failed to get detector status: ${String(error)}`, variant: "destructive" });
    } finally {
        setAiEngineStatus(currentStatus);
        setDetectorPid(currentPid);
        // Update SystemStatus based on the fetched engine status
        setSystemStatus(prevSysStat => {
            if (currentStatus === "Offline") return "Detector Offline";
            if (prevSysStat === 'Detector Offline' && currentStatus === 'Online') return 'Protected'; // Default to protected if coming online
            // Otherwise, keep existing status; alert parsing will handle At Risk/Under Attack if Online
            return prevSysStat;
        });
    }
  }, [toast]); // Dependencies


  const refreshData = useCallback(async () => {
     toast({ title: "Refreshing Data...", description: "Fetching latest status and logs." });
     await checkDetectorStatus(false); // Check status silently
     await fetchLogs();             // Fetch logs (parses and updates status based on alerts)
     toast({ title: "Refresh Complete", description: "Data updated." });
  }, [checkDetectorStatus, fetchLogs, toast]);


  const startDetectorProcess = useCallback(async () => {
    setAiEngineStatus("Starting");
    toast({ title: "Starting Detector", description: "Attempting to start the detector process..." });
    try {
        const response = await fetch(`${API_BASE_URL}/detector/start`, { method: 'POST' });
         if (!response.ok) {
             let errorMsg = `HTTP error ${response.status}`;
             try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (parseError) { /* Ignore */ }
             throw new Error(errorMsg);
         }
        const data = await response.json();
        if (data.status === 'started' || data.status === 'already_running') {
            // Don't immediately set to Online; let checkDetectorStatus confirm
            await checkDetectorStatus(false); // Verify it's actually running
            toast({ title: "Detector Started", description: `Detector process ${data.status === 'started' ? 'started' : 'already running'} (PID: ${data.pid}).` });
            await fetchLogs();
        } else {
            throw new Error(data.message || `Failed to start detector (Status: ${data.status})`);
        }
    } catch (error) {
        console.error("Error starting detector process:", error);
        setAiEngineStatus("Offline");
        setSystemStatus("Detector Offline");
        setDetectorPid(null);
        toast({ title: "Start Error", description: `Failed to start detector: ${String(error)}`, variant: "destructive" });
    }
  }, [toast, fetchLogs, checkDetectorStatus]); // Added checkDetectorStatus


  const stopDetectorProcess = useCallback(async () => {
    toast({ title: "Stopping Detector", description: "Attempting to stop the detector process..." });
    const pidToStop = detectorPid;
    try {
        const response = await fetch(`${API_BASE_URL}/detector/stop`, { method: 'POST' });
        if (!response.ok && response.status !== 404) {
            let errorMsg = `HTTP error ${response.status}`;
            try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (parseError) { /* Ignore */ }
            throw new Error(errorMsg);
        }
        const data = await response.json();
        if (['stopped', 'already_stopped', 'not_running'].includes(data.status) || response.status === 404 ) {
            setAiEngineStatus("Offline");
            setSystemStatus("Detector Offline");
            setDetectorPid(null);
            toast({ title: "Detector Stopped", description: `Detector process (PID: ${pidToStop || 'N/A'}) status: ${data.status || 'not found'}.` });
        } else {
             setAiEngineStatus("Offline"); // Assume stopped even on weird response
             setSystemStatus("Detector Offline");
             setDetectorPid(null);
            throw new Error(data.message || `Failed to stop detector cleanly (Status: ${data.status})`);
        }
    } catch (error) {
        console.error("Error stopping detector process:", error);
         setAiEngineStatus("Offline");
         setSystemStatus("Detector Offline");
         setDetectorPid(null);
        toast({ title: "Stop Error", description: `Failed to stop detector (PID: ${pidToStop || 'N/A'}): ${String(error)}`, variant: "destructive" });
    }
  }, [toast, detectorPid]);


   const runScan = useCallback(async () => {
     if (isScanning) return;
     setIsScanning(true);
     setSystemStatus("Scanning");
     setScanProgress(0);
     setScannedFiles([]);
     setCurrentScanningFile("Initializing scan...");
     toast({ title: "Scan Requested", description: "Requesting backend directory scan..." });

     const interval = setInterval(() => {
         setScanProgress(prev => Math.min(prev + 15, 90)); // Faster progress simulation
     }, 150);

     try {
         const response = await fetch(`${API_BASE_URL}/scan`, { method: 'POST' });
         clearInterval(interval);

         if (!response.ok) {
             let errorMsg = `HTTP error ${response.status}`;
             try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (parseError) { /* Ignore */ }
             throw new Error(errorMsg);
         }
         const data = await response.json();

         if (data.status === 'scan_complete') {
             setScanProgress(100);
             const files = data.files_list || [];
             const count = data.files_scanned_count || files.length;
             setScannedFiles(files);
             setFilesMonitored(count);
             setCurrentScanningFile(null);
             toast({ title: "Scan Complete", description: `Backend scan finished. Found ${count} files.` });

             if (data.potential_issues && data.potential_issues.length > 0) {
                  const scanEpochTimestamp = Date.now(); // Timestamp for this batch of scan alerts
                  const newScanAlerts: Omit<Alert, 'icon'>[] = data.potential_issues.map((issue: any, index: number) => ({
                      id: `scan-${scanEpochTimestamp}-issue-${index}`, // Use timestamp
                      type: issue.issue.includes("Executable") ? "Executable File Found" : "Suspicious File Found",
                      message: `Scan detected: ${issue.issue} at ${issue.file.split('\\').pop()}`,
                      timestamp: new Date().toLocaleString(),
                      severity: 'medium' as AlertSeverity,
                      status: 'active' as AlertStatus,
                      details: `File scan detected: ${issue.issue} at ${issue.file}`,
                      iconType: 'FileWarning' as IconType,
                      affectedFiles: [issue.file]
                  }));

                   setAlerts(prevAlerts => {
                       const existingAlertDetails = new Set(prevAlerts.map(a => a.details));
                       const uniqueNewScanAlerts = newScanAlerts.filter(a => !existingAlertDetails.has(a.details));
                       if (uniqueNewScanAlerts.length === 0) return prevAlerts;
                       const alertsWithIcons = uniqueNewScanAlerts.map(a => ({ ...a, icon: getIconComponent(a.iconType) }));
                       const updatedAlerts = [...alertsWithIcons, ...prevAlerts].slice(0, 50);
                       setActiveThreats(updatedAlerts.filter(a => a.status === 'active').length); // Update active count
                       return updatedAlerts;
                   });
              }

         } else {
              throw new Error(data.message || "Backend scan did not report completion.");
         }
     } catch (error) {
         clearInterval(interval);
         console.error("Error running backend scan:", error);
         toast({ title: "Scan Error", description: `Failed to run backend scan: ${String(error)}`, variant: "destructive" });
         setScanProgress(0);
         setCurrentScanningFile("Scan failed");
     } finally {
         setIsScanning(false);
         // Let subsequent status checks or log parsing determine the final system status
         await checkDetectorStatus(false);
         // Refresh logs after scan potentially generated alerts
         await fetchLogs();
     }
   }, [isScanning, toast, checkDetectorStatus, fetchLogs, setActiveThreats, setAlerts]); // Added setActiveThreats, setAlerts, fetchLogs


   const simulateRansomwareAttack = useCallback(async () => {
     if (aiEngineStatus !== 'Online') {
          toast({ title: "Simulation Blocked", description: "Cannot simulate attack while detector is offline.", variant: "destructive" });
          return;
     }
     toast({ title: "Simulating Attack...", description: "Initiating backend ransomware simulation." });
     try {
       const response = await fetch(`${API_BASE_URL}/simulate`, { method: 'POST' });
        if (!response.ok) {
            let errorMsg = `HTTP error ${response.status}`;
            try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (parseError) { /* Ignore */ }
            throw new Error(errorMsg);
        }
       const data = await response.json();
       if (data.status === 'simulation_started') {
         toast({ title: "Simulation Running", description: data.message + " Check logs for activity." });
         setTimeout(() => {
           refreshData(); // Refresh after simulation likely done
         }, 9000); // Increased delay slightly
       } else {
         throw new Error(data.message || "Failed to start simulation");
       }
     } catch (error) {
       console.error("Error simulating ransomware attack:", error);
       toast({ title: "Simulation Error", description: `Could not start simulation: ${String(error)}`, variant: "destructive" });
     }
   }, [toast, refreshData, aiEngineStatus]);


  // --- Frontend Action Handlers ---
  const blockProcess = async (pid: number, processName: string): Promise<boolean> => {
      toast({
          title: "Block Action Info",
          description: `Process blocking for ${processName} (PID: ${pid}) is managed by the backend detector. Monitor logs.`
      });
      return false;
  };

  const createBackup = async (): Promise<void> => {
      toast({
          title: "Backup Info",
          description: "Backups are handled automatically by the backend detector. Check logs."
      });
  };


  // --- Alert Management ---
   const resolveAlert = useCallback((id: string) => {
     let alertResolved = false;
     setAlerts(prev => {
         const updatedAlerts = prev.map(alert => {
             if (alert.id === id && alert.status !== 'resolved') {
                 alertResolved = true;
                 return { ...alert, status: "resolved" as AlertStatus };
             }
             return alert;
         });
         // Only update state if an alert was actually resolved
         return alertResolved ? updatedAlerts : prev;
     });

     if (alertResolved) {
         // Update active threats count using a functional update on setActiveThreats
         setActiveThreats(currentActiveCount => {
             // Recalculate based on the assumption the alert WAS resolved
             const newCount = alerts.filter(alert => alert.status === 'active' && alert.id !== id).length;
             return newCount;
         });

         // Update system status based on the potentially new active threat count
         setSystemStatus(prevStatus => {
             if (aiEngineStatus !== 'Online') return prevStatus; // Only change if online
             const newActiveCount = alerts.filter(alert => alert.status === 'active' && alert.id !== id).length;
             // If resolving the *last* active alert, transition to Protected
             return newActiveCount === 0 ? 'Protected' : 'At Risk'; // Assume At Risk if >0 alerts remain
         });
         toast({ title: "Alert Resolved", description: `Alert marked as resolved.` });
     }
   }, [alerts, aiEngineStatus, toast, setActiveThreats, setSystemStatus]);


   const investigateAlert = useCallback((id: string) => {
     let alertChanged = false;
     setAlerts(prev =>
       prev.map(alert => {
         if (alert.id === id && alert.status === 'active') {
           alertChanged = true;
           return { ...alert, status: "investigating" };
         }
         return alert;
       })
     );
     if(alertChanged) toast({ title: "Alert Investigating", description: `Alert marked as investigating.` });
   }, [toast]);


  // --- Initial Load Effect ---
  useEffect(() => {
      console.log("AppContext Initializing...");
      refreshData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // --- Context Value ---
  const value: AppContextType = {
    systemStatus, activeThreats, filesMonitored, aiEngineStatus, alerts,
    isScanning, scanProgress, scannedFiles, currentScanningFile, fileEvents,
    aiPredictions, targetDirectory, logs, detectorPid, maliciousFiles,
    runScan, resolveAlert, investigateAlert, refreshData, blockProcess, createBackup,
    simulateRansomwareAttack, startDetectorProcess, stopDetectorProcess,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}