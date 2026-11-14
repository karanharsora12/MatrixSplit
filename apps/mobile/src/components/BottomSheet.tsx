import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableWithoutFeedback,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useWatermelonTheme } from '@/theme/ThemeContext';

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
                  borderTopWidth: 1,
                  borderTopColor: theme.border,
                },
              ]}
            >
              <View style={styles.handleContainer}>
                <View
                  style={[
                    styles.handle,
                    {
                      backgroundColor: theme.border,
                      borderRadius: borderRadius.full,
                    },
                  ]}
                />
              </View>

              {title && (
                <View
                  style={[
                    styles.header,
                    {
                      borderBottomColor: theme.divider,
                      paddingHorizontal: spacing.lg,
                      paddingBottom: spacing.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.title,
                      {
                        color: theme.text,
                        fontSize: typography.fontSize.lg,
                        fontWeight: typography.fontWeight.bold,
                      },
                    ]}
                  >
                    {title}
                  </Text>
                  <Pressable
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Text
                      style={[
                        styles.closeText,
                        {
                          color: theme.textMuted,
                          fontSize: typography.fontSize.sm,
                        },
                      ]}
                    >
                      Done
                    </Text>
                  </Pressable>
                </View>
              )}

              <View
                style={[
                  styles.body,
                  { paddingHorizontal: spacing.lg, paddingTop: spacing.base },
                  contentStyle,
                ]}
              >
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '85%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  title: {},
  closeText: {
    fontWeight: '600',
  },
  body: {},
});
