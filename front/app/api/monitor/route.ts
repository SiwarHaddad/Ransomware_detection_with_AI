import { NextResponse } from "next/server"

// Mock file system monitoring data
const generateMockFileSystemEvents = () => {
  const operations = ["read", "write", "delete", "rename", "permission_change"]
  const processes = [
    { name: "explorer.exe", pid: 1234, path: "C:\\Windows\\explorer.exe" },
    { name: "chrome.exe", pid: 5678, path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" },
    { name: "word.exe", pid: 9012, path: "C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE" },
    { name: "suspicious.exe", pid: 3456, path: "C:\\Users\\User\\Downloads\\suspicious.exe" },
  ]
  const filePaths = [
    "C:\\Users\\User\\Documents\\important.docx",
    "C:\\Users\\User\\Documents\\financial.xlsx",
    "C:\\Users\\User\\Pictures\\vacation.jpg",
    "C:\\Users\\User\\Downloads\\setup.exe",
    "C:\\Program Files\\Application\\data.db",
  ]

  const events = []
  const now = Date.now()

  for (let i = 0; i < 20; i++) {
    const operation = operations[Math.floor(Math.random() * operations.length)]
    const process = processes[Math.floor(Math.random() * processes.length)]
    const filePath = filePaths[Math.floor(Math.random() * filePaths.length)]

    const event = {
      path: filePath,
      operation,
      timestamp: now - Math.floor(Math.random() * 300000), // Random time in the last 5 minutes
      process: { ...process },
      metadata: {},
    }

    // Add operation-specific metadata
    if (operation === "write") {
      event.metadata = {
        fileSize: Math.floor(Math.random() * 1000000),
        entropy: Math.random(), // Random entropy value between 0 and 1
      }
    } else if (operation === "rename") {
      const oldPath = filePath
      const newPath = filePath.replace(/\.[^/.]+$/, "") + (Math.random() > 0.7 ? ".encrypted" : ".bak")
      event.metadata = {
        oldPath,
        newPath,
      }
    } else if (operation === "permission_change") {
      event.metadata = {
        oldPermissions: "rw-r--r--",
        newPermissions: "rwxrwxrwx",
      }
    }

    events.push(event)
  }

  // Add some suspicious ransomware-like events if random chance
  if (Math.random() > 0.7) {
    const suspiciousProcess = processes[3] // suspicious.exe

    // Add multiple file renames with suspicious extensions
    for (let i = 0; i < 5; i++) {
      const originalPath = `C:\\Users\\User\\Documents\\important_file_${i}.docx`
      events.push({
        path: originalPath,
        operation: "rename",
        timestamp: now - Math.floor(Math.random() * 60000), // Last minute
        process: { ...suspiciousProcess },
        metadata: {
          oldPath: originalPath,
          newPath: `C:\\Users\\User\\Documents\\important_file_${i}.docx.locked`,
        },
      })
    }

    // Add high entropy writes
    for (let i = 0; i < 5; i++) {
      events.push({
        path: `C:\\Users\\User\\Documents\\file_${i}.docx`,
        operation: "write",
        timestamp: now - Math.floor(Math.random() * 60000), // Last minute
        process: { ...suspiciousProcess },
        metadata: {
          fileSize: Math.floor(Math.random() * 1000000),
          entropy: 0.95 + Math.random() * 0.05, // Very high entropy (0.95-1.0)
        },
      })
    }
  }

  return events
}

export async function GET() {
  try {
    // In a real implementation, this would connect to a file system monitoring service
    const fileSystemEvents = generateMockFileSystemEvents()

    return NextResponse.json({
      status: "success",
      timestamp: Date.now(),
      events: fileSystemEvents,
    })
  } catch (error) {
    console.error("Error in file system monitoring:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
