"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Settings ⚙️</h1>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Full Name" />
          <Input placeholder="Email Address" />
          <Input placeholder="Company Name" />
          <Button className="bg-indigo-600 text-white">Save Changes</Button>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Default Currency" />
          <Input placeholder="Time Zone" />
          <Button className="bg-purple-600 text-white">Update Preferences</Button>
        </CardContent>
      </Card>
    </div>
  )
}
