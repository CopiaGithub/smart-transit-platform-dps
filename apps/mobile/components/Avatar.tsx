import { useState } from "react";
import { Image, StyleSheet } from "react-native";
import { COLORS } from "../constants/theme";
import axiosInstance from "../src/services/apiClient";

/**
 * The one photo every student wears until the school has their own.
 *
 * ponytail: a single bundled stand-in, not a per-student upload pipeline. When
 * real photos arrive they come down `PhotoUrl` and this is only what a missing
 * or broken one falls back to — nothing here changes.
 */
const PLACEHOLDER = require("../assets/student-photo.png");

/**
 * The server stores photos as site-relative paths (`/uploads/students/x.jpg`),
 * which mean nothing to a phone. They hang off the API host, one level above
 * `/api/`. Done by hand rather than through `new URL` — React Native's polyfill
 * does not resolve a relative path against a base.
 */
const apiOrigin = (axiosInstance.defaults.baseURL ?? "").replace(/\/api\/?$/, "");

const absolute = (uri: string) =>
  /^(https?:|data:|file:)/i.test(uri) ? uri : apiOrigin + (uri.startsWith("/") ? uri : "/" + uri);

/**
 * A child's face.
 *
 * Nothing serves `/uploads/` yet, so every stored path 404s and every child
 * shows the placeholder today. That is deliberate: a broken-image icon down a
 * roster of thirty tells a teacher nothing, and the row still has to be
 * readable at a glance.
 */
export default function Avatar({
  name,
  uri,
  size = 44,
  ring,
}: {
  name: string;
  uri?: string | null;
  size?: number;
  /**
   * Colour of the ring around the face. Given a state to show — present or
   * absent — the ring carries it, so a teacher reads the row from the picture
   * rather than from the buttons at the far end of it.
   */
  ring?: string;
}) {
  const [broken, setBroken] = useState(false);

  return (
    <Image
      source={uri && !broken ? { uri: absolute(uri) } : PLACEHOLDER}
      style={[
        styles.photo,
        { width: size, height: size, borderRadius: size / 2 },
        !!ring && { borderWidth: 2.5, borderColor: ring },
      ]}
      resizeMode="cover"
      onError={() => setBroken(true)}
      accessibilityIgnoresInvertColors
      accessibilityLabel={name}
    />
  );
}

const styles = StyleSheet.create({
  photo: {
    // The photo is cut out on white, and so is the card behind it — without a
    // hairline the circle has no edge at all.
    backgroundColor: COLORS.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
});
