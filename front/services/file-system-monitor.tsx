/**
 * File System Monitor Service
 * Based on the Python implementation provided
 */

// Constants for detection thresholds
// const ENTROPY_THRESHOLD = 7.0;
// const RAPID_MODIFICATION_WINDOW_SECONDS = 10;
// const RAPID_MODIFICATION_THRESHOLD = 10;
// const HONEYPOT_FILE_COUNT = 5;
// const RANSOM_NOTE_KEYWORDS = ["DECRYPT", "RANSOM", "RECOVER", "README", "HELP", "INSTRUCTION"];
// const EXECUTABLE_EXTENSIONS = [".exe", ".dll", ".bat", ".scr", ".com"];
// const RANSOMWARE_EXTENSIONS = [".encrypted", ".locked", ".crypto", ".ransom", ".crypt", ".pay", ".wallet"];

// The target directory to monitor
export const TARGET_DIRECTORY = "C:\Users\siwar\Desktop\all\back\monitored_documents"

// Types for file events
export type FileOperation = "create" | "modify" | "delete" | "rename";
export type FileEvent = {
  path: string;
  operation: FileOperation;
  timestamp: number;
  process?: {
    name: string;
    pid: number;
  };
  metadata?: {
    oldPath?: string;
    newPath?: string;
    entropy?: number;
    size?: number;
  };
};

// Types for detection results
// export type DetectionResult = {
//   isRansomware: boolean;
//   confidence: number;
//   reason: string;
//   affectedFiles: string[];
//   suspiciousProcesses: {
//     pid: number;
//     name: string;
//     reason: string;
//   }[];
//   timestamp: number;
// };

// // Generate realistic file paths within the test directory
// // **** ADDED 'export' KEYWORD HERE ****
// export function generateRealisticFilePaths(count: number): string[] {
//   const fileTypes = [
//     { ext: ".docx", prefix: "Document_" },
//     { ext: ".xlsx", prefix: "Spreadsheet_" },
//     { ext: ".pdf", prefix: "Report_" },
//     { ext: ".jpg", prefix: "Photo_" },
//     { ext: ".png", prefix: "Image_" },
//     { ext: ".txt", prefix: "Notes_" },
//     { ext: ".pptx", prefix: "Presentation_" },
//   ];

//   const subfolders = ["", "Work/", "Personal/", "Projects/", "Financial/", "Images/"];
//   const paths: string[] = [];

//   for (let i = 0; i < count; i++) {
//     const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
//     const subfolder = subfolders[Math.floor(Math.random() * subfolders.length)];
//     const fileName = `${fileType.prefix}${Math.floor(Math.random() * 1000)}${fileType.ext}`;
//     const basePath = TARGET_DIRECTORY.endsWith('\\') ? TARGET_DIRECTORY : TARGET_DIRECTORY + '\\';
//     paths.push(`${basePath}${subfolder.replace('/', '\\')}${fileName}`);
//   }

//   return paths;
// }


// // Mock file system events
// export function generateMockFileEvents(count = 20, simulateRansomware = false): FileEvent[] {
//   const operations: FileOperation[] = ["create", "modify", "delete", "rename"];
//   const processes = [
//     { name: "explorer.exe", pid: 1234 },
//     { name: "chrome.exe", pid: 5678 },
//     { name: "word.exe", pid: 9012 },
//     { name: "suspicious.exe", pid: 3456 },
//   ];

//   const filePaths: string[] = generateRealisticFilePaths(20);

//   const events: FileEvent[] = [];
//   const now = Date.now();

//   for (let i = 0; i < count; i++) {
//     const operation = operations[Math.floor(Math.random() * operations.length)];
//     const process = processes[Math.floor(Math.random() * (processes.length - 1))];
//     const filePath = filePaths.length > 0 ? filePaths[Math.floor(Math.random() * filePaths.length)] : `${TARGET_DIRECTORY}\\fallback_file_${i}.txt`;

//     const event: FileEvent = {
//       path: filePath,
//       operation,
//       timestamp: now - Math.floor(Math.random() * 300000),
//       process: { ...process },
//       metadata: {},
//     };

