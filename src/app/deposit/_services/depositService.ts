import apiService from "@/lib/fetch";
import { BankResponse, DepositResponse, CreateDepositData } from "../_types";

export const depositService = {
    getBanks: async (): Promise<BankResponse> => {
        return apiService.get<BankResponse>("/api/v1/deposits/banks");
    },

    getDeposits: async (): Promise<DepositResponse> => {
        return apiService.get<DepositResponse>("/api/v1/deposits");
    },

    createDeposit: async (data: CreateDepositData) => {
        const formData = new FormData();
        formData.append("depositValue", data.depositValue.toString());
        formData.append("depositDescription", data.depositDescription);
        formData.append("bankCode", data.bankCode);
        formData.append("buktiTransfer", data.buktiTransfer);

        return apiService.upload("/api/v1/deposits", formData);
    },
};
