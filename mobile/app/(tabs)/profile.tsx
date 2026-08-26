import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { getAvatarSignedUrl, uploadAvatarImage } from '../../src/lib/avatarImages';
import { profileService } from '../../src/services/ProfileService';
import { radius, spacing } from '../../src/theme/spacing';
import { useTheme } from '../../src/theme/ThemeContext';
import type { ThemeColors } from '../../src/theme/colors';

export default function ProfileScreen() {
  const { session, signOut, deleteAccount } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const email = session?.user.email ?? 'Unbekannt';
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarSignedUrl, setAvatarSignedUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user.id) return;
    profileService
      .getProfile(session.user.id)
      .then((profile) => {
        setDisplayName(profile.displayName);
        setAvatarPath(profile.avatarUrl);
      })
      .catch(() => {
        setDisplayName(null);
        setAvatarPath(null);
      });
  }, [session?.user.id]);

  useEffect(() => {
    if (!avatarPath) {
      setAvatarSignedUrl(null);
      return;
    }
    getAvatarSignedUrl(avatarPath)
      .then(setAvatarSignedUrl)
      .catch(() => setAvatarSignedUrl(null));
  }, [avatarPath]);

  async function handleChangeAvatar() {
    if (!session?.user.id) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    // Bewusst ohne allowsEditing/aspect: der native Android-Cropper liefert
    // dabei manchmal eine noch nicht fertig geschriebene Datei zurueck
    // (bekanntes expo-image-picker-Problem) - der runde Avatar-Container
    // schneidet das Bild stattdessen rein visuell passend zu (resizeMode
    // "cover"), gleiches robustes Muster wie beim Ticket-Scan.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingAvatar(true);
    try {
      const path = await uploadAvatarImage(session.user.id, result.assets[0].uri);
      await profileService.updateAvatarUrl(session.user.id, path);
      setAvatarPath(path);
      // Der Storage-Pfad bleibt beim erneuten Hochladen immer gleich (fixer
      // Dateiname, siehe uploadAvatarImage) - der obige setAvatarPath allein
      // wuerde den useEffect nicht erneut auslösen, da sich der Wert nicht
      // aendert. Deshalb hier explizit eine frische signierte URL holen,
      // damit das neue Bild sofort angezeigt wird statt der alten Version.
      setAvatarSignedUrl(await getAvatarSignedUrl(path));
    } catch (err) {
      console.error('Profilbild-Upload fehlgeschlagen:', err);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    setDeleteError(null);
    const { error } = await deleteAccount();
    if (error) {
      setDeleteError('Konto konnte nicht gelöscht werden. Bitte versuche es erneut.');
      setDeletingAccount(false);
      setConfirmingDelete(false);
      return;
    }
    router.replace('/(auth)/login');
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Pressable
          style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
          onPress={handleChangeAvatar}
          disabled={uploadingAvatar}
        >
          {uploadingAvatar ? (
            <ActivityIndicator color={colors.accent} />
          ) : avatarSignedUrl ? (
            <Image source={{ uri: avatarSignedUrl }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Ionicons name="person" size={28} color={colors.accent} />
          )}
        </Pressable>
        {displayName ? <Text style={styles.name}>{displayName}</Text> : null}
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Rechtliches</Text>

        <Pressable style={({ pressed }) => [styles.legalRow, pressed && styles.legalRowPressed]} onPress={() => router.push('/legal/imprint')}>
          <Text style={styles.legalRowText}>Impressum</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
        <Pressable style={({ pressed }) => [styles.legalRow, pressed && styles.legalRowPressed]} onPress={() => router.push('/legal/privacy')}>
          <Text style={styles.legalRowText}>Datenschutz</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <Text style={styles.tmdbNotice}>
          Filmdaten von TMDB. Dieses Produkt verwendet die TMDB API, wird aber nicht von TMDB gebilligt oder
          zertifiziert.{' '}
          <Text style={styles.tmdbLink} onPress={() => Linking.openURL('https://www.themoviedb.org/')}>
            themoviedb.org
          </Text>
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.signOutButton, pressed && styles.signOutButtonPressed]}
        onPress={handleSignOut}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.error} />
        <Text style={styles.signOutText}>Abmelden</Text>
      </Pressable>

      <View style={styles.dangerZone}>
        {deleteError ? <Text style={styles.deleteErrorText}>{deleteError}</Text> : null}
        {confirmingDelete ? (
          <View style={styles.confirmDeleteRow}>
            <Text style={styles.confirmDeleteText}>
              Konto und alle Kinobesuche unwiderruflich löschen?
            </Text>
            <Pressable
              style={({ pressed }) => [styles.deleteConfirmButton, pressed && styles.deleteConfirmButtonPressed]}
              onPress={handleDeleteAccount}
              disabled={deletingAccount}
            >
              {deletingAccount ? (
                <ActivityIndicator color={colors.accentText} />
              ) : (
                <Text style={styles.deleteConfirmButtonText}>Ja, endgültig löschen</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setConfirmingDelete(false)} disabled={deletingAccount}>
              <Text style={styles.cancelDeleteText}>Abbrechen</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.deleteAccountButton} onPress={() => setConfirmingDelete(true)}>
            <Text style={styles.deleteAccountText}>Konto löschen</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, padding: spacing.lg, gap: spacing.lg, backgroundColor: colors.background },
    card: {
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.xl,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
      overflow: 'hidden',
      position: 'relative',
    },
    avatarPressed: { opacity: 0.8 },
    avatarImage: { width: '100%', height: '100%' },
    name: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
    email: { color: colors.textSecondary },
    section: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    sectionLabel: { fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs },
    legalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    legalRowPressed: { opacity: 0.6 },
    legalRowText: { color: colors.textPrimary, fontSize: 15 },
    tmdbNotice: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.sm, lineHeight: 17 },
    tmdbLink: { color: colors.accent },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      marginTop: 'auto',
    },
    signOutButtonPressed: { opacity: 0.75 },
    signOutText: { color: colors.error, fontWeight: '600' },
    dangerZone: { alignItems: 'center', gap: spacing.sm },
    deleteAccountButton: { paddingVertical: spacing.xs },
    deleteAccountText: { color: colors.textSecondary, fontSize: 13, textDecorationLine: 'underline' },
    deleteErrorText: { color: colors.error, fontSize: 13, textAlign: 'center' },
    confirmDeleteRow: { alignItems: 'center', gap: spacing.sm },
    confirmDeleteText: { color: colors.error, fontSize: 13, textAlign: 'center' },
    deleteConfirmButton: {
      backgroundColor: colors.error,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      minWidth: 160,
      alignItems: 'center',
    },
    deleteConfirmButtonPressed: { opacity: 0.85 },
    deleteConfirmButtonText: { color: colors.accentText, fontWeight: '600' },
    cancelDeleteText: { color: colors.textSecondary },
  });
}