//     if (operation === "modify") {
//       event.metadata = {
//         size: Math.floor(Math.random() * 1000000),
//         entropy: Math.random() * 0.6,
//       };
//     } else if (operation === "rename") {
//       const oldPath = filePath;
//       const newPath = filePath.replace(/\.[^/\\]+$/, ".bak");
//       event.metadata = {
//         oldPath,
//         newPath,
//       };
//     }

//     events.push(event);
//   }

//   if (simulateRansomware) {
//     const suspiciousProcess = processes[3];
//     const ransomwareTimestamp = now - Math.floor(Math.random() * 60000);

//     events.push({
//       path: `${TARGET_DIRECTORY}\\README_DECRYPT.txt`,
//       operation: "create",
//       timestamp: ransomwareTimestamp,
//       process: { ...suspiciousProcess },
//       metadata: {
//         size: 2048,
//         entropy: 0.3,
//       },
//     });

//     for (let i = 0; i < 10 && i < filePaths.length; i++) {
//         const originalPath = filePaths[i];
//         const ransomExt = RANSOMWARE_EXTENSIONS[Math.floor(Math.random() * RANSOMWARE_EXTENSIONS.length)];

//         events.push({
//             path: originalPath,
//             operation: "rename",
//             timestamp: ransomwareTimestamp - Math.floor(Math.random() * 10000),
//             process: { ...suspiciousProcess },
//             metadata: {
//             oldPath: originalPath,
//             newPath: `${originalPath}${ransomExt}`,
//             },
//         });
//     }

//     for (let i = 10; i < 15 && i < filePaths.length; i++) {
//       events.push({
//         path: filePaths[i],
//         operation: "modify",
//         timestamp: ransomwareTimestamp - Math.floor(Math.random() * 15000),
//         process: { ...suspiciousProcess },
//         metadata: {
//           size: Math.floor(Math.random() * 1000000),
//           entropy: 0.95 + Math.random() * 0.05,
//         },
//       });
//     }
//   }

//   return events;
// }

// // Simulate scanning a directory
// export function simulateScan(directory: string): Promise<string[]> {
//   return new Promise((resolve) => {
//     if (directory !== TARGET_DIRECTORY) {
//       resolve([]);
//       return;
//     }

//     const scannedFiles: string[] = generateRealisticFilePaths(30);

//     setTimeout(() => {
//       resolve(scannedFiles);
//     }, 500);
//   });
// }

// // Analyze file events for ransomware behavior
// export function analyzeFileEvents(events: FileEvent[]): DetectionResult {
//   const result: DetectionResult = {
//     isRansomware: false,
//     confidence: 0,
//     reason: "No suspicious activity detected",
//     affectedFiles: [],
//     suspiciousProcesses: [],
//     timestamp: Date.now(),
//   };

//   const highEntropyFiles = events.filter(
//     (event) => event.operation === "modify" && event.metadata?.entropy && event.metadata.entropy > 0.8,
//   );

//   if (highEntropyFiles.length > 3) {
//     result.isRansomware = true;
//     result.confidence += 0.4;
//     result.reason = "Multiple high entropy file modifications detected";
//     result.affectedFiles = highEntropyFiles.map((event) => event.path);
//     if (highEntropyFiles[0].process) {
//       result.suspiciousProcesses.push({
//         pid: highEntropyFiles[0].process.pid,
//         name: highEntropyFiles[0].process.name,
//         reason: "Process performing high entropy writes",
//       });
//     }
//   }

//   const suspiciousRenames = events.filter(
//     (event) =>
//       event.operation === "rename" &&
//       event.metadata?.newPath &&
//       RANSOMWARE_EXTENSIONS.some((ext) => event.metadata?.newPath?.endsWith(ext)),
//   );

//   if (suspiciousRenames.length > 2) {
//     result.isRansomware = true;
//     result.confidence += 0.5;
//     result.reason = "Multiple files renamed with suspicious extensions";
//     result.affectedFiles = [...result.affectedFiles, ...suspiciousRenames.map((event) => event.path)];
//     if (suspiciousRenames[0].process) {
//       result.suspiciousProcesses.push({
//         pid: suspiciousRenames[0].process.pid,
//         name: suspiciousRenames[0].process.name,
//         reason: "Process renaming files with suspicious extensions",
//       });
//     }
//   }

