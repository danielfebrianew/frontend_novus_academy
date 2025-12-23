"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import toast, { Toaster } from "react-hot-toast"
import {
  CalendarClock,
  CheckCircle2,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Video,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { apiService } from "@/lib/axios"

// --- TIPE DATA ---
interface SchedulerItem {
  id: number
  scheduledTime: string
  username: string
  videoUrl: string
  content: string
  productId: string
  statusPost: string
  createdAt: string
  updatedAt: string
}

interface NewScheduleForm {
  username: string
  videoUrl: string
  content: string
  productId: string
  scheduledTime: string
}

export default function SchedulerPage() {
  // Kita pisah state datanya biar ga flicker pas ganti tab
  const [pendingData, setPendingData] = useState<SchedulerItem[]>([])
  const [doneData, setDoneData] = useState<SchedulerItem[]>([])
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending") // State untuk tab aktif

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  const [formData, setFormData] = useState<NewScheduleForm>({
    username: "",
    videoUrl: "",
    content: "",
    productId: "",
    scheduledTime: "",
  })

  // --- FETCH DATA (BISA DIPANGGIL SESUAI TAB) ---
  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await apiService.get<any>("/api/v1/scheduler/pending")
      setPendingData(res.data)
    } catch (error) {
      console.error(error)
      toast.error("Gagal memuat antrian.")
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await apiService.get<any>("/api/v1/scheduler/done")
      setDoneData(res.data)
    } catch (error) {
      console.error(error)
      toast.error("Gagal memuat riwayat.")
    } finally {
      setLoading(false)
    }
  }

  // Load awal (default pending)
  useEffect(() => {
    fetchPending()
  }, [])

  // Efek saat ganti tab
  useEffect(() => {
    if (activeTab === "pending") {
      fetchPending()
    } else {
      fetchHistory()
    }
  }, [activeTab])

  // --- ACTIONS ---
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)
    try {
      const isoDate = new Date(formData.scheduledTime).toISOString()
      const payload = { ...formData, scheduledTime: isoDate, statusPost: "PENDING" }
      
      await apiService.post("/api/v1/scheduler", payload)
      
      toast.success("Jadwal dibuat!")
      setIsDialogOpen(false)
      setFormData({ username: "", videoUrl: "", content: "", productId: "", scheduledTime: "" })
      fetchPending() // Refresh list pending
    } catch (error) {
      toast.error("Gagal menyimpan.")
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    const promise = apiService.patch(`/api/v1/scheduler/${id}/status`, { status: newStatus })
    toast.promise(promise, {
      loading: 'Mengupdate status...',
      success: () => {
        fetchPending() // Refresh pending biar itemnya hilang/pindah
        return `Status diubah jadi ${newStatus}`
      },
      error: 'Gagal update status',
    })
  }

  // Helper render tabel biar ga duplikat codingan
  const renderTable = (data: SchedulerItem[], isHistory: boolean) => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          {isHistory ? "Belum ada postingan selesai." : "Tidak ada antrian pending."}
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Waktu Tayang</TableHead>
            <TableHead>Akun</TableHead>
            <TableHead className="max-w-[300px]">Konten</TableHead>
            <TableHead>Status</TableHead>
            {/* Kolom Aksi beda antara Pending & History */}
            <TableHead className="text-right">{isHistory ? "Video" : "Aksi"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{format(new Date(item.scheduledTime), "dd MMM yyyy", { locale: idLocale })}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(item.scheduledTime), "HH:mm", { locale: idLocale })} WIB
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{item.username}</div>
                <div className="text-xs text-muted-foreground">{item.productId}</div>
              </TableCell>
              <TableCell className="truncate max-w-[250px]" title={item.content}>
                {item.content}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={isHistory ? "default" : "outline"}
                  className={isHistory ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}
                >
                  {item.statusPost}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {isHistory ? (
                  // Tampilan untuk HISTORY (Link Video)
                  <a 
                    href={item.videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs justify-end"
                  >
                    <Video className="w-3 h-3" /> Lihat
                  </a>
                ) : (
                  // Tampilan untuk PENDING (Tombol Aksi)
                  <div className="flex justify-end gap-2">
                    <Button 
                      size="icon" variant="ghost" 
                      className="h-8 w-8 text-green-600 hover:bg-green-100"
                      onClick={() => handleUpdateStatus(item.id, "DONE")}
                      title="Selesai Manual"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" variant="ghost" 
                      className="h-8 w-8 text-red-600 hover:bg-red-100"
                      onClick={() => handleUpdateStatus(item.id, "CANCELLED")}
                      title="Batalkan"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="p-6 space-y-6 relative min-h-screen pb-20">
      <Toaster position="top-right" />

      {/* HEADER & CREATE BUTTON */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Post Scheduler</h1>
          <p className="text-muted-foreground">Manage postingan otomatis TikTok & Video.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Buat Jadwal Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Jadwal Postingan Baru</DialogTitle>
              <DialogDescription>Isi detail konten video yang akan dijadwalkan.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
               {/* ... Form Input Sama Seperti Sebelumnya ... */}
               {/* Agar kode tidak kepanjangan, copy bagian Input Form dari kode sebelumnya kesini */}
               <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
               </div>
               <div className="space-y-2">
                  <Label>Product ID</Label>
                  <Input value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})} required />
               </div>
               <div className="space-y-2">
                  <Label>Waktu</Label>
                  <Input type="datetime-local" value={formData.scheduledTime} onChange={e => setFormData({...formData, scheduledTime: e.target.value})} required />
               </div>
               <div className="space-y-2">
                  <Label>Video URL</Label>
                  <Input value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} required />
               </div>
               <div className="space-y-2">
                  <Label>Caption</Label>
                  <Textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required />
               </div>
               
               <DialogFooter>
                <Button type="submit" disabled={submitLoading}>
                  {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* TABS UTAMA */}
      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="pending">Antrian (Pending)</TabsTrigger>
            <TabsTrigger value="history">Riwayat (Done)</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm" onClick={activeTab === 'pending' ? fetchPending : fetchHistory}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* TAB CONTENT: PENDING */}
        <TabsContent value="pending" className="space-y-4">
            {/* STATS PENDING */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Posts</CardTitle>
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{pendingData.length}</div>
                    <p className="text-xs text-muted-foreground">Menunggu antrian</p>
                </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Antrian Pending</CardTitle>
                    <CardDescription>Postingan yang akan diproses oleh bot.</CardDescription>
                </CardHeader>
                <CardContent>
                    {renderTable(pendingData, false)}
                </CardContent>
            </Card>
        </TabsContent>

        {/* TAB CONTENT: HISTORY */}
        <TabsContent value="history" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Selesai</CardTitle>
                    <History className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{doneData.length}</div>
                    <p className="text-xs text-muted-foreground">Berhasil diposting</p>
                </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Log Riwayat</CardTitle>
                    <CardDescription>Arsip postingan yang sudah selesai.</CardDescription>
                </CardHeader>
                <CardContent>
                    {renderTable(doneData, true)}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}