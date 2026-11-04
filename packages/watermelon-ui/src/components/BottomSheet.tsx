import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useWatermelonTheme } from '../theme/ThemeContext';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  contentStyle,
}) => {
  const { theme, borderRadius, typography, spacing, shadows } = useWatermelonTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e: any) => e?.stopPropagation?.()}>
            <View
              style={[
                styles.sheetContainer,
                shadows.floating,
                {
                  backgroundColor: theme.card,
                  borderTopLeftRadius: borderRadius.xl,
                  borderTopRightRadius: borderRadius.xl,
                  paddingBottom: spacing['2xl'],
                },
                contentStyle,
              ]}
            >
              {/* Drag Indicator */}
              <View style={styles.dragHandleContainer}>
                <View
                  style={[
                    styles.dragHandle,
                    { backgroundColor: theme.border, borderRadius: borderRadius.full },
                  ]}
                />
              </View>

              {title && (
                <View style={[styles.header, { borderBottomColor: theme.divider }]}>
                  <Text
                    style={[
                      styles.title,
                      { color: theme.text, fontSize: typography.fontSize.lg },
                    ]}
                  >
                    {title}
                  </Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <Text
                      style={{
                        color: theme.textMuted,
                        fontSize: typography.fontSize.base,
                        fontWeight: '600',
                      }}
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.md }}>
                {children}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)', // subtle dark backdrop
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '85%',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 36,
    height: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
});