//   const potentialRansomNotes = events.filter(
//     (event) =>
//       event.operation === "create" &&
//       RANSOM_NOTE_KEYWORDS.some((keyword) => event.path.toUpperCase().includes(keyword)),
//   );

//   if (potentialRansomNotes.length > 0) {
//     result.isRansomware = true;
//     result.confidence += 0.7;
//     result.reason = "Potential ransom note created";
//     result.affectedFiles = [...result.affectedFiles, ...potentialRansomNotes.map((event) => event.path)];
//     if (potentialRansomNotes[0].process) {
//       result.suspiciousProcesses.push({
//         pid: potentialRansomNotes[0].process.pid,
//         name: potentialRansomNotes[0].process.name,
//         reason: "Process creating potential ransom note",
//       });
//     }
//   }

//   const fileModificationMap = new Map<string, number[]>();
//   events.forEach((event) => {
//     if (event.operation === "modify") {
//       if (!fileModificationMap.has(event.path)) {
//         fileModificationMap.set(event.path, []);
//       }
//       const timestamps = fileModificationMap.get(event.path);
//       if (timestamps) {
//         timestamps.push(event.timestamp);
//       }
//     }
//   });


//   let rapidModificationCount = 0;
//   fileModificationMap.forEach((timestamps, filePath) => {
//     if (timestamps.length >= RAPID_MODIFICATION_THRESHOLD) {
//       timestamps.sort();
//       const timespan = timestamps[timestamps.length - 1] - timestamps[0];
//       if (timespan <= RAPID_MODIFICATION_WINDOW_SECONDS * 1000) {
//         rapidModificationCount++;
//         result.affectedFiles.push(filePath);
//       }
//     }
//   });

//   if (rapidModificationCount > 3) {
//     result.isRansomware = true;
//     result.confidence += 0.3;
//     result.reason =
//       result.reason === "No suspicious activity detected"
//         ? "Rapid file modifications detected"
//         : `${result.reason}, rapid file modifications detected`;
//   }

//   result.confidence = Math.min(result.confidence, 1.0);
//   result.affectedFiles = [...new Set(result.affectedFiles)];

//   return result;
// }

// // Simulate blocking a process
// export function simulateProcessBlock(pid: number, processName: string): Promise<boolean> {
//   return new Promise((resolve) => {
//     console.log(`Attempting to block process: ${processName} (PID: ${pid})`);
//     setTimeout(() => {
//       const success = Math.random() > 0.2;
//       console.log(`Process ${processName} (PID: ${pid}) ${success ? "blocked successfully" : "block failed"}`);
//       resolve(success);
//     }, 800);
//   });
// }

// // Create honeypot files
// export function createHoneypots(directory: string, count: number = HONEYPOT_FILE_COUNT): string[] {
//   console.log(`Creating ${count} honeypot files in ${directory}`);
//   const honeypotFiles: string[] = [];
//   for (let i = 0; i < count; i++) {
//     const filePath = `${directory}\\honeypot_${i}_${Date.now()}.txt`;
//     honeypotFiles.push(filePath);
//   }
//   return honeypotFiles;
// }

// // Backup files
// export function backupFiles(
//   sourceDir: string,
//   backupDir: string,
// ): Promise<{
//   copiedFiles: number;
//   copiedDirs: number;
//   skippedFiles: number;
// }> {
//   return new Promise((resolve) => {
//     console.log(`Backing up ${sourceDir} to ${backupDir}`);
//     setTimeout(() => {
//       const result = {
//         copiedFiles: Math.floor(Math.random() * 100) + 50,
//         copiedDirs: Math.floor(Math.random() * 10) + 5,
//         skippedFiles: Math.floor(Math.random() * 10),
//       };
//       console.log(`Backup complete: ${result.copiedFiles} files, ${result.copiedDirs} directories`);
//       resolve(result);
//     }, 1500);
//   });
// }