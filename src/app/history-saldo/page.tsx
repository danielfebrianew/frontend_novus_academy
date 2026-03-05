"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle, ArrowDownLeft, ArrowUpRight, ReceiptText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import id from "date-fns/locale/id";
import { historySaldoService } from "./_services/historySaldoService";
import { HistorySaldo } from "./_types";

export default function HistorySaldoPage() {
    const [history, setHistory] = useState<HistorySaldo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await historySaldoService.getHistorySaldo();
                setHistory(response.data || []);
            } catch (error) {
                console.error("Failed to load history saldo:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const formatRupiah = (value: string | number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(Number(value));
    };

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">History Saldo</h1>
                <p className="text-slate-500 mt-1">
                    Pantau riwayat masuk dan keluar saldo credit kamu.
                </p>
            </div>

            {/* TABLE / LIST */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
                    <CardTitle className="text-base font-semibold text-slate-800">
                        Daftar Riwayat Saldo
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-10 text-center text-slate-500 flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                            Memuat data riwayat saldo...
                        </div>
                    ) : history.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">
                            <ReceiptText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                            <p>Belum ada riwayat saldo yang tercatat.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Tanggal</th>
                                        <th className="px-6 py-4 font-medium">Detail Transaksi</th>
                                        <th className="px-6 py-4 font-medium text-right">Nominal</th>
                                        <th className="px-6 py-4 font-medium text-center">Tipe</th>
                                        <th className="px-6 py-4 font-medium text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {history.map((record) => {
                                        const isMasuk = record.historySaldoType === "d" || record.historySaldoType === "D"; // Deposit (Masuk)
                                        return (
                                            <tr key={record.historySaldoId} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                                    {format(new Date(record.historySaldoDate), "dd MMM yyyy", { locale: id })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900">{record.historySaldoKeterangan}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5 font-mono">
                                                        Ref: {record.historySaldoRef}
                                                    </div>
                                                </td>
                                                <td className={`px-6 py-4 font-semibold text-right ${isMasuk ? "text-green-600" : "text-slate-900"}`}>
                                                    {isMasuk ? "+" : "-"} {formatRupiah(record.historySaldoValue)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {isMasuk ? (
                                                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                                                            <ArrowDownLeft className="w-3 h-3 mr-1" />
                                                            Masuk
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                                                            <ArrowUpRight className="w-3 h-3 mr-1" />
                                                            Keluar
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {record.historySaldoStatus === 2 ? (
                                                        <Badge variant="outline" className="border-slate-200 text-slate-700 gap-1.5 px-2.5 py-1">
                                                            <CheckCircle className="w-3 h-3 text-slate-500" />
                                                            Approved
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 gap-1.5 px-2.5 py-1">
                                                            <Clock className="w-3 h-3 text-amber-500" />
                                                            Pending
                                                        </Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
