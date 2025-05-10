// components/ai-analysis-panel.tsx
"use client";

import { useAppContext } from "@/context/app-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Brain, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function AiAnalysisPanel() {
  const { aiPredictions, aiEngineStatus } = useAppContext();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-500" />
              AI Analysis & Predictions
            </CardTitle>
            <CardDescription>Insights derived from detector logs and analysis</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                aiEngineStatus === "Online" ? "default"
                : aiEngineStatus === "Learning" ? "outline"
                : aiEngineStatus === "Starting" ? "default" // Use default or secondary
                : "destructive" // Offline
              }
              className={
                   aiEngineStatus === "Learning" ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                 : aiEngineStatus === "Starting" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 animate-pulse"
                 : ""
                }
            >
              {aiEngineStatus}
            </Badge>
            {/* Button was removed in previous step */}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px]">
          <div className="space-y-3">
            {aiPredictions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <Activity className="h-10 w-10 mb-2" />
                <p>No AI predictions available yet</p>
                <p className="text-sm">Start the detector and run activities.</p>
              </div>
            ) : (
              aiPredictions.map((prediction, index) => (
                <div
                  key={`${prediction.timestamp}-${index}-${prediction.prediction}`} // Improved key uniqueness
                  className={`p-3 rounded-md border ${
                    prediction.confidence > 0.7 && prediction.prediction.includes("Threat")
                      ? "bg-red-50 border-red-200"
                      : prediction.confidence > 0.4 && prediction.prediction.includes("Threat")
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-green-50 border-green-200"
                  }`}
                >
                  {/* Fixed the erroneous className in the div below */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      {/* Logic for displaying icons based on confidence and type */}
                      {prediction.confidence > 0.7 && prediction.prediction !== 'Backup Completed' && prediction.prediction !== 'Process Action Taken' ? (
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                      ) : prediction.confidence > 0.4 && prediction.prediction !== 'Backup Completed' && prediction.prediction !== 'Process Action Taken' ? (
                        <Activity className="h-4 w-4 mr-2 text-yellow-500" />
                      ) : (
                        <Brain className="h-4 w-4 mr-2 text-green-500" /> // Default/Low confidence/Non-threats
                      )}
                      <span className="font-medium">{prediction.prediction}</span>
                    </div>
                    <Badge
                       variant={
                           prediction.confidence > 0.7 && prediction.prediction !== 'Backup Completed' && prediction.prediction !== 'Process Action Taken' ? "destructive" :
                           prediction.confidence === 1.0 ? "default" : // Default for backups/actions
                           "outline" // Outline for low confidence/benign
                        }
                       className={
                           prediction.confidence <= 0.7 && prediction.confidence > 0.4 && prediction.prediction !== 'Backup Completed' && prediction.prediction !== 'Process Action Taken' ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" :
                           prediction.confidence <= 0.4 && prediction.confidence !== 1.0 ? "bg-green-100 text-green-800 hover:bg-green-100" : ""
                       }
                    >
                      {Math.round(prediction.confidence * 100)}% Confidence
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground flex justify-between">
                    <span>{prediction.timestamp}</span>
                    {prediction.threatType && <span className="font-medium text-red-600">{prediction.threatType}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}