import {configureStore} from '@reduxjs/toolkit';
import buttermapReducer from './buttermapReducer';


export const buttermapStore = configureStore({
    reducer: buttermapReducer
});

export type AppDispatch = typeof buttermapStore.dispatch;

export default buttermapStore;
