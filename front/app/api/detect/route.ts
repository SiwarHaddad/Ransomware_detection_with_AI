import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Interface for file activity data
interface FileActivity {
  path: string
  operation: "read" | "write" | "delete" | "rename" | "permission_change"
  timestamp: number
  process: {
    name: string
    pid: number
    path: string
  }
  metadata?: {
    oldPath?: string
    newPath?: string
    oldPermissions?: string
    newPermissions?: string
    fileSize?: number
    entropy?: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const fileActivities: FileActivity[] = data.activities

    if (!fileActivities || !Array.isArray(fileActivities) || fileActivities.length === 0) {
      return NextResponse.json({ error: "Invalid input: file activities array is required" }, { status: 400 })
    }

    // Analyze file activities for ransomware patterns
    const analysisResult = await analyzeFileActivities(fileActivities)

    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error("Error in ransomware detection:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function analyzeFileActivities(activities: FileActivity[]) {
  // Extract features for AI analysis
  const features = extractFeatures(activities)

  // Use AI to analyze the features
  const aiAnalysis = await performAIAnalysis(features)

  return {
    threatDetected: aiAnalysis.threatDetected,
    confidence: aiAnalysis.confidence,
    details: aiAnalysis.details,
    recommendedActions: aiAnalysis.recommendedActions,
    timestamp: Date.now(),
  }
}

function extractFeatures(activities: FileActivity[]) {
  // Count operations by type
  const operationCounts = {
    read: 0,
    write: 0,
    delete: 0,
    rename: 0,
    permission_change: 0,
  }

  // Track unique processes
  const processes = new Set<string>()

  // Track file extensions being changed
  const extensionChanges: { from: string; to: string }[] = []

  // Track entropy values for write operations
  const writeEntropies: number[] = []

  // Process each activity
  activities.forEach((activity) => {
    // Count operation types
    operationCounts[activity.operation]++

    // Track unique processes
    processes.add(`${activity.process.name}:${activity.process.pid}`)

    // Check for extension changes in rename operations
    if (activity.operation === "rename" && activity.metadata?.oldPath && activity.metadata?.newPath) {
      const oldExt = activity.metadata.oldPath.split(".").pop() || ""
      const newExt = activity.metadata.newPath.split(".").pop() || ""

      if (oldExt !== newExt) {
        extensionChanges.push({ from: oldExt, to: newExt })
      }
    }

    // Track entropy for write operations
    if (activity.operation === "write" && activity.metadata?.entropy !== undefined) {
      writeEntropies.push(activity.metadata.entropy)
    }
  })

  // Calculate average entropy for write operations
  const avgWriteEntropy =
    writeEntropies.length > 0 ? writeEntropies.reduce((sum, val) => sum + val, 0) / writeEntropies.length : 0

  return {
    totalActivities: activities.length,
    timespan: activities.length > 0 ? activities[activities.length - 1].timestamp - activities[0].timestamp : 0,
    operationCounts,
    uniqueProcessCount: processes.size,
    processes: Array.from(processes),
    extensionChanges,
    avgWriteEntropy,
    highEntropyWrites: writeEntropies.filter((e) => e > 0.8).length,
  }
}

async function performAIAnalysis(features: any) {
  // For demonstration purposes, we'll use a simple rule-based approach
  // In a real implementation, this would use the AI SDK to analyze the features

  let threatDetected = false
  let confidence = 0
  let details = "No suspicious activity detected"
  const recommendedActions: string[] = []

  // Check for high number of write operations in a short timespan
  if (features.operationCounts.write > 50 && features.timespan < 60000) {
    threatDetected = true
    confidence += 0.3
    details = "High volume of write operations in a short time period"
    recommendedActions.push("Monitor the processes performing these operations")
  }

  // Check for extension changes
  if (features.extensionChanges.length > 10) {
    threatDetected = true
    confidence += 0.4
    details = "Multiple file extension changes detected"
    recommendedActions.push("Block processes changing file extensions")
  }

  // Check for high entropy writes
  if (features.highEntropyWrites > 5) {
    threatDetected = true
    confidence += 0.5
    details = "Multiple high-entropy write operations detected"
    recommendedActions.push("Isolate affected files")
    recommendedActions.push("Terminate processes performing high-entropy writes")
  }

  // In a real implementation, we would use the AI SDK here
  if (threatDetected) {
    try {
      // This is where we would use the AI SDK to analyze the features
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: `Analyze this file system activity for ransomware behavior:
        ${JSON.stringify(features, null, 2)}
        
        Provide a detailed analysis of whether this represents ransomware activity, 
        the confidence level, and recommended actions.`,
      })

      // Parse the AI response (simplified for demonstration)
      // In a real implementation, we would structure the prompt to get a structured response
      return {
        threatDetected: true,
        confidence: Math.min(confidence, 0.95),
        details: details,
        recommendedActions,
        aiAnalysis: text,
      }
    } catch (error) {
      console.error("Error using AI for analysis:", error)
      // Fall back to rule-based results if AI fails
    }
  }

  return {
    threatDetected,
    confidence: Math.min(confidence, 0.95),
    details,
    recommendedActions,
  }
}
