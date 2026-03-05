"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UploadCloud, FileType, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";

import { depositService } from "../_services/depositService";
import { Bank } from "../_types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

const formatRupiah = (value: string | number) => {
    if (!value) return "";
    const numValue = Number(value.toString().replace(/[^0-9]/g, ""));
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(numValue);
};

const formSchema = z.object({
    depositValue: z.string().min(1, "Nominal deposit wajib diisi"),
    bankCode: z.string().min(1, "Bank tujuan wajib dipilih"),
    depositDescription: z.string().min(1, "Deskripsi/nama rekening pengirim wajib diisi"),
});

export default function CreateDepositPage() {
    const router = useRouter();
    const [banks, setBanks] = useState<Bank[]>([]);
    const [isLoadingBanks, setIsLoadingBanks] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            depositValue: "",
            depositDescription: "",
            bankCode: "",
        },
    });

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const response = await depositService.getBanks();
                setBanks(response.data || []);
            } catch (error) {
                console.error("Failed to load banks:", error);
                toast.error("Gagal memuat daftar bank.");
            } finally {
                setIsLoadingBanks(false);
            }
        };
        fetchBanks();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileError("");
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

            if (!validTypes.includes(selectedFile.type)) {
                setFileError("Format file tidak didukung (hanya JPG, PNG, WEBP, PDF)");
                setFile(null);
                return;
            }

            if (selectedFile.size > 5 * 1024 * 1024) {
                setFileError("Ukuran file maksimal 5MB");
                setFile(null);
                return;
            }

            setFile(selectedFile);
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!file) {
            setFileError("Bukti transfer wajib diunggah");
            return;
        }

        const numericValue = Number(values.depositValue.replace(/[^0-9]/g, ""));
        if (numericValue < 10000) {
            toast.error("Minimal deposit adalah Rp 10.000");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading("Mengunggah bukti transfer...");

        try {
            await depositService.createDeposit({
                depositValue: numericValue,
                bankCode: values.bankCode,
                depositDescription: values.depositDescription,
                buktiTransfer: file,
            });

            toast.success("Deposit berhasil dibuat! Menunggu verifikasi admin.", { id: toastId });
            router.push("/deposit");
        } catch (error: any) {
            const msg = error.message || "Terjadi kesalahan saat membuat deposit";
            toast.error(msg, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link href="/deposit">
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Buat Deposit</h1>
                    <p className="text-slate-500 text-sm">Transfer ke rekening kami dan unggah bukti transfer.</p>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
                    <CardTitle className="text-lg text-slate-800">Form Konfirmasi Transfer</CardTitle>
                    <CardDescription>Pastikan data yang diisi sesuai dengan bukti transfer.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        <div className="space-y-2">
                            <Label htmlFor="bankCode">Pilih Bank Tujuan Tranfer</Label>
                            <Select
                                disabled={isLoadingBanks || isSubmitting}
                                onValueChange={(val) => form.setValue("bankCode", val)}
                            >
                                <SelectTrigger className={form.formState.errors.bankCode ? "border-red-500" : ""}>
                                    <SelectValue placeholder={isLoadingBanks ? "Memuat list bank..." : "Pilih Bank"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {banks.map((bank) => (
                                        <SelectItem key={bank.bankId} value={bank.bankCode}>
                                            {bank.bankName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.bankCode && (
                                <p className="text-xs text-red-500">{form.formState.errors.bankCode.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="depositValue">Nominal Transfer</Label>
                            <div className="relative">
                                <Input
                                    id="depositValue"
                                    placeholder="Contoh: 50.000"
                                    disabled={isSubmitting}
                                    className={`pl-10 ${form.formState.errors.depositValue ? "border-red-500" : ""}`}
                                    {...form.register("depositValue", {
                                        onChange: (e) => {
                                            const formatted = formatRupiah(e.target.value);
                                            e.target.value = formatted.replace("Rp", "").trim();
                                        }
                                    })}
                                />
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500 font-medium text-sm">
                                    Rp
                                </div>
                            </div>
                            {form.formState.errors.depositValue && (
                                <p className="text-xs text-red-500">{form.formState.errors.depositValue.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="depositDescription">Nama Pengirim / Catatan</Label>
                            <Textarea
                                id="depositDescription"
                                placeholder="M. Iqbal - Transfer dari BCA"
                                disabled={isSubmitting}
                                className={form.formState.errors.depositDescription ? "border-red-500" : ""}
                                {...form.register("depositDescription")}
                            />
                            {form.formState.errors.depositDescription && (
                                <p className="text-xs text-red-500">{form.formState.errors.depositDescription.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Bukti Transfer <span className="text-red-500">*</span></Label>
                            <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? "border-green-200 bg-green-50" : fileError ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200"
                                    }`}
                            >
                                <input
                                    type="file"
                                    id="buktiTransfer"
                                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={isSubmitting}
                                />
                                <Label htmlFor="buktiTransfer" className="cursor-pointer flex flex-col items-center w-full h-full">
                                    {file ? (
                                        <>
                                            <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                                            <p className="font-semibold text-green-800 text-sm">{file.name}</p>
                                            <p className="text-xs text-green-600 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            <p className="text-xs text-slate-500 mt-4 underline">Klik untuk mengganti file</p>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                                            <p className="font-medium text-slate-700 text-sm">Klik untuk upload bukti transfer</p>
                                            <p className="text-xs text-slate-500 mt-1">Format: JPG, PNG, WEBP, PDF (Max 5MB)</p>
                                        </>
                                    )}
                                </Label>
                            </div>
                            {fileError && <p className="text-xs text-red-500 font-medium">{fileError}</p>}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                            <Link href="/deposit">
                                <Button type="button" variant="outline" disabled={isSubmitting}>
                                    Batal
                                </Button>
                            </Link>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                                {isSubmitting ? "Mengirim..." : "Konfirmasi Deposit"}
                            </Button>
                        </div>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
