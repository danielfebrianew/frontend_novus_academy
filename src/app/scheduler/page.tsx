"use client"

import { useEffect, useState } from "react"
import Link from "next/link" 
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale" 

import toast, { Toaster } from "react-hot-toast"
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Video,
  XCircle,
  AlertCircle
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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

// ✅ Import fetch API service
import { apiService } from "@/lib/fetch"
import { AccountSelect } from "@/components/common/AccountSelect"

// --- REDUX INTEGRATION ---
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"

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
  videoUrl: string
  content: string
  productId: string
  scheduledTime: Date | undefined
}

export default function SchedulerPage() {
  // 1. Ambil selectedAccount dari Redux
  const selectedAccount = useSelector((state: RootState) => state.account.selectedAccount)
  const selectedAccountId = selectedAccount ? selectedAccount.id.toString() : "all"

  // 2. State untuk cek apakah list akun kosong total
  const [isAccountListEmpty, setIsAccountListEmpty] = useState(false)

  const [pendingData, setPendingData] = useState<SchedulerItem[]>([])
  const [doneData, setDoneData] = useState<SchedulerItem[]>([])
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  const [formData, setFormData] = useState<NewScheduleForm>({
    videoUrl: "",
    content: "",
    productId: "",
    scheduledTime: new Date(), 
  })

  const [timeValue, setTimeValue] = useState("10:00")

  // ============================================================================
  // CHECK ACCOUNTS
  // ============================================================================
  useEffect(() => {
    const checkAccountList = async () => {
      try {
        const res = await apiService.get<{ data: any[] }>("/api/v1/accounts")
        
        // ✅ Handle response structure
        const accounts = res.data || res
        
        if (Array.isArray(accounts) && accounts.length === 0) {
          setIsAccountListEmpty(true)
        } else {
          setIsAccountListEmpty(false)
        }
      } catch (error: any) {
        console.error("Gagal cek akun", error)
        
        // ✅ Error handling untuk fetch API
        let errorMessage = "Gagal mengecek daftar akun"
        if (error instanceof Error) {
          errorMessage = error.message
        }
        toast.error(errorMessage)
      }
    }
    checkAccountList()
  }, [])

  // ============================================================================
  // FETCH DATA (Pending & History)
  // ============================================================================
  const fetchPending = async () => {
    setLoading(true)
    try {
      // ✅ Build URL with query params
      let url = "/api/v1/scheduler/pending"
      if (selectedAccountId !== "all") {
        url += `?accountId=${selectedAccountId}`
      }

      const res = await apiService.get<{ data: SchedulerItem[] }>(url)
      
      // ✅ Handle response structure
      const data = res.data || res
      setPendingData(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error(error)
      
      let errorMessage = "Gagal memuat antrian"
      if (error instanceof Error) {
        errorMessage = error.message
      }
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    setLoading(true)
    try {
      // ✅ Build URL with query params
      let url = "/api/v1/scheduler/done"
      if (selectedAccountId !== "all") {
        url += `?accountId=${selectedAccountId}`
      }

      const res = await apiService.get<{ data: SchedulerItem[] }>(url)
      
      // ✅ Handle response structure
      const data = res.data || res
      setDoneData(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error(error)
      
      let errorMessage = "Gagal memuat riwayat"
      if (error instanceof Error) {
        errorMessage = error.message
      }
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "pending") {
      fetchPending()
    } else {
      fetchHistory()
    }
  }, [activeTab, selectedAccountId])

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return
    const [hours, minutes] = timeValue.split(":").map(Number)
    selectedDate.setHours(hours || 0)
    selectedDate.setMinutes(minutes || 0)
    selectedDate.setSeconds(0)
    setFormData({ ...formData, scheduledTime: selectedDate })
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTimeValue(newTime)
    if (formData.scheduledTime) {
      const [hours, minutes] = newTime.split(":").map(Number)
      const newDate = new Date(formData.scheduledTime)
      newDate.setHours(hours)
      newDate.setMinutes(minutes)
      newDate.setSeconds(0)
      setFormData({ ...formData, scheduledTime: newDate })
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedAccountId === "all") {
      toast.error("Mohon pilih akun spesifik terlebih dahulu.")
      return
    }

    if (!formData.scheduledTime) {
      toast.error("Waktu tayang harus diisi.")
      return
    }

    setSubmitLoading(true)
    const loadingToastId = toast.loading("Menyimpan jadwal...")

    try {
      const isoDate = formData.scheduledTime.toISOString()
      const payload = { 
        ...formData, 
        scheduledTime: isoDate, 
        statusPost: "PENDING",
        accountId: Number(selectedAccountId),
      }
      
      await apiService.post("/api/v1/scheduler", payload)
      
      toast.dismiss(loadingToastId)
      toast.success("Jadwal berhasil dibuat!")
      
      setIsDialogOpen(false)
      setFormData({ 
        videoUrl: "", 
        content: "", 
        productId: "", 
        scheduledTime: new Date() 
      })
      setTimeValue("10:00")
      
      fetchPending()
    } catch (error: any) {
      toast.dismiss(loadingToastId)
      
      let errorMessage = "Gagal menyimpan jadwal"
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        // ✅ Specific error messages
        if (error.message.includes("400")) {
          errorMessage = "Data tidak valid. Periksa kembali input Anda."
        } else if (error.message.includes("404")) {
          errorMessage = "Akun tidak ditemukan."
        } else if (error.message.includes("409")) {
          errorMessage = "Jadwal sudah ada untuk waktu tersebut."
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    const loadingToastId = toast.loading('Mengupdate status...')
    
    try {
      await apiService.patch(`/api/v1/scheduler/${id}/status`, { 
        status: newStatus 
      })
      
      toast.dismiss(loadingToastId)
      toast.success(`Status diubah jadi ${newStatus}`)
      
      if (activeTab === "pending") {
        fetchPending()
      } else {
        fetchHistory()
      }
    } catch (error: any) {
      toast.dismiss(loadingToastId)
      
      let errorMessage = "Gagal update status"
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        if (error.message.includes("404")) {
          errorMessage = "Jadwal tidak ditemukan."
        } else if (error.message.includes("403")) {
          errorMessage = "Tidak memiliki akses untuk mengupdate."
        }
      }
      
      toast.error(errorMessage)
    }
  }

  // ============================================================================
  // RENDER TABLE
  // ============================================================================
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
          {isHistory 
            ? "Belum ada postingan selesai." 
            : "Tidak ada antrian pending untuk akun ini."}
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Waktu Tayang</TableHead>
            <TableHead>Akun</TableHead>
            <TableHead className="max-w-[300px]">Konten</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">
              {isHistory ? "Video" : "Aksi"}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>
                    {format(new Date(item.scheduledTime), "dd MMM yyyy", { 
                      locale: idLocale 
                    })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(item.scheduledTime), "HH:mm", { 
                      locale: idLocale 
                    })} WIB
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{item.username}</div>
                <div className="text-xs text-muted-foreground">
                  {item.productId}
                </div>
              </TableCell>
              <TableCell className="truncate max-w-[250px]" title={item.content}>
                {item.content}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={isHistory ? "default" : "outline"}
                  className={
                    isHistory 
                      ? "bg-green-100 text-green-700" 
                      : "bg-yellow-50 text-yellow-700 border-yellow-200"
                  }
                >
                  {item.statusPost}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {isHistory ? (
                  <a 
                    href={item.videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs justify-end"
                  >
                    <Video className="w-3 h-3" /> Lihat
                  </a>
                ) : (
                  <div className="flex justify-end gap-2">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-green-600 hover:bg-green-100"
                      onClick={() => handleUpdateStatus(item.id, "DONE")}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-red-600 hover:bg-red-100"
                      onClick={() => handleUpdateStatus(item.id, "CANCELLED")}
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

      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Post Scheduler</h1>
          <p className="text-muted-foreground">
            Manage postingan otomatis TikTok & Video.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-[200px]">
            <AccountSelect />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Buat Jadwal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Jadwal Postingan Baru</DialogTitle>
                <DialogDescription>
                  {selectedAccountId === "all" 
                    ? "Pilih akun terlebih dahulu." 
                    : "Menambahkan jadwal untuk akun terpilih."}
                </DialogDescription>
              </DialogHeader>

              {/* LOGIKA TAMPILAN JIKA AKUN KOSONG / BELUM DIPILIH */}
              {selectedAccountId === "all" ? (
                <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                  {isAccountListEmpty ? (
                    // KONDISI 1: BELUM ADA AKUN SAMA SEKALI
                    <>
                      <div className="bg-orange-50 text-orange-600 p-3 rounded-full">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Belum Ada Akun</h3>
                        <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
                          Anda belum mendaftarkan akun sosial media apapun.
                        </p>
                      </div>
                      <Button asChild variant="default" className="mt-2">
                        <Link href="/accounts">
                          <Plus className="mr-2 h-4 w-4" /> Daftarkan Akun Sekarang
                        </Link>
                      </Button>
                    </>
                  ) : (
                    // KONDISI 2: ADA AKUN, TAPI BELUM DIPILIH DI DROPDOWN
                    <>
                      <div className="bg-red-50 text-red-600 p-3 rounded-full">
                        <XCircle className="w-8 h-8" />
                      </div>
                      <div className="text-red-500 font-medium">
                        Harap pilih akun spesifik di pojok kanan atas<br/>
                        sebelum membuat jadwal.
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // FORM INPUT (JIKA AKUN SUDAH DIPILIH)
                <form onSubmit={handleCreate} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Product ID</Label>
                    <Input 
                      value={formData.productId} 
                      onChange={e => setFormData({...formData, productId: e.target.value})} 
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Waktu Tayang</Label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.scheduledTime && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.scheduledTime ? (
                              format(formData.scheduledTime, "PPP", { locale: idLocale })
                            ) : (
                              <span>Pilih tanggal</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.scheduledTime}
                            onSelect={handleDateSelect}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Input 
                        type="time" 
                        className="w-[120px]"
                        value={timeValue}
                        onChange={handleTimeChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Video URL</Label>
                    <Input 
                      value={formData.videoUrl} 
                      onChange={e => setFormData({...formData, videoUrl: e.target.value})} 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Caption</Label>
                    <Textarea 
                      value={formData.content} 
                      onChange={e => setFormData({...formData, content: e.target.value})} 
                      required 
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit" disabled={submitLoading}>
                      {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                      Simpan
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* TABS */}
      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="pending">Antrian (Pending)</TabsTrigger>
            <TabsTrigger value="history">Riwayat (Done)</TabsTrigger>
          </TabsList>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={activeTab === 'pending' ? fetchPending : fetchHistory}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Antrian Pending</CardTitle>
              <CardDescription>
                {selectedAccountId === "all" 
                  ? "Menampilkan semua akun." 
                  : `Menampilkan antrian akun: ${selectedAccount?.username}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(pendingData, false)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
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