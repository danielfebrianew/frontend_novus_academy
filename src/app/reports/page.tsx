"use client";

import React, { useState, useEffect, useMemo } from "react";
import { apiService } from "@/lib/fetch"; 

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store"; 
import { setReportFilters, resetReportFilters } from "@/store/reportSlice"; 
import { AccountSelect } from "@/components/common/AccountSelect"; 

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis 
} from "recharts";
import { 
  ArrowUpRight, Eye, MousePointerClick, Wallet, Loader2, AlertCircle, ArrowLeft, Calendar 
} from "lucide-react";

// --- TIPE DATA ---
interface ReportData {
  date: string;
  liveRevenue: number;
  videoRevenue: number;
  revenue: number;
  view: number;
  click: number;
}

interface ApiResponse {
  statusCode: number;
  message: string;
  data: ReportData[];
}

// --- HELPER FORMATTER ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(date);
};

const getTodayString = () => new Date().toISOString().split("T")[0];
const getPastDateString = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
};

// ============================================================================
// KOMPONEN 1: FILTER FORM (Tidak berubah logic-nya)
// ============================================================================
const FilterView = () => {
  const dispatch = useDispatch();
  const selectedAccount = useSelector((state: RootState) => state.account.selectedAccount);
  
  const [dateRange, setDateRange] = useState({
    startDate: getPastDateString(7),
    endDate: getTodayString(),
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) {
      setError("Silakan pilih akun terlebih dahulu.");
      return;
    }
    if (new Date(dateRange.startDate) > new Date(dateRange.endDate)) {
       setError("Tanggal mulai tidak boleh lebih besar dari tanggal akhir.");
       return;
    }

    dispatch(setReportFilters({
        accountId: selectedAccount.id,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
    }));
  };

  useEffect(() => {
    if (selectedAccount) setError(null);
  }, [selectedAccount, dateRange]);

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-blue-600">
        <CardHeader>
          <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-2">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl text-center">Setup Laporan</CardTitle>
          <CardDescription className="text-center">
            Pilih akun TikTok dan rentang waktu laporan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium block">Pilih Akun</label>
              <div className="w-full">
                <AccountSelect /> 
              </div>
              {!selectedAccount && <p className="text-xs text-slate-500">Wajib pilih salah satu akun.</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Dari Tanggal</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sampai Tanggal</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <button
              type="submit"
              disabled={!selectedAccount}
              className={`w-full rounded-md py-2 text-white font-medium transition-colors ${
                  !selectedAccount ? "bg-slate-300 cursor-not-allowed" : "bg-blue-900 hover:bg-blue-950"
              }`}
            >
              Tampilkan Dashboard
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// KOMPONEN 2: DASHBOARD VIEW (Logic Fetch Diubah Disini)
// ============================================================================
const DashboardView = () => {
  const dispatch = useDispatch();
  const { accountId, startDate, endDate } = useSelector((state: RootState) => state.report);
  
  const [data, setData] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const queryParams = new URLSearchParams({
            accountId: String(accountId || ""), 
            startDate: startDate || "",
            endDate: endDate || ""
        }).toString();

        const endpoint = `/api/v1/reports/view-tiktok?${queryParams}`;
        
        const response = await apiService.get<ApiResponse>(endpoint);

        if (response.data && Array.isArray(response.data)) {
            setData(response.data);
        } else {
            setData([]);
        }

      } catch (err: any) {
        console.error("Fetch Error:", err);
        // apiService akan throw Error dengan message dari backend
        setError(err.message || "Gagal mengambil data laporan.");
      } finally {
        setIsLoading(false);
      }
    };

    if (accountId) fetchData();
  }, [accountId, startDate, endDate]);

  const summary = useMemo(() => {
    return data.reduce(
      (acc, curr) => ({
        totalRevenue: acc.totalRevenue + curr.revenue,
        totalView: acc.totalView + curr.view,
        totalClick: acc.totalClick + curr.click,
      }),
      { totalRevenue: 0, totalView: 0, totalClick: 0 }
    );
  }, [data]);

  const handleReset = () => {
    dispatch(resetReportFilters());
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">Sinkronisasi data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
         <div className="flex flex-col items-center gap-2 text-red-500">
            <AlertCircle className="h-8 w-8" />
            <p className="font-medium">Gagal memuat data: {error}</p>
            <button onClick={handleReset} className="text-sm underline hover:text-red-700">
                Kembali ke Filter
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <button onClick={handleReset} className="p-1 rounded-full hover:bg-slate-200 transition-colors" title="Ganti Filter">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
             </button>
             <h1 className="text-3xl font-bold tracking-tight text-slate-900">TikTok Analytics</h1>
          </div>
          {data.length > 0 && (
            <p className="text-slate-500 ml-8">
                Periode: <span className="font-medium text-slate-900">{formatDate(data[0].date)}</span> - <span className="font-medium text-slate-900">{formatDate(data[data.length - 1].date)}</span>
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
            <button onClick={handleReset} className="bg-white border px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-slate-50 transition-colors">
                Ganti Filter
            </button>
            <button className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-slate-800 transition-colors">
                Export Data
            </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total pendapatan bersih</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary.totalView.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground mt-1">Total tayangan produk</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Product Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary.totalClick.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground mt-1">
               CTR: <span className="font-medium text-purple-600">{summary.totalView > 0 ? ((summary.totalClick / summary.totalView) * 100).toFixed(2) : 0}%</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* CHART 1: REVENUE TREND */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Grafik pendapatan harian</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={formatDate} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${value}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(Number(value))}
                    labelFormatter={(label) => formatDate(label)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* CHART 2: ENGAGEMENT */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Engagement</CardTitle>
            <CardDescription>Views vs Clicks Performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis dataKey="date" tickFormatter={(val) => new Date(val).getDate().toString()} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(label) => formatDate(label)}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                  <Bar dataKey="view" name="Views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="click" name="Clicks" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE DETAIL */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Daily Breakdown</CardTitle>
            <CardDescription>Detail performa harian</CardDescription>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
            View Full Report <ArrowUpRight className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Video Rev</TableHead>
                <TableHead>Live Rev</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((item, index) => (
                    <TableRow key={index} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{formatDate(item.date)}</TableCell>
                    <TableCell>{item.view.toLocaleString()}</TableCell>
                    <TableCell>{item.click.toLocaleString()}</TableCell>
                    <TableCell>{formatCurrency(item.videoRevenue)}</TableCell>
                    <TableCell>{formatCurrency(item.liveRevenue)}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(item.revenue)}</TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-slate-500">Tidak ada data yang ditemukan.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// MAIN PAGE: TRAFFIC CONTROLLER
// ============================================================================
export default function ReportsPage() {
  const isFilterSet = useSelector((state: RootState) => state.report.isFilterSet);

  if (!isFilterSet) {
    return <FilterView />;
  }

  return <DashboardView />;
}