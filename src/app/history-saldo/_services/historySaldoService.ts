import apiService from "@/lib/fetch";
import { HistorySaldoResponse } from "../_types";

export const historySaldoService = {
    getHistorySaldo: async (): Promise<HistorySaldoResponse> => {
        return apiService.get<HistorySaldoResponse>("/api/v1/history-saldo");
    },
};
