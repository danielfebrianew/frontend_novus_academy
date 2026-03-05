"use client";

import { useEffect, useState } from "react";
import { Plus, History, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import id from "date-fns/locale/id";
import { depositService } from "./_services/depositService";
import { Deposit } from "./_types";

export default function DepositPage() {
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDeposits = async () => {
            try {
                const response = await depositService.getDeposits();
                setDeposits(response.data || []);
            } catch (error) {
                console.error("Failed to load deposits:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDeposits();
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Deposit History</h1>
                    <p className="text-slate-500 mt-1">
                        Lihat riwayat top-up dan penambahan credit kamu.
                    </p>
                </div>
                <Link href="/deposit/create">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Top Up Deposit
                    </Button>
                </Link>
            </div>

            {/* OVERVIEW CARDS (Optional visual hook) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
                            <History className="w-4 h-4" />
                            Total Transaksi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-800">
                            {isLoading ? "..." : deposits.length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* TABLE / LIST */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
                    <CardTitle className="text-base font-semibold text-slate-800">
                        Daftar Transaksi Deposit
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-10 text-center text-slate-500 flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                            Memuat data deposits...
                        </div>
                    ) : deposits.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">
                            <History className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                            <p>Belum ada transaksi deposit.</p>
                            <Link href="/deposit/create" className="text-blue-600 hover:underline mt-2 inline-block text-sm">
                                Mulai top up pertama kamu
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Tanggal</th>
                                        <th className="px-6 py-4 font-medium">Deskripsi & Bank</th>
                                        <th className="px-6 py-4 font-medium">Nominal</th>
                                        <th className="px-6 py-4 font-medium text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {deposits.map((deposit) => (
                                        <tr key={deposit.depositId} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                                {format(new Date(deposit.depositCreateDate), "dd MMM yyyy, HH:mm", { locale: id })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{deposit.depositDescription}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    {deposit.bank?.bankName || "Transfer Bank"} {deposit.bank ? `(${deposit.bank.bankCode})` : ""}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-900">
                                                {formatRupiah(deposit.depositValue)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {deposit.depositStatus === 1 ? (
                                                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 gap-1.5 px-2.5 py-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Approved
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 gap-1.5 px-2.5 py-1">
                                                        <Clock className="w-3 h-3" />
                                                        Pending
                                                    </Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
