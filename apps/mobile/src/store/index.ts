import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { setUnauthorizedHandler } from "../services/apiClient";
import authReducer, { sessionExpired } from "./auth.slice";
import mastersReducer from "./masters.slice";
import opsReducer from "./operations.slice";
import parentReducer from "./parent.slice";
import dispersalReducer from "./session.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ops: opsReducer,
    session: dispersalReducer,
    masters: mastersReducer,
    parent: parentReducer,
  },
});

// A 401 inside a 200 envelope means the session is gone. Wiring it here rather
// than importing the store into apiClient keeps that dependency one-way.
setUnauthorizedHandler(() => store.dispatch(sessionExpired()));

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export default store;
