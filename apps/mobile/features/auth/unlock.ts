import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

/**
 * Quick sign-in: an MPIN, or the device's own face/fingerprint, instead of
 * typing a password at the start of every shift.
 *
 * ## Why credentials, and not just the token
 *
 * The API issues a 60-minute token and has no refresh endpoint — `/Auth/login`
 * is the only thing on AuthController. Keeping the token would buy less than an
 * hour, which is not "quick sign-in", it is a delay before the same password
 * prompt. So enrolling stores the credentials in the platform keystore
 * (Keychain on iOS, Keystore on Android) and an unlock signs in again behind
 * the screen.
 *
 * That is the real cost of this feature and it should be a deliberate choice:
 * a password now lives on the phone. What follows is what limits the damage.
 *
 * ## The MPIN is stored as typed, on purpose
 *
 * Hashing four digits protects nothing — ten thousand candidates fall in
 * microseconds — and anything that can read the MPIN out of the keystore can
 * read the password sitting beside it. The MPIN is a gate on this app, not a
 * secret. What actually limits guessing is the attempt counter below.
 *
 * ## Wrong guesses erase the enrolment
 *
 * After MAX_ATTEMPTS the credentials are deleted and the password screen comes
 * back. A found phone is then worth nothing more than a locked one, and the
 * owner has lost only the convenience.
 *
 * ## Expo Go
 *
 * iOS Face ID does not work in Expo Go — the Info.plist belongs to Expo Go, not
 * to this app — so `biometricAvailable` comes back false there and the MPIN
 * carries the whole feature. It works in a development or store build, where
 * the config plugin in app.config.ts applies. Android biometrics work in both.
 */

const CREDENTIALS_KEY = "unlock.credentials";
const MPIN_KEY = "unlock.mpin";
const BIOMETRIC_KEY = "unlock.biometric";
const ATTEMPTS_KEY = "unlock.attempts";

export const MPIN_LENGTH = 4;

/** Five is enough for a cold thumb and far too few to search 10,000 pins. */
export const MAX_ATTEMPTS = 5;

export type StoredCredentials = {
  identifier: string;
  password: string;
  /** Shown on the unlock screen, so it greets a person rather than a field. */
  name: string;
};

export type UnlockState = {
  /** True when someone has enrolled and the unlock screen should be shown. */
  enrolled: boolean;
  name: string;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  /** "Face ID", "Fingerprint", "Biometrics" — whatever this device offers. */
  biometricLabel: string;
  attemptsLeft: number;
};

/** What this device can actually do, asked rather than assumed. */
export async function biometricCapability(): Promise<{
  available: boolean;
  label: string;
}> {
  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);

    // Hardware without an enrolled face or finger is not an offer worth making;
    // tapping it would only open a system screen the guard cannot complete.
    if (!hasHardware || !isEnrolled) return { available: false, label: "Biometrics" };

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const label = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
      ? "Face ID"
      : types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ? "Fingerprint"
        : "Biometrics";

    return { available: true, label };
  } catch {
    // An older or locked-down device simply does not get the option.
    return { available: false, label: "Biometrics" };
  }
}

export async function getUnlockState(): Promise<UnlockState> {
  const [credentials, mpin, biometric, attempts, capability] = await Promise.all([
    readCredentials(),
    SecureStore.getItemAsync(MPIN_KEY),
    SecureStore.getItemAsync(BIOMETRIC_KEY),
    SecureStore.getItemAsync(ATTEMPTS_KEY),
    biometricCapability(),
  ]);

  const enrolled = !!credentials && !!mpin;

  return {
    enrolled,
    name: credentials?.name ?? "",
    // A device can lose its enrolled fingerprint after we stored the preference,
    // so both have to be true for the button to appear.
    biometricEnabled: biometric === "1" && capability.available,
    biometricAvailable: capability.available,
    biometricLabel: capability.label,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - Number(attempts ?? 0)),
  };
}

/** Turns quick sign-in on. The caller must have just verified the password. */
export async function enable(
  credentials: StoredCredentials,
  mpin: string,
  useBiometric: boolean,
): Promise<void> {
  if (mpin.length !== MPIN_LENGTH) throw new Error(`The MPIN must be ${MPIN_LENGTH} digits.`);

  await Promise.all([
    SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credentials)),
    SecureStore.setItemAsync(MPIN_KEY, mpin),
    SecureStore.setItemAsync(BIOMETRIC_KEY, useBiometric ? "1" : "0"),
    SecureStore.deleteItemAsync(ATTEMPTS_KEY),
  ]);
}

export type UnlockResult =
  | { ok: true; credentials: StoredCredentials }
  | { ok: false; message: string; attemptsLeft: number; forgotten: boolean };

export async function verifyMpin(mpin: string): Promise<UnlockResult> {
  const [stored, credentials] = await Promise.all([
    SecureStore.getItemAsync(MPIN_KEY),
    readCredentials(),
  ]);

  if (!stored || !credentials) {
    await forget();
    return { ok: false, message: "Quick sign-in is not set up.", attemptsLeft: 0, forgotten: true };
  }

  if (mpin === stored) {
    await SecureStore.deleteItemAsync(ATTEMPTS_KEY);
    return { ok: true, credentials };
  }

  const used = Number((await SecureStore.getItemAsync(ATTEMPTS_KEY)) ?? 0) + 1;
  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - used);

  if (attemptsLeft === 0) {
    await forget();
    return {
      ok: false,
      message: "Too many wrong attempts. Sign in with your password to set up a new MPIN.",
      attemptsLeft: 0,
      forgotten: true,
    };
  }

  await SecureStore.setItemAsync(ATTEMPTS_KEY, String(used));
  return {
    ok: false,
    message: `Wrong MPIN — ${attemptsLeft} ${attemptsLeft === 1 ? "try" : "tries"} left.`,
    attemptsLeft,
    forgotten: false,
  };
}

export async function unlockWithBiometrics(promptMessage: string): Promise<UnlockResult> {
  const credentials = await readCredentials();
  if (!credentials) {
    await forget();
    return { ok: false, message: "Quick sign-in is not set up.", attemptsLeft: 0, forgotten: true };
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: "Use MPIN",
    // Leave the device passcode available: a guard with a cut thumb should be
    // able to fall back rather than be locked out of their own shift.
    disableDeviceFallback: false,
  });

  if (result.success) return { ok: true, credentials };

  // A biometric refusal costs no MPIN attempt — the two are separate gates, and
  // a failed face scan must not spend a try the owner may need.
  const state = await getUnlockState();
  return {
    ok: false,
    message: result.error === "user_cancel" ? "" : "Could not read that. Use your MPIN.",
    attemptsLeft: state.attemptsLeft,
    forgotten: false,
  };
}

/** Erases the enrolment. Used on sign-out-as-someone-else and on lockout. */
export async function forget(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(CREDENTIALS_KEY),
    SecureStore.deleteItemAsync(MPIN_KEY),
    SecureStore.deleteItemAsync(BIOMETRIC_KEY),
    SecureStore.deleteItemAsync(ATTEMPTS_KEY),
  ]);
}

async function readCredentials(): Promise<StoredCredentials | null> {
  try {
    const raw = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCredentials;
    return parsed?.identifier && parsed?.password ? parsed : null;
  } catch {
    // Unreadable storage means no quick sign-in, not a broken app.
    return null;
  }
}
