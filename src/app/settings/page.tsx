"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    company: "",
  })

  const [preferences, setPreferences] = useState({
    currency: "USD",
    timezone: "GMT+5 (PKT)",
    darkMode: false,
    notifications: true,
  })

  const [notes, setNotes] = useState("")
  const [savedNotes, setSavedNotes] = useState("")

  const handleProfileChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value })
  }

  const handlePreferencesChange = (field: string, value: string | boolean) => {
    setPreferences({ ...preferences, [field]: value })
  }

  const saveNotes = () => setSavedNotes(notes)

  return (
    <div className="p-8 bg-gradient-to-br from-[#f7f7f5] to-[#eaeae7] min-h-screen space-y-10">
      {/* Page Title */}
      <h1 className="text-4xl font-extrabold text-center">
        <span className="text-gray-900">Settings </span>
        <span className="bg-gradient-to-r from-[#7A8063] to-[#4A503D] bg-clip-text text-transparent">
          ⚙️
        </span>
      </h1>

      {/* Settings in Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <Card className="shadow-md border border-gray-200 hover:shadow-xl transition rounded-xl">
          <CardHeader className="bg-gradient-to-r from-[#7A8063] to-[#4A503D] text-white rounded-t-xl py-3">
            <CardTitle className="text-base">User Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <Input
              size={10}
              placeholder="Full Name"
              value={profile.fullName}
              onChange={(e) => handleProfileChange("fullName", e.target.value)}
            />
            <Input
              placeholder="Email Address"
              value={profile.email}
              onChange={(e) => handleProfileChange("email", e.target.value)}
            />
            <Input
              placeholder="Company Name"
              value={profile.company}
              onChange={(e) => handleProfileChange("company", e.target.value)}
            />
            <Button
              className="bg-[#7A8063] hover:bg-[#4A503D] text-white w-full text-sm rounded-lg transition"
              onClick={() => alert("Profile Updated ✅")}
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="shadow-md border border-gray-200 hover:shadow-xl transition rounded-xl">
          <CardHeader className="bg-gradient-to-r from-[#7A8063] to-[#4A503D] text-white rounded-t-xl py-3">
            <CardTitle className="text-base">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <Input
              placeholder="Default Currency"
              value={preferences.currency}
              onChange={(e) => handlePreferencesChange("currency", e.target.value)}
            />
            <Input
              placeholder="Time Zone"
              value={preferences.timezone}
              onChange={(e) => handlePreferencesChange("timezone", e.target.value)}
            />

            {/* Switches */}
            <div className="flex items-center justify-between">
              <Label className="text-sm">Dark Mode</Label>
              <Switch
                checked={preferences.darkMode}
                onCheckedChange={(checked: boolean) =>
                  handlePreferencesChange("darkMode", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Enable Notifications</Label>
              <Switch
                checked={preferences.notifications}
                onCheckedChange={(checked: boolean) =>
                  handlePreferencesChange("notifications", checked)
                }
              />
            </div>

            <Button
              className="bg-[#7A8063] hover:bg-[#4A503D] text-white w-full text-sm rounded-lg transition"
              onClick={() => alert("Preferences Updated ✅")}
            >
              Update Preferences
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Working + Display Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Working Area */}
        <Card className="shadow-md border border-gray-200 hover:shadow-xl transition rounded-xl">
          <CardHeader className="bg-gradient-to-r from-[#7A8063] to-[#4A503D] text-white rounded-t-xl py-3">
            <CardTitle className="text-base">Working Area</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Textarea
              placeholder="Write notes, tasks, or ideas..."
              className="min-h-[100px] text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button
              className="bg-[#7A8063] hover:bg-[#4A503D] text-white w-full text-sm rounded-lg transition"
              onClick={saveNotes}
            >
              Save Notes
            </Button>
          </CardContent>
        </Card>

        {/* Display Area */}
        <Card className="shadow-md border border-gray-200 hover:shadow-xl transition rounded-xl">
          <CardHeader className="bg-gradient-to-r from-[#7A8063] to-[#4A503D] text-white rounded-t-xl py-3">
            <CardTitle className="text-base">Display Area</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4 text-sm text-gray-700">
            <p><strong>Name:</strong> {profile.fullName || "Not Set"}</p>
            <p><strong>Email:</strong> {profile.email || "Not Set"}</p>
            <p><strong>Company:</strong> {profile.company || "Not Set"}</p>
            <p><strong>Currency:</strong> {preferences.currency}</p>
            <p><strong>Timezone:</strong> {preferences.timezone}</p>
            <p><strong>Dark Mode:</strong> {preferences.darkMode ? "Enabled 🌙" : "Disabled ☀️"}</p>
            <p><strong>Notifications:</strong> {preferences.notifications ? "On 🔔" : "Off 🔕"}</p>
            {savedNotes && (
              <div className="mt-3 p-3 border rounded-lg bg-gray-50">
                <strong>Notes:</strong>
                <p>{savedNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
