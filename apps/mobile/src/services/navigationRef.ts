import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/types";

// Lets non-React code (push handlers, deep links) navigate. Signing out does
// not go through here — that is driven by auth state in navigation/index.tsx.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
