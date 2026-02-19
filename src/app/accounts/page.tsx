"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import toast from "react-hot-toast"
import { Loader2, Trash2, Pencil, Plus } from "lucide-react"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ✅ Import api wrapper (fetch)
import { apiService } from "@/lib/fetch"

// --- TIPE DATA ---
interface Account {
  id: number
  username: string
  email: string
  status: string
  cookie?: string
  createdAt: string
}

// Schema Validasi Tambah/Edit Akun
const accountSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  password: z.string().optional(), 
  cookie: z.string().optional(),
  status: z.string().optional(),
})

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  
  // State Dialog Create
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  
  // State Dialog Edit
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [submitLoading, setSubmitLoading] = useState(false)

  // --- FORM CREATE ---
  const formCreate = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      cookie: "",
      status: "ACTIVE"
    },
  })

  // --- FORM EDIT ---
  const formEdit = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      cookie: "",
      status: "ACTIVE"
    },
  })

  // --- FETCH ACCOUNTS ---
  const fetchAccounts = async () => {
    setLoading(true)
    try {
      // ✅ apiService.get sudah return data langsung
      const res = await apiService.get<{ data: Account[] }>("/api/v1/accounts")
      
      // ✅ Sesuaikan dengan struktur response backend
      // Jika backend return { data: [...] }, gunakan res.data
      // Jika backend return langsung array, gunakan res
      setAccounts(res.data || res)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Gagal memuat daftar akun.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  // --- CREATE ACTION ---
  const onCreateSubmit = async (values: z.infer<typeof accountSchema>) => {
    setSubmitLoading(true)
    const loadingToastId = toast.loading("Menambahkan akun...")
    
    try {
      await apiService.post("/api/v1/accounts", {
        ...values,
        status: "ACTIVE" 
      })

      toast.dismiss(loadingToastId)
      toast.success("Akun berhasil ditambahkan!")
      setIsCreateOpen(false)
      formCreate.reset()
      fetchAccounts() 
    } catch (error: any) {
      toast.dismiss(loadingToastId)
      
      // ✅ Error handling untuk fetch API
      let errorMessage = "Gagal menambah akun"
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Deteksi error spesifik
        if (error.message.includes("409")) {
          errorMessage = "Username sudah digunakan"
        } else if (error.message.includes("400")) {
          errorMessage = error.message.includes("HTTP error") 
            ? "Data tidak valid" 
            : error.message
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setSubmitLoading(false)
    }
  }

  // --- PREPARE EDIT ---
  const handleEditClick = (account: Account) => {
    setEditingId(account.id)
    formEdit.reset({
      username: account.username,
      email: account.email || "",
      password: "",
      cookie: account.cookie || "",
      status: account.status
    })
    setIsEditOpen(true)
  }

  // --- UPDATE ACTION ---
  const onEditSubmit = async (values: z.infer<typeof accountSchema>) => {
    if (!editingId) return

    setSubmitLoading(true)
    const loadingToastId = toast.loading("Memperbarui akun...")
    
    try {
      // Hapus field password jika kosong
      const payload: any = { ...values }
      if (!payload.password) delete payload.password

      await apiService.patch(`/api/v1/accounts/${editingId}`, payload)

      toast.dismiss(loadingToastId)
      toast.success("Akun berhasil diperbarui!")
      setIsEditOpen(false)
      fetchAccounts()
    } catch (error: any) {
      toast.dismiss(loadingToastId)
      
      // ✅ Error handling untuk fetch API
      let errorMessage = "Gagal update akun"
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        if (error.message.includes("404")) {
          errorMessage = "Akun tidak ditemukan"
        } else if (error.message.includes("409")) {
          errorMessage = "Username sudah digunakan"
        } else if (error.message.includes("400")) {
          errorMessage = error.message.includes("HTTP error") 
            ? "Data tidak valid" 
            : error.message
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setSubmitLoading(false)
    }
  }

  // --- DELETE ACTION ---
  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus akun ini? Jadwal terkait mungkin akan error.")) return

    const toastId = toast.loading("Menghapus...")
    
    try {
      await apiService.delete(`/api/v1/accounts/${id}`)
      toast.success("Akun berhasil dihapus", { id: toastId })
      fetchAccounts()
    } catch (error: any) {
      // ✅ Error handling untuk fetch API
      let errorMessage = "Gagal menghapus akun"
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        if (error.message.includes("404")) {
          errorMessage = "Akun tidak ditemukan"
        } else if (error.message.includes("403")) {
          errorMessage = "Tidak memiliki akses untuk menghapus"
        }
      }
      
      toast.error(errorMessage, { id: toastId })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">Kelola akun bot sosial media kamu.</p>
        </div>
        
        {/* BUTTON TAMBAH AKUN */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Tambah Akun
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah Akun Baru</DialogTitle>
              <DialogDescription>
                Masukkan detail akun bot. Cookie opsional jika login otomatis belum support.
              </DialogDescription>
            </DialogHeader>

            <Form {...formCreate}>
              <form onSubmit={formCreate.handleSubmit(onCreateSubmit)} className="space-y-4 py-4">
                <FormField
                  control={formCreate.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username (ID Unik)</FormLabel>
                      <FormControl>
                        <Input placeholder="contoh: bot_tiktok_01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formCreate.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="bot@mail.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={formCreate.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="***" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formCreate.control}
                    name="cookie"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cookie Session</FormLabel>
                        <FormControl>
                          <Input placeholder="session_id=..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitLoading}>
                    {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                    Simpan Akun
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* DIALOG EDIT */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Akun</DialogTitle>
              <DialogDescription>
                Ubah detail akun. Kosongkan password jika tidak ingin menggantinya.
              </DialogDescription>
            </DialogHeader>

            <Form {...formEdit}>
              <form onSubmit={formEdit.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                <FormField
                  control={formEdit.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={formEdit.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                          <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                          <SelectItem value="EXPIRED">EXPIRED</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={formEdit.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={formEdit.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password (Baru)</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Kosongkan jika tetap" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formEdit.control}
                    name="cookie"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cookie</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitLoading}>
                    {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                    Update Akun
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* TABLE LIST AKUN */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Akun Terdaftar</CardTitle>
          <CardDescription>Akun ini akan muncul di dropdown saat membuat jadwal.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada akun. Silakan tambah baru.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((acc) => (
                  <TableRow key={acc.id}>
                    <TableCell className="font-medium">{acc.username}</TableCell>
                    <TableCell>{acc.email || "-"}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          acc.status === 'ACTIVE' ? "bg-green-50 text-green-700 border-green-200" :
                          acc.status === 'SUSPENDED' ? "bg-red-50 text-red-700 border-red-200" :
                          "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }
                      >
                        {acc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* TOMBOL EDIT */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleEditClick(acc)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* TOMBOL DELETE */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(acc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}