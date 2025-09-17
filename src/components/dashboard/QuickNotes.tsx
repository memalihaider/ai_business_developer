"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  StickyNote, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X,
  Clock,
  Pin,
  PinOff
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Note {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  isPinned: boolean
  color: string
}

const NOTE_COLORS = [
  'bg-yellow-100 border-yellow-300 text-yellow-900',
  'bg-blue-100 border-blue-300 text-blue-900',
  'bg-green-100 border-green-300 text-green-900',
  'bg-purple-100 border-purple-300 text-purple-900',
  'bg-pink-100 border-pink-300 text-pink-900',
  'bg-orange-100 border-orange-300 text-orange-900'
]

export default function QuickNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)

  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('dashboard-quick-notes')
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt)
        }))
        setNotes(parsedNotes)
      } catch (error) {
        console.error('Error loading notes:', error)
      }
    }
  }, [])

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem('dashboard-quick-notes', JSON.stringify(notes))
  }, [notes])

  const addNote = () => {
    if (newNote.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        content: newNote.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isPinned: false,
        color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
      }
      setNotes(prev => [note, ...prev])
      setNewNote("")
      setIsAddingNote(false)
    }
  }

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id))
  }

  const startEditing = (note: Note) => {
    setEditingId(note.id)
    setEditContent(note.content)
  }

  const saveEdit = () => {
    if (editContent.trim() && editingId) {
      setNotes(prev => prev.map(note => 
        note.id === editingId 
          ? { ...note, content: editContent.trim(), updatedAt: new Date() }
          : note
      ))
      setEditingId(null)
      setEditContent("")
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent("")
  }

  const togglePin = (id: string) => {
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note, isPinned: !note.isPinned, updatedAt: new Date() }
        : note
    ))
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Sort notes: pinned first, then by creation date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  return (
    <Card className="p-6 border-[#7A8063]/30 dark:border-[#7A8063]/20 shadow-lg dark:shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-[#7A8063] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5" />
            Quick Notes
          </div>
          <Badge variant="outline" className="text-xs">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Note */}
        {isAddingNote ? (
          <div className="space-y-3 p-4 border-2 border-dashed border-[#7A8063]/30 rounded-lg bg-[#7A8063]/5">
            <Textarea 
              placeholder="Write your quick note..." 
              value={newNote} 
              onChange={(e) => setNewNote(e.target.value)}
              className="border-[#7A8063]/40 focus:border-[#7A8055] focus:ring-[#7A8055]/20 transition-all duration-300 min-h-[80px] resize-none" 
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                onClick={addNote}
                disabled={!newNote.trim()}
                size="sm"
                className="bg-gradient-to-r from-[#7A8063] to-[#5C6047] hover:from-[#7A8055] hover:to-[#4A4D3A] text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Note
              </Button>
              <Button
                onClick={() => {
                  setIsAddingNote(false)
                  setNewNote("")
                }}
                size="sm"
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setIsAddingNote(true)}
            variant="outline"
            className="w-full border-2 border-dashed border-[#7A8063]/40 hover:border-[#7A8063]/60 hover:bg-[#7A8063]/5 transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Quick Note
          </Button>
        )}

        {/* Notes List */}
        {sortedNotes.length > 0 ? (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {sortedNotes.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-md relative group",
                    note.color,
                    note.isPinned && "ring-2 ring-[#7A8063]/30"
                  )}
                >
                  {/* Pin indicator */}
                  {note.isPinned && (
                    <div className="absolute -top-2 -right-2 bg-[#7A8063] text-white rounded-full p-1">
                      <Pin className="w-3 h-3" />
                    </div>
                  )}

                  {editingId === note.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="bg-white/50 border-gray-300 focus:border-[#7A8055] focus:ring-[#7A8055]/20 min-h-[60px] resize-none"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button onClick={saveEdit} size="sm" className="bg-green-600 hover:bg-green-700">
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button onClick={cancelEdit} size="sm" variant="outline">
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3">
                        {note.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs opacity-70">
                          <Clock className="w-3 h-3" />
                          {formatTime(note.updatedAt)}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            onClick={() => togglePin(note.id)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-white/50"
                          >
                            {note.isPinned ? (
                              <PinOff className="w-3 h-3" />
                            ) : (
                              <Pin className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            onClick={() => startEditing(note)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-white/50"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() => deleteNote(note.id)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No notes yet</p>
            <p className="text-xs mt-1">Click "Add Quick Note" to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}