"use client"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/store/store"
import { fetchAccountsFromApi, setSelectedAccount } from "@/store/accountSlice"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

export function AccountSelect() {
  // Gunakan AppDispatch agar TypeScript mengenali Thunk (Async Action)
  const dispatch = useDispatch<AppDispatch>()
  
  // 1. Ambil List Akun, Akun Terpilih, dan Status Loading dari Redux
  const { accounts, selectedAccount, loading } = useSelector((state: RootState) => state.account)

  // 2. Fetch data HANYA jika list akun di Redux masih kosong
  // Ini mencegah double-request saat pindah halaman atau re-render
  useEffect(() => {
    if (accounts.length === 0) {
      dispatch(fetchAccountsFromApi())
    }
  }, [dispatch, accounts.length])

  // 3. Handle Change
  const handleValueChange = (val: string) => {
    if (val === "all") {
      dispatch(setSelectedAccount(null))
    } else {
      // Cari object akun penuh dari store (bukan fetch lagi)
      const account = accounts.find((acc) => acc.id.toString() === val)
      if (account) {
        dispatch(setSelectedAccount(account))
      }
    }
  }

  // Value dropdown
  const currentValue = selectedAccount ? selectedAccount.id.toString() : "all"

  return (
    <Select 
      value={currentValue} 
      onValueChange={handleValueChange} 
      disabled={loading && accounts.length === 0} // Disable jika loading awal
    >
      <SelectTrigger className="w-[200px] bg-white">
        <SelectValue placeholder={loading ? "Memuat..." : "Pilih Akun"} />
      </SelectTrigger>
      <SelectContent>
        {/* Opsi Default */}
        <SelectItem value="all">Semua Akun</SelectItem>
        
        {/* Tampilkan Loading di dalam dropdown jika sedang fetch ulang */}
        {loading && accounts.length === 0 && (
            <div className="flex items-center justify-center p-2 text-muted-foreground text-sm">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
            </div>
        )}

        {/* Render List Akun dari Redux */}
        {accounts.map((acc) => (
          <SelectItem key={acc.id} value={acc.id.toString()}>
            {acc.username}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}