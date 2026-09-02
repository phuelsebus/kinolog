import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Swipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { radius, spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/colors';

export interface SwipeableRowProps {
  children: ReactNode;
  onDelete: () => void;
  confirmTitle: string;
  confirmMessage: string;
}

/**
 * Wisch-nach-links-Loeschen (heute uebliches Listen-Muster) mit
 * Bestaetigungs-Popup, bevor onDelete tatsaechlich ausgefuehrt wird -
 * verhindert versehentliches Loeschen direkt beim Wischen.
 *
 * Bewusst ein eigenes Modal statt Alert.alert: Alert zeigt auf Web
 * (react-native-web, hier fuer den schnellen Test-Loop genutzt) Buttons
 * nicht zuverlaessig an.
 */
export default function SwipeableRow({ children, onDelete, confirmTitle, confirmMessage }: SwipeableRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const swipeableRef = useRef<SwipeableMethods>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  function handleCancel() {
    setConfirmVisible(false);
    swipeableRef.current?.close();
  }

  function handleConfirm() {
    setConfirmVisible(false);
    swipeableRef.current?.close();
    onDelete();
  }

  return (
    <>
      <Swipeable
        ref={swipeableRef}
        overshootRight={false}
        renderRightActions={() => (
          <Pressable style={styles.deleteAction} onPress={() => setConfirmVisible(true)}>
            <Ionicons name="trash-outline" size={22} color={colors.accentText} />
          </Pressable>
        )}
      >
        {children}
      </Swipeable>

      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={handleCancel}>
        <Pressable style={styles.backdrop} onPress={handleCancel}>
          <Pressable style={styles.dialog} onPress={() => {}}>
            <Text style={styles.dialogTitle}>{confirmTitle}</Text>
            <Text style={styles.dialogMessage}>{confirmMessage}</Text>
            <View style={styles.dialogActions}>
              <Pressable style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Abbrechen</Text>
              </Pressable>
              <Pressable style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>Löschen</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    deleteAction: {
      backgroundColor: colors.error,
      justifyContent: 'center',
      alignItems: 'center',
      width: 76,
      borderRadius: radius.lg,
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    dialog: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      width: '100%',
      maxWidth: 340,
      gap: spacing.sm,
    },
    dialogTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
    dialogMessage: { color: colors.textSecondary, marginBottom: spacing.sm },
    dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
    cancelButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    cancelButtonText: { color: colors.textSecondary, fontWeight: '600' },
    confirmButton: {
      backgroundColor: colors.error,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    confirmButtonText: { color: colors.accentText, fontWeight: '600' },
  });
}
