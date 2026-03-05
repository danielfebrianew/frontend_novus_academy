export interface HistorySaldo {
    historySaldoId: number;
    userId: number;
    historySaldoValue: string;
    historySaldoKeterangan: string;
    historySaldoType: "d" | "k" | "D" | "K"; // d = Deposit, k = Kredit
    historySaldoRef: string;
    historySaldoDate: string;
    historySaldoStatus: number; // 1 = Pending, 2 = Approved
}

export interface HistorySaldoResponse {
    data: HistorySaldo[];
}
