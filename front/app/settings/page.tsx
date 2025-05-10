"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, RotateCcw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    autoBlock: true,
    sensitivity: 75,
    confidenceThreshold: 80,
    aiModel: "gpt-4o",
    signatureUpdates: true,
    updateFrequency: "daily",
    customSignatures: true,
    realTimeMonitoring: true,
    locations: {
      documents: true,
      desktop: true,
      downloads: true,
      pictures: true,
      system: false,
    },
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSaveChanges = () => {
    setIsSaving(true)

    // Simulate API call to save settings
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully.",
      })
    }, 1000)
  }

  const handleResetDefaults = () => {
    setSettings({
      autoBlock: true,
      sensitivity: 75,
      confidenceThreshold: 80,
      aiModel: "gpt-4o",
      signatureUpdates: true,
      updateFrequency: "daily",
      customSignatures: true,
      realTimeMonitoring: true,
      locations: {
        documents: true,
        desktop: true,
        downloads: true,
        pictures: true,
        system: false,
      },
    })

    toast({
      title: "Settings reset",
      description: "Your settings have been reset to default values.",
    })
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleResetDefaults}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button size="sm" onClick={handleSaveChanges} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="detection">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="detection">Detection</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="detection" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Detection Settings</CardTitle>
                <CardDescription>Configure how the AI detection engine analyzes file system behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-block">Automatic Blocking</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically block processes identified as ransomware
                      </p>
                    </div>
                    <Switch
                      id="auto-block"
                      checked={settings.autoBlock}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoBlock: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Detection Sensitivity</Label>
                    <Slider
                      value={[settings.sensitivity]}
                      max={100}
                      step={1}
                      onValueChange={(value) => setSettings({ ...settings, sensitivity: value[0] })}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low (Fewer False Positives)</span>
                      <span>High (Maximum Protection)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confidence-threshold">Confidence Threshold</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="confidence-threshold"
                        type="number"
                        value={settings.confidenceThreshold}
                        onChange={(e) =>
                          setSettings({ ...settings, confidenceThreshold: Number.parseInt(e.target.value) || 0 })
                        }
                        min={0}
                        max={100}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimum confidence level required for automatic blocking
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai-model">AI Model</Label>
                    <Select
                      value={settings.aiModel}
                      onValueChange={(value) => setSettings({ ...settings, aiModel: value })}
                    >
                      <SelectTrigger id="ai-model">
                        <SelectValue placeholder="Select AI Model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="custom">Custom Model</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ransomware Signatures</CardTitle>
                <CardDescription>Configure known ransomware patterns and behaviors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="signature-updates">Automatic Signature Updates</Label>
                      <p className="text-sm text-muted-foreground">Automatically update ransomware signatures</p>
                    </div>
                    <Switch
                      id="signature-updates"
                      checked={settings.signatureUpdates}
                      onCheckedChange={(checked) => setSettings({ ...settings, signatureUpdates: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="update-frequency">Update Frequency</Label>
                    <Select
                      value={settings.updateFrequency}
                      onValueChange={(value) => setSettings({ ...settings, updateFrequency: value })}
                    >
                      <SelectTrigger id="update-frequency">
                        <SelectValue placeholder="Select Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="custom-signatures">Custom Signatures</Label>
                      <p className="text-sm text-muted-foreground">Enable custom-defined ransomware signatures</p>
                    </div>
                    <Switch
                      id="custom-signatures"
                      checked={settings.customSignatures}
                      onCheckedChange={(checked) => setSettings({ ...settings, customSignatures: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>File System Monitoring</CardTitle>
                <CardDescription>Configure how the system monitors file activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="real-time-monitoring">Real-time Monitoring</Label>
                      <p className="text-sm text-muted-foreground">Monitor file system activities in real-time</p>
                    </div>
                    <Switch
                      id="real-time-monitoring"
                      checked={settings.realTimeMonitoring}
                      onCheckedChange={(checked) => setSettings({ ...settings, realTimeMonitoring: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Monitored Locations</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="location-documents"
                          checked={settings.locations.documents}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              locations: { ...settings.locations, documents: !!checked },
                            })
                          }
                        />
                        <label htmlFor="location-documents" className="text-sm">
                          Documents
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="location-desktop"
                          checked={settings.locations.desktop}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              locations: { ...settings.locations, desktop: !!checked },
                            })
                          }
                        />
                        <label htmlFor="location-desktop" className="text-sm">
                          Desktop
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="location-downloads"
                          checked={settings.locations.downloads}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              locations: { ...settings.locations, downloads: !!checked },
                            })
                          }
                        />
                        <label htmlFor="location-downloads" className="text-sm">
                          Downloads
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="location-pictures"
                          checked={settings.locations.pictures}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              locations: { ...settings.locations, pictures: !!checked },
                            })
                          }
                        />
                        <label htmlFor="location-pictures" className="text-sm">
                          Pictures
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="location-system"
                          checked={settings.locations.system}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              locations: { ...settings.locations, system: !!checked },
                            })
                          }
                        />
                        <label htmlFor="location-system" className="text-sm">
                          System Folders
                        </label>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      Add Custom Location
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs content would go here */}
          <TabsContent value="notifications" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure how you receive alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Notification settings will be available in the next update.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Configure advanced system settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Advanced settings will be available in the next update.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
