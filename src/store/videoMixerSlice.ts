import { createSlice } from "@reduxjs/toolkit";

interface VideoMixerState {
  // Reserved for future mixer state if needed
}

const initialState: VideoMixerState = {};

const videoMixerSlice = createSlice({
  name: "videoMixer",
  initialState,
  reducers: {},
});

export default videoMixerSlice.reducer;
