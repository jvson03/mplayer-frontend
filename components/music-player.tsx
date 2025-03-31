"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Heart,
  MoreHorizontal,
  Search,
  FolderOpen,
} from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "./theme-toggle"
import { useTheme } from "next-themes"

// Sample music data as fallback
const sampleMusicLibrary = [
  {
    id: 1,
    title: "Midnight City",
    artist: "M83",
    album: "Hurry Up, We're Dreaming",
    duration: "4:03",
    cover: "/placeholder.svg?height=300&width=300",
    audio: "#",
    filePath: "",
  },
  {
    id: 2,
    title: "Redbone",
    artist: "Childish Gambino",
    album: "Awaken, My Love!",
    duration: "5:27",
    cover: "/placeholder.svg?height=300&width=300",
    audio: "#",
    filePath: "",
  },
  {
    id: 3,
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    duration: "3:20",
    cover: "/placeholder.svg?height=300&width=300",
    audio: "#",
    filePath: "",
  },
]

// Type for our track
interface Track {
  id: number
  title: string
  artist: string
  album: string
  duration: string
  cover: string
  audio: string
  filePath: string
}

export default function MusicPlayer() {
  const [musicLibrary, setMusicLibrary] = useState<Track[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [favorites, setFavorites] = useState<number[]>([])
  const [folderPath, setFolderPath] = useState<string>("")
  const [isImporting, setIsImporting] = useState(false)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Avoid hydration mismatch by only rendering theme-dependent UI after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Initialize audio element
    if (!audioRef.current) {
      audioRef.current = new Audio()
    }

    // Set up event listeners
    const audio = audioRef.current

    const updateTime = () => {
      setCurrentTime(audio.currentTime)
    }

    const updateDuration = () => {
      setDuration(audio.duration || 0)
    }

    const handleEnd = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      // Auto play next track logic could go here
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", handleEnd)

    // Set initial track if none is set
    if (!currentTrack && musicLibrary.length > 0) {
      setCurrentTrack(musicLibrary[0])
    }

    // Clean up
    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleEnd)
    }
  }, [musicLibrary, currentTrack])

  useEffect(() => {
    // Update audio source when current track changes
    if (audioRef.current && currentTrack) {
      if (currentTrack.filePath) {
        // For imported files, use the file path
        audioRef.current.src = currentTrack.filePath
      } else {
        // For sample tracks, use the audio URL
        audioRef.current.src = currentTrack.audio
      }
      audioRef.current.load()
      if (isPlaying) {
        audioRef.current.play().catch((e) => console.error("Playback failed:", e))
      }
    }
  }, [currentTrack, isPlaying])

  useEffect(() => {
    // Handle play/pause state changes
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((e) => console.error("Playback failed:", e))
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying])

  useEffect(() => {
    // Handle volume changes
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
      audioRef.current.muted = isMuted
    }
  }, [volume, isMuted])

  const togglePlay = () => {
    if (!currentTrack) return
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleTrackSelect = (track: Track) => {
    setCurrentTrack(track)
    setIsPlaying(true)
  }

  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    setIsMuted(value[0] === 0)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const toggleFavorite = (id: number) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((favId) => favId !== id))
    } else {
      setFavorites([...favorites, id])
    }
  }

  const filteredTracks = musicLibrary.filter(
    (track) =>
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.album.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const favoriteTracks = musicLibrary.filter((track) => favorites.includes(track.id))

  // Function to handle folder selection
  const handleFolderSelect = async () => {
    try {
      // Check if the File System Access API is supported
      if ("showDirectoryPicker" in window) {
        setIsImporting(true)
        // @ts-ignore - TypeScript doesn't have types for this API yet
        const directoryHandle = await window.showDirectoryPicker()
        const files: File[] = []

        // Get folder path
        setFolderPath(directoryHandle.name)

        // Recursive function to get all files from directory
        async function getFilesRecursively(dirHandle: any, path = "") {
          for await (const entry of dirHandle.values()) {
            if (entry.kind === "file") {
              const file = await entry.getFile()
              if (file.type.startsWith("audio/")) {
                // Add path information to the file
                Object.defineProperty(file, "path", {
                  value: path ? `${path}/${file.name}` : file.name,
                  writable: false,
                })
                files.push(file)
              }
            } else if (entry.kind === "directory") {
              // Recursively get files from subdirectories
              await getFilesRecursively(entry, path ? `${path}/${entry.name}` : entry.name)
            }
          }
        }

        await getFilesRecursively(directoryHandle)

        // Process the files
        await processAudioFiles(files)
      } else {
        // Fallback for browsers that don't support the File System Access API
        if (fileInputRef.current) {
          fileInputRef.current.click()
        }
      }
    } catch (error) {
      console.error("Error selecting folder:", error)
      toast({
        title: "Error",
        description: "Failed to access the selected folder.",
        variant: "destructive",
      })
      setIsImporting(false)
    }
  }

  // Handle the fallback file input change
  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsImporting(true)

    // Get folder path from the first file
    const firstFile = files[0]
    const pathParts = firstFile.webkitRelativePath.split("/")
    setFolderPath(pathParts[0])

    // Convert FileList to array
    const fileArray = Array.from(files).filter((file) => file.type.startsWith("audio/"))

    // Process the files
    await processAudioFiles(fileArray)
  }

  // Process audio files to extract metadata
  const processAudioFiles = async (files: File[]) => {
    try {
      const newTracks: Track[] = []
      let idCounter = musicLibrary.length > 0 ? Math.max(...musicLibrary.map((track) => track.id)) + 1 : 1

      for (const file of files) {
        try {
          // Create object URL for the file
          const objectUrl = URL.createObjectURL(file)

          // Create temporary audio element to get duration
          const audio = new Audio()
          audio.src = objectUrl

          // Wait for metadata to load
          await new Promise<void>((resolve) => {
            audio.addEventListener("loadedmetadata", () => {
              resolve()
            })

            // Handle error
            audio.addEventListener("error", () => {
              console.error(`Error loading metadata for ${file.name}`)
              resolve()
            })
          })

          // Format duration
          const durationSeconds = audio.duration
          const minutes = Math.floor(durationSeconds / 60)
          const seconds = Math.floor(durationSeconds % 60)
          const formattedDuration = `${minutes}:${seconds.toString().padStart(2, "0")}`

          // Extract file name without extension as title
          const fileName = file.name
          const title = fileName.substring(0, fileName.lastIndexOf(".")) || fileName

          // Create track object
          const track: Track = {
            id: idCounter++,
            title: title,
            artist: "Unknown Artist", // We could use ID3 tags here with a library
            album: "Unknown Album",
            duration: formattedDuration,
            cover: "/placeholder.svg?height=300&width=300", // Default cover
            audio: "#", // Not used for imported files
            filePath: objectUrl,
          }

          newTracks.push(track)
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error)
        }
      }

      // Update music library with new tracks
      if (newTracks.length > 0) {
        setMusicLibrary((prevLibrary) => [...prevLibrary, ...newTracks])
        toast({
          title: "Import Successful",
          description: `Imported ${newTracks.length} tracks from ${folderPath}`,
        })
      } else {
        toast({
          title: "No Tracks Found",
          description: "No audio files were found in the selected folder.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error processing audio files:", error)
      toast({
        title: "Error",
        description: "Failed to process audio files.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  // If not mounted yet, render a simple loading state to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex flex-col md:flex-row gap-6 bg-white/50 border-gray-200 backdrop-blur-lg rounded-xl overflow-hidden border shadow-xl">
        <div className="w-full md:w-1/3 p-6 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50/50 to-blue-50/50">
          <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg"></div>
        </div>
        <div className="w-full md:w-2/3 bg-gray-50/80 backdrop-blur-lg">
          <div className="p-4 border-b border-gray-200 flex items-center gap-2">
            <div className="relative flex-1">
              <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
            </div>
          </div>
          <div className="h-[500px] p-4">
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Determine if we're in dark mode
  const isDarkMode = theme === "dark"

  return (
    <div
      className={`flex flex-col md:flex-row gap-6 ${isDarkMode ? "bg-zinc-800/50 border-zinc-700" : "bg-white/50 border-gray-200"} backdrop-blur-lg rounded-xl overflow-hidden border shadow-xl`}
    >
      {/* Hidden file input for fallback */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        style={{ display: "none" }}
        multiple
      />

      {/* Album Art and Player Controls */}
      <div
        className={`w-full md:w-1/3 p-6 flex flex-col items-center justify-center ${isDarkMode ? "bg-gradient-to-br from-purple-900/20 to-blue-900/20" : "bg-gradient-to-br from-indigo-50/50 to-blue-50/50"}`}
      >
        <div className="relative group w-full max-w-[300px] aspect-square mb-6 rounded-lg overflow-hidden shadow-2xl">
          {currentTrack ? (
            <img
              src={currentTrack.cover || "/placeholder.svg?height=300&width=300"}
              alt={`${currentTrack.album} cover`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div
              className={`w-full h-full ${isDarkMode ? "bg-zinc-900" : "bg-gray-100"} flex items-center justify-center`}
            >
              <p className={isDarkMode ? "text-zinc-500" : "text-gray-400"}>No track selected</p>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 hover:scale-110 transition-all"
              onClick={togglePlay}
              disabled={!currentTrack}
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
            </Button>
          </div>
        </div>

        <div className="w-full text-center mb-6">
          <h2 className={`text-2xl font-bold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {currentTrack?.title || "No Track Selected"}
          </h2>
          <p className={isDarkMode ? "text-zinc-400" : "text-gray-600"}>{currentTrack?.artist || "—"}</p>
          <p className={`${isDarkMode ? "text-zinc-500" : "text-gray-500"} text-sm`}>{currentTrack?.album || "—"}</p>
        </div>

        <div className="w-full space-y-4">
          <div className="flex items-center gap-2">
            <span className={`text-xs ${isDarkMode ? "text-zinc-500" : "text-gray-500"}`}>
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="flex-1"
              disabled={!currentTrack}
            />
            <span className={`text-xs ${isDarkMode ? "text-zinc-500" : "text-gray-500"}`}>{formatTime(duration)}</span>
          </div>

          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="icon"
              className={isDarkMode ? "text-zinc-400 hover:text-white" : "text-gray-500 hover:text-gray-700"}
              disabled={!currentTrack}
            >
              <Shuffle size={20} />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={isDarkMode ? "text-zinc-400 hover:text-white" : "text-gray-500 hover:text-gray-700"}
                disabled={!currentTrack}
              >
                <SkipBack size={24} />
              </Button>
              <Button
                variant="default"
                size="icon"
                className={`h-12 w-12 rounded-full ${
                  isDarkMode
                    ? "bg-white text-black hover:bg-white/90 disabled:bg-zinc-700 disabled:text-zinc-400"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500"
                }`}
                onClick={togglePlay}
                disabled={!currentTrack}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={isDarkMode ? "text-zinc-400 hover:text-white" : "text-gray-500 hover:text-gray-700"}
                disabled={!currentTrack}
              >
                <SkipForward size={24} />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={isDarkMode ? "text-zinc-400 hover:text-white" : "text-gray-500 hover:text-gray-700"}
              disabled={!currentTrack}
            >
              <Repeat size={20} />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className={isDarkMode ? "text-zinc-400 hover:text-white" : "text-gray-500 hover:text-gray-700"}
              disabled={!currentTrack}
            >
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </Button>
            <Slider
              value={[volume]}
              max={100}
              onValueChange={handleVolumeChange}
              className="flex-1"
              disabled={!currentTrack}
            />
          </div>
        </div>
      </div>

      {/* Library/Playlist */}
      <div className={`w-full md:w-2/3 ${isDarkMode ? "bg-zinc-900/50" : "bg-gray-50/80"} backdrop-blur-lg`}>
        <div className={`p-4 border-b ${isDarkMode ? "border-zinc-700" : "border-gray-200"} flex items-center gap-2`}>
          <div className="relative flex-1">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}
              size={18}
            />
            <Input
              placeholder="Search music..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 ${
                isDarkMode
                  ? "bg-zinc-800 border-zinc-700 focus-visible:ring-purple-500"
                  : "bg-white border-gray-200 focus-visible:ring-indigo-500"
              }`}
            />
          </div>

          <ThemeToggle />

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className={`gap-2 ${
                  isDarkMode
                    ? "bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
                    : "bg-white hover:bg-gray-100 text-gray-800 border-gray-200"
                }`}
              >
                <FolderOpen size={16} />
                <span className="hidden sm:inline">Import Music</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Import Music</DialogTitle>
                <DialogDescription>Select a folder containing your music files.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="folder">Music Folder</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="folder"
                      value={folderPath}
                      readOnly
                      placeholder="No folder selected"
                      className="flex-1"
                    />
                    <Button onClick={handleFolderSelect} disabled={isImporting} variant="outline">
                      {isImporting ? "Importing..." : "Browse"}
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="w-full">
                  {folderPath ? `${musicLibrary.length} tracks in library` : "Select a folder to import music"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="px-4 pt-4">
            <TabsList className={`w-full ${isDarkMode ? "bg-zinc-800/50" : "bg-white/50"}`}>
              <TabsTrigger value="all" className="flex-1">
                All Tracks
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex-1">
                Favorites
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            <ScrollArea className="h-[500px] px-4">
              <div className="space-y-1 py-4">
                {filteredTracks.length > 0 ? (
                  filteredTracks.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => handleTrackSelect(track)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        currentTrack?.id === track.id
                          ? isDarkMode
                            ? "bg-purple-500/20 text-white"
                            : "bg-indigo-100/70 text-indigo-900"
                          : isDarkMode
                            ? "hover:bg-zinc-800/80 text-zinc-300"
                            : "hover:bg-gray-100/80 text-gray-700"
                      }`}
                    >
                      <img
                        src={track.cover || "/placeholder.svg?height=300&width=300"}
                        alt={track.album}
                        className="h-12 w-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{track.title}</div>
                        <div className={`text-sm ${isDarkMode ? "text-zinc-400" : "text-gray-500"} truncate`}>
                          {track.artist}
                        </div>
                      </div>
                      <div className={`text-sm ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
                        {track.duration}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={isDarkMode ? "text-zinc-400 hover:text-white" : "text-gray-400 hover:text-gray-700"}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(track.id)
                        }}
                      >
                        <Heart size={18} className={favorites.includes(track.id) ? "fill-red-500 text-red-500" : ""} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={isDarkMode ? "text-zinc-400 hover:text-white" : "text-gray-400 hover:text-gray-700"}
                      >
                        <MoreHorizontal size={18} />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div
                    className={`flex flex-col items-center justify-center py-12 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}
                  >
                    <FolderOpen size={48} className="mb-4" />
                    <p>No tracks found</p>
                    <p className="text-sm">Import music or try a different search</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="favorites" className="mt-0">
            <ScrollArea className="h-[500px] px-4">
              <div className="space-y-1 py-4">
                {favoriteTracks.length > 0 ? (
                  favoriteTracks.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => handleTrackSelect(track)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        currentTrack?.id === track.id
                          ? isDarkMode
                            ? "bg-purple-500/20 text-white"
                            : "bg-indigo-100/70 text-indigo-900"
                          : isDarkMode
                            ? "hover:bg-zinc-800/80 text-zinc-300"
                            : "hover:bg-gray-100/80 text-gray-700"
                      }`}
                    >
                      <img
                        src={track.cover || "/placeholder.svg?height=300&width=300"}
                        alt={track.album}
                        className="h-12 w-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{track.title}</div>
                        <div className={`text-sm ${isDarkMode ? "text-zinc-400" : "text-gray-500"} truncate`}>
                          {track.artist}
                        </div>
                      </div>
                      <div className={`text-sm ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}>
                        {track.duration}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={isDarkMode ? "text-zinc-400 hover:text-white" : "text-gray-400 hover:text-gray-700"}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(track.id)
                        }}
                      >
                        <Heart size={18} className="fill-red-500 text-red-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={isDarkMode ? "text-zinc-400 hover:text-white" : "text-gray-400 hover:text-gray-700"}
                      >
                        <MoreHorizontal size={18} />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div
                    className={`flex flex-col items-center justify-center py-12 ${isDarkMode ? "text-zinc-500" : "text-gray-400"}`}
                  >
                    <Heart size={48} className="mb-4" />
                    <p>No favorite tracks yet</p>
                    <p className="text-sm">Click the heart icon to add tracks to your favorites</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}