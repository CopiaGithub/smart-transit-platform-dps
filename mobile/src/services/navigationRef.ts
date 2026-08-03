import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/types";

// Lets non-React code (api interceptors, push handlers) navigate.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function resetTo(name: keyof RootStackParamList) {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name } as never] });
  }
}
