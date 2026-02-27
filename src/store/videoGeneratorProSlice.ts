import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface VideoGeneratorProState {
  isLoading: boolean;
  taskId: string | null;
  progressMsg: string;
  simulatedProgress: number | null;
  generatedPrompt: string | null;
  resultUrls: string[] | null;
  genError: string | null;
  // Form fields — persisted until resetPro()
  productTitle: string;
  productDescription: string;
  imagePreview: string | null;
  faceCharacter: string;
  customFaceCharacter: string;
}

const initialState: VideoGeneratorProState = {
  isLoading: false,
  taskId: null,
  progressMsg: "",
  simulatedProgress: null,
  generatedPrompt: null,
  resultUrls: null,
  genError: null,
  productTitle: "",
  productDescription: "",
  imagePreview: null,
  faceCharacter: "",
  customFaceCharacter: "",
};

const videoGeneratorProSlice = createSlice({
  name: "videoGeneratorPro",
  initialState,
  reducers: {
    setProLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setProTaskId: (state, action: PayloadAction<string | null>) => {
      state.taskId = action.payload;
    },
    setProProgressMsg: (state, action: PayloadAction<string>) => {
      state.progressMsg = action.payload;
    },
    setProSimulatedProgress: (state, action: PayloadAction<number | null>) => {
      state.simulatedProgress = action.payload;
    },
    setProGeneratedPrompt: (state, action: PayloadAction<string | null>) => {
      state.generatedPrompt = action.payload;
    },
    setProResultUrls: (state, action: PayloadAction<string[] | null>) => {
      state.resultUrls = action.payload;
    },
    setProGenError: (state, action: PayloadAction<string | null>) => {
      state.genError = action.payload;
    },
    setProProductTitle: (state, action: PayloadAction<string>) => {
      state.productTitle = action.payload;
    },
    setProProductDescription: (state, action: PayloadAction<string>) => {
      state.productDescription = action.payload;
    },
    setProImagePreview: (state, action: PayloadAction<string | null>) => {
      state.imagePreview = action.payload;
    },
    setProFaceCharacter: (state, action: PayloadAction<string>) => {
      state.faceCharacter = action.payload;
    },
    setProCustomFaceCharacter: (state, action: PayloadAction<string>) => {
      state.customFaceCharacter = action.payload;
    },
    resetPro: () => initialState,
  },
});

export const {
  setProLoading,
  setProTaskId,
  setProProgressMsg,
  setProSimulatedProgress,
  setProGeneratedPrompt,
  setProResultUrls,
  setProGenError,
  setProProductTitle,
  setProProductDescription,
  setProImagePreview,
  setProFaceCharacter,
  setProCustomFaceCharacter,
  resetPro,
} = videoGeneratorProSlice.actions;
export default videoGeneratorProSlice.reducer;
