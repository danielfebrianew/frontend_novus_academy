import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface VideoGeneratorState {
  step: number;
  loading: boolean;
  loadingMsg: string;
  progressValue: number;
  uploadedImageUrls: string[];
  productName: string;
  script: string;
  caption: string;
  prompts: string[];
  results: string[];
  cropperOpen: boolean;
  cropperImgSrc: string | null;
  targetCount: number;
  voiceGender: string;
}

const initialState: VideoGeneratorState = {
  step: 1,
  loading: false,
  loadingMsg: "",
  progressValue: 0,
  uploadedImageUrls: [],
  productName: "",
  script: "",
  caption: "",
  prompts: [],
  results: [],
  cropperOpen: false,
  cropperImgSrc: null,
  targetCount: 5,
  voiceGender: 'female'
};

const videoGeneratorSlice = createSlice({
  name: "videoGenerator",
  initialState,
  reducers: {
    setStep(state, action: PayloadAction<number>) {
      state.step = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setLoadingMsg(state, action: PayloadAction<string>) {
      state.loadingMsg = action.payload;
    },
    setProgressValue(state, action: PayloadAction<number>) {
      state.progressValue = action.payload;
    },
    // HAPUS action setSelectedFile, addReadyFile, removeReadyFile dari sini
    
    setUploadedImageUrls(state, action: PayloadAction<string[]>) {
      state.uploadedImageUrls = action.payload;
    },
    setProductName(state, action: PayloadAction<string>) {
      state.productName = action.payload;
    },
    setScript(state, action: PayloadAction<string>) {
      state.script = action.payload;
    },
    setCaption(state, action: PayloadAction<string>) {
      state.caption = action.payload;
    },
    setPrompts(state, action: PayloadAction<string[]>) {
      state.prompts = action.payload;
    },
    setResults(state, action: PayloadAction<string[]>) {
      state.results = action.payload;
    },
    setCropperOpen(state, action: PayloadAction<boolean>) {
      state.cropperOpen = action.payload;
    },
    setCropperImgSrc(state, action: PayloadAction<string | null>) {
      state.cropperImgSrc = action.payload;
    },
    setTargetCount(state, action: PayloadAction<number>) {
      state.targetCount = action.payload;
    },
    resetState(state) {
      Object.assign(state, initialState);
    },
    setVoiceGender(state, action: PayloadAction<string>) {
      state.voiceGender = action.payload;
    },
  },
});

export const {
  setStep,
  setLoading,
  setLoadingMsg,
  setProgressValue,
  setUploadedImageUrls,
  setProductName,
  setScript,
  setCaption,
  setPrompts,
  setResults,
  setCropperOpen,
  setCropperImgSrc,
  setTargetCount,
  setVoiceGender,
  resetState,
} = videoGeneratorSlice.actions;

export default videoGeneratorSlice.reducer;