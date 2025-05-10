import { Card, CardContent } from "@/components/ui/card"
import type { ReactNode } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SystemStatusCardProps {
  title: string
  status: string
  icon: ReactNode
  statusColor: string
  details?: string
  trend?: "up" | "down" | "stable"
  trendValue?: string
}

export default function SystemStatusCard({
  title,
  status,
  icon,
  statusColor,
  details,
  trend,
  trendValue,
}: SystemStatusCardProps) {
  return (
    <TooltipProvider>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2 text-muted-foreground">
              {icon}
              <span className="text-sm font-medium">{title}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`h-3 w-3 rounded-full ${statusColor} cursor-help`} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{details || `Status: ${status}`}</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-2xl font-bold">{status}</span>
            </div>
            {trend && (
              <div className="flex items-center text-xs text-muted-foreground">
                {trend === "up" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 text-green-500 mr-1"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {trend === "down" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 text-red-500 mr-1"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {trend === "stable" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 text-blue-500 mr-1"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
