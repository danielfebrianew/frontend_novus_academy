import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface VideoMixerState {
  outputDirectory: string; // Menyimpan path folder
}

const initialState: VideoMixerState = {
  // Default kosong atau bisa set default path umum
  outputDirectory: "", 
};

const videoMixerSlice = createSlice({
  name: "videoMixer",
  initialState,
  reducers: {
    setOutputDirectory: (state, action: PayloadAction<string>) => {
      state.outputDirectory = action.payload;
    },
  },
});

export const { setOutputDirectory } = videoMixerSlice.actions;
export default videoMixerSlice.reducer;