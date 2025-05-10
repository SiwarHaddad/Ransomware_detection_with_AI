// This file contains the core AI detection logic for ransomware behavior

// Entropy calculation function to detect encryption
export function calculateEntropy(buffer: ArrayBuffer): number {
  const array = new Uint8Array(buffer)
  const length = array.length

  // Count occurrences of each byte value
  const counts = new Array(256).fill(0)
  for (let i = 0; i < length; i++) {
    counts[array[i]]++
  }

  // Calculate entropy using Shannon's formula
  let entropy = 0
  for (let i = 0; i < 256; i++) {
    if (counts[i] > 0) {
      const probability = counts[i] / length
      entropy -= probability * Math.log2(probability)
    }
  }

  // Normalize to 0-1 range
  return entropy / 8
}

// Detect suspicious file extension changes
export function detectSuspiciousExtensions(oldExt: string, newExt: string): boolean {
  const knownRansomwareExtensions = [
    "locked",
    "encrypt",
    "crypted",
    "crypt",
    "crypto",
    "pay",
    "ransom",
    "vault",
    "wcry",
    "wncry",
    "wncryt",
    "encrypted",
    "enc",
    "WNCRY",
    "WCRY",
    "WNCRYPT",
    "CRAB",
    "THOR",
    "LOL!",
    "THANOS",
    "CRYPT",
    "LOCK",
    "KEYBTC@INBOX_COM",
    "SAGE",
    "CRYPTED",
    "CRINF",
  ]

  // Check if the new extension is a known ransomware extension
  return knownRansomwareExtensions.some((ext) => newExt.toLowerCase().includes(ext.toLowerCase()))
}

// Analyze process behavior for ransomware patterns
export function analyzeProcessBehavior(
  processName: string,
  fileOperations: Array<{
    type: string
    path: string
    timestamp: number
  }>,
): {
  suspiciousScore: number
  reasons: string[]
} {
  const reasons: string[] = []
  let suspiciousScore = 0

  // Check for high frequency of operations
  if (fileOperations.length > 50) {
    suspiciousScore += 0.2
    reasons.push("High frequency of file operations")
  }

  // Check for operations across multiple directories
  const directories = new Set(fileOperations.map((op) => op.path.substring(0, op.path.lastIndexOf("/"))))

  if (directories.size > 5) {
    suspiciousScore += 0.2
    reasons.push("Operations across multiple directories")
  }

  // Check for operations on many files in a short time
  const timespan =
    Math.max(...fileOperations.map((op) => op.timestamp)) - Math.min(...fileOperations.map((op) => op.timestamp))

  if (fileOperations.length > 20 && timespan < 60000) {
    // 1 minute
    suspiciousScore += 0.3
    reasons.push("Many files accessed in a short time period")
  }

  // Check for suspicious process name
  const suspiciousProcessPatterns = ["ransom", "crypt", "locker", "lock", "encrypt", "decrypt"]

  if (suspiciousProcessPatterns.some((pattern) => processName.toLowerCase().includes(pattern))) {
    suspiciousScore += 0.3
    reasons.push("Suspicious process name")
  }

  return {
    suspiciousScore: Math.min(suspiciousScore, 1), // Cap at 1.0
    reasons,
  }
}

// Main detection function that combines all checks
export async function detectRansomware(
  fileOperations: any[],
  processInfo: any,
  fileContents: Map<string, ArrayBuffer>,
): Promise<{
  isRansomware: boolean
  confidence: number
  details: string[]
  recommendedActions: string[]
}> {
  const details: string[] = []
  let totalConfidence = 0

  // Check file operations
  const behaviorAnalysis = analyzeProcessBehavior(processInfo.name, fileOperations)

  totalConfidence += behaviorAnalysis.confidence * 0.4 // 40% weight
  details.push(...behaviorAnalysis.reasons)

  // Check file entropy
  let highEntropyCount = 0

  for (const [filePath, buffer] of fileContents.entries()) {
    const entropy = calculateEntropy(buffer)
    if (entropy > 0.8) {
      highEntropyCount++
    }
  }

  if (highEntropyCount > 0) {
    const entropyConfidence = Math.min(highEntropyCount / 10, 1) * 0.4 // 40% weight
    totalConfidence += entropyConfidence
    details.push(`${highEntropyCount} files with high entropy detected`)
  }

  // Check extension changes
  const extensionChanges = fileOperations.filter((op) => op.type === "rename" && op.oldPath && op.newPath)

  let suspiciousExtensionCount = 0

  for (const change of extensionChanges) {
    const oldExt = change.oldPath.split(".").pop() || ""
    const newExt = change.newPath.split(".").pop() || ""

    if (detectSuspiciousExtensions(oldExt, newExt)) {
      suspiciousExtensionCount++
    }
  }

  if (suspiciousExtensionCount > 0) {
    const extensionConfidence = Math.min(suspiciousExtensionCount / 5, 1) * 0.2 // 20% weight
    totalConfidence += extensionConfidence
    details.push(`${suspiciousExtensionCount} suspicious file extension changes detected`)
  }

  // Determine if it's ransomware based on confidence threshold
  const isRansomware = totalConfidence > 0.6 // 60% confidence threshold

  // Generate recommended actions
  const recommendedActions = []

  if (isRansomware) {
    recommendedActions.push("Terminate and block the suspicious process")
    recommendedActions.push("Isolate affected system from network")
    recommendedActions.push("Create system snapshot for recovery")
    recommendedActions.push("Scan for additional malware")
  } else if (totalConfidence > 0.3) {
    recommendedActions.push("Monitor the process for additional suspicious activity")
    recommendedActions.push("Backup important files as a precaution")
  }

  return {
    isRansomware,
    confidence: totalConfidence,
    details,
    recommendedActions,
  }
}
