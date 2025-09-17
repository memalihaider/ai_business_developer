export interface UserPreferences {
  id: string
  userId: string
  theme: 'light' | 'dark' | 'system'
  currency: string
  timezone: string
  notifications: boolean
  emailTracking: boolean
  language: string
  createdAt: string
  updatedAt: string
}

export interface PreferencesUpdateData {
  theme?: 'light' | 'dark' | 'system'
  currency?: string
  timezone?: string
  notifications?: boolean
  emailTracking?: boolean
  language?: string
}

// Get user preferences
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  try {
    const response = await fetch(`/api/preferences?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch preferences')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    throw error
  }
}

// Update user preferences
export async function updateUserPreferences(
  userId: string,
  preferences: PreferencesUpdateData
): Promise<UserPreferences> {
  try {
    const response = await fetch('/api/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        ...preferences,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to update preferences')
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating user preferences:', error)
    throw error
  }
}

// Create user preferences
export async function createUserPreferences(
  userId: string,
  preferences: Partial<PreferencesUpdateData> = {}
): Promise<UserPreferences> {
  try {
    const response = await fetch('/api/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        ...preferences,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create preferences')
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating user preferences:', error)
    throw error
  }
}

// Save preferences to localStorage as backup
export function savePreferencesToLocalStorage(preferences: UserPreferences) {
  try {
    localStorage.setItem('userPreferences', JSON.stringify(preferences))
  } catch (error) {
    console.error('Error saving preferences to localStorage:', error)
  }
}

// Load preferences from localStorage
export function loadPreferencesFromLocalStorage(): UserPreferences | null {
  try {
    const stored = localStorage.getItem('userPreferences')
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error('Error loading preferences from localStorage:', error)
    return null
  }
}

// Clear preferences from localStorage
export function clearPreferencesFromLocalStorage() {
  try {
    localStorage.removeItem('userPreferences')
  } catch (error) {
    console.error('Error clearing preferences from localStorage:', error)
  }
}