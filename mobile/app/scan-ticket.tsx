import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../src/lib/supabase";
import { uploadTicketImage } from "../src/lib/ticketImages";
import {
  openAiTicketScanner,
  TicketScanLimitError,
  type ScanHandoff,
} from "../src/services/TicketScanner";
import { radius, spacing } from "../src/theme/spacing";
import { useTheme } from "../src/theme/ThemeContext";
import type { ThemeColors } from "../src/theme/colors";

// Rein kosmetisch, rotiert waehrend der Analyse durch - passend zum
// Kino-Thema, damit das Warten (Upload + KI-Aufruf) weniger nach
// "haengt sich auf" aussieht.
const FUN_LOADING_MESSAGES = [
  "Ticket wird analysiert...",
  "Filmrolle wird eingelegt...",
  "Der Projektor wird warmgefahren...",
  "Popcorn wird nachbestellt...",
  "Vorhang wird geöffnet...",
  "Post-Credit-Szene wird geladen...",
  "3D-Brille wird poliert...",
  "Bitte Handy stummschalten...",
  "Der beste Sitzplatz wird reserviert...",
];

// Ticket-Scan-Einstiegspunkt (idee.md Abschnitt 2/3/4): Foto per Kamera oder
// aus der Galerie (deckt auch "Screenshot importieren" ab) -> Upload in den
// privaten ticket-images Bucket -> KI-Analyse via ticket-scan Edge Function.
// Das Ergebnis wird als "scan"-Param an search-movie.tsx weitergereicht, wo
// der Nutzer den erkannten Film bestaetigt/korrigiert (idee.md Abschnitt 7).
export default function ScanTicketScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  useEffect(() => {
    if (!analyzing) {
      setLoadingMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMessageIndex((i) => (i + 1) % FUN_LOADING_MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [analyzing]);

  async function pickFromCamera() {
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError(
        "Kamerazugriff wurde nicht erlaubt. Bitte in den Geräteeinstellungen aktivieren.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function pickFromLibrary() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(
        "Zugriff auf Fotos wurde nicht erlaubt. Bitte in den Geräteeinstellungen aktivieren.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleAnalyze() {
    if (!imageUri) return;
    setAnalyzing(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet.");

      const imagePath = await uploadTicketImage(user.id, imageUri);
      const extraction = await openAiTicketScanner.extractTicketData(imagePath);
      const handoff: ScanHandoff = { ...extraction, imagePath };

      router.push({
        pathname: "/search-movie",
        params: { scan: JSON.stringify(handoff) },
      });
    } catch (err) {
      console.error("Ticket-Analyse fehlgeschlagen:", err);
      if (err instanceof TicketScanLimitError) {
        setError(err.message);
      } else {
        setError(
          "Ticket konnte nicht analysiert werden. Bitte versuche es erneut.",
        );
      }
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <View style={styles.container}>
      {analyzing ? (
        <View style={styles.analyzingOverlay}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.analyzingText}>{FUN_LOADING_MESSAGES[loadingMessageIndex]}</Text>
        </View>
      ) : null}

      {imageUri ? (
        <>
          <Image
            source={{ uri: imageUri }}
            style={styles.preview}
            resizeMode="contain"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
            onPress={handleAnalyze}
            disabled={analyzing}
          >
            <Text style={styles.primaryButtonText}>Ticket analysieren</Text>
          </Pressable>

          <Pressable onPress={() => setImageUri(null)} disabled={analyzing}>
            <Text style={styles.secondaryLink}>Anderes Foto wählen</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Ionicons
            name="camera-outline"
            size={40}
            color={colors.textSecondary}
            style={styles.icon}
          />
          <Text style={styles.title}>Kinoticket scannen</Text>
          <Text style={styles.subtitle}>
            Fotografiere dein Ticket oder wähle ein vorhandenes Foto/Screenshot
            - Film, Datum, Kino und mehr werden automatisch erkannt.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
            onPress={pickFromCamera}
          >
            <Ionicons name="camera" size={18} color={colors.accentText} />
            <Text style={styles.primaryButtonText}>Kamera</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}
            onPress={pickFromLibrary}
          >
            <Ionicons name="images-outline" size={18} color={colors.accent} />
            <Text style={styles.secondaryButtonText}>Aus Galerie wählen</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.xl,
      gap: spacing.md,
      backgroundColor: colors.background,
      alignItems: "stretch",
    },
    icon: {
      alignSelf: "center",
      marginTop: spacing.xxl,
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      textAlign: "center",
      color: colors.textPrimary,
    },
    subtitle: {
      textAlign: "center",
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    preview: {
      width: "100%",
      height: 320,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceAlt,
      marginBottom: spacing.md,
    },
    hint: {
      textAlign: "center",
      color: colors.textSecondary,
      marginTop: -spacing.sm,
    },
    analyzingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    },
    analyzingText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
      marginTop: spacing.md,
    },
    error: { color: colors.error, textAlign: "center" },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
    },
    primaryButtonPressed: { opacity: 0.85 },
    primaryButtonText: {
      color: colors.accentText,
      fontSize: 16,
      fontWeight: "600",
    },
    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
    },
    secondaryButtonPressed: { opacity: 0.75 },
    secondaryButtonText: {
      color: colors.accent,
      fontSize: 16,
      fontWeight: "600",
    },
    secondaryLink: {
      textAlign: "center",
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
  });
}
