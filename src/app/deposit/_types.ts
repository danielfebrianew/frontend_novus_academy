export interface Bank {
    bankId: number;
    bankName: string;
    bankCode: string;
}

export interface BankResponse {
    data: Bank[];
}

export interface Deposit {
    depositId: number;
    depositValue: string;
    depositDescription: string;
    depositStatus: number;
    buktiTransfer: string;
    bank?: Bank;
    depositCreateDate: string;
}

export interface DepositResponse {
    data: Deposit[];
}

export interface CreateDepositData {
    depositValue: number;
    depositDescription: string;
    bankCode: string;
    buktiTransfer: File;
}
