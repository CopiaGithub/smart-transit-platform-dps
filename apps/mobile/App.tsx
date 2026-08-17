import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import ConfirmHost from "./components/ConfirmHost";
import Navigation from "./navigation";
import store from "./src/store";

export default function App() {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Navigation />
          {/* Last, so its sheet paints over the drawer and any screen that
              asked the question. See askConfirm. */}
          <ConfirmHost />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}
