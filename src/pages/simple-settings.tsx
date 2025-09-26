import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Mail,
  Smartphone,
  Globe,
  DollarSign,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react"
import { useState } from "react"

export function SimpleSettings() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    lowStock: true,
    orders: true,
    payments: false
  })

  const handleNotificationToggle = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your business preferences and app configuration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Business Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Business Profile
            </CardTitle>
            <CardDescription>
              Update your business information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Name</label>
              <Input defaultValue="Toko Kue Bismillah" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Owner Name</label>
              <Input defaultValue="Ibu Siti" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input defaultValue="081234567890" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input defaultValue="bismillahbakery@gmail.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input defaultValue="Jl. Mawar No. 123, Jakarta Selatan" />
            </div>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              App Preferences
            </CardTitle>
            <CardDescription>
              Customize your app experience and interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Theme</label>
                <p className="text-xs text-muted-foreground">Choose your preferred theme</p>
              </div>
              <Select defaultValue="system">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Language</label>
                <p className="text-xs text-muted-foreground">Select your preferred language</p>
              </div>
              <Select defaultValue="id">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">Indonesia</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Currency</label>
                <p className="text-xs text-muted-foreground">Default currency for pricing</p>
              </div>
              <Select defaultValue="idr">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idr">IDR (Rp)</SelectItem>
                  <SelectItem value="usd">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Auto-Save</label>
                <p className="text-xs text-muted-foreground">Automatically save changes</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Notification Channels</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Email Notifications</span>
                  </div>
                  <Switch 
                    checked={notifications.email}
                    onCheckedChange={() => handleNotificationToggle('email')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Push Notifications</span>
                  </div>
                  <Switch 
                    checked={notifications.push}
                    onCheckedChange={() => handleNotificationToggle('push')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">SMS Notifications</span>
                  </div>
                  <Switch 
                    checked={notifications.sms}
                    onCheckedChange={() => handleNotificationToggle('sms')}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Notification Types</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Low Stock Alerts</span>
                  <Switch 
                    checked={notifications.lowStock}
                    onCheckedChange={() => handleNotificationToggle('lowStock')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">New Orders</span>
                  <Switch 
                    checked={notifications.orders}
                    onCheckedChange={() => handleNotificationToggle('orders')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Payment Reminders</span>
                  <Switch 
                    checked={notifications.payments}
                    onCheckedChange={() => handleNotificationToggle('payments')}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Privacy
            </CardTitle>
            <CardDescription>
              Manage your account security and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Password</label>
              <Input type="password" placeholder="Enter current password" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input type="password" placeholder="Enter new password" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <Input type="password" placeholder="Confirm new password" />
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm">Enable 2FA</p>
                  <p className="text-xs text-muted-foreground">Add extra security to your account</p>
                </div>
                <Switch />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <div className="flex gap-2">
                <Input 
                  type={showApiKey ? "text" : "password"}
                  defaultValue="sk_live_xxxxxxxxxxxxxxxxxxxx"
                  readOnly
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>
              Backup, export, and manage your business data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Data Backup</h4>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm">Auto Backup</p>
                  <p className="text-xs text-muted-foreground">Daily automatic backups</p>
                </div>
                <Switch defaultChecked />
              </div>
              <p className="text-xs text-muted-foreground">
                Last backup: Today at 03:00 AM
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Data Export</h4>
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data (JSON)
                </Button>
                <Button variant="outline" className="justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Financial Reports (Excel)
                </Button>
                <Button variant="outline" className="justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Inventory Data (CSV)
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Data Import</h4>
              <Button variant="outline" className="w-full justify-start">
                <Upload className="h-4 w-4 mr-2" />
                Import Data from File
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-red-600">Danger Zone</h4>
              <Button variant="destructive" className="w-full justify-start">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Data
              </Button>
              <p className="text-xs text-muted-foreground">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            System Information
          </CardTitle>
          <CardDescription>
            App version and system status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">App Version</p>
              <p className="text-xs text-muted-foreground">v2.1.0</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Database Status</p>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                Connected
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Last Sync</p>
              <p className="text-xs text-muted-foreground">2 minutes ago</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Storage Used</p>
              <p className="text-xs text-muted-foreground">2.4 GB / 10 GB</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}