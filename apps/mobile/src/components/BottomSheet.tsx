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
                },
              ]}
              className="bg-card rounded-t-3xl border-t border-border shadow-2xl"
            >
              <View style={styles.handleContainer} className="items-center py-2.5">
                <View
                  style={[
                    styles.handle,
                    {
                      backgroundColor: theme.border,
                      borderRadius: borderRadius.full,
                    },
                  ]}
                  className="w-10 h-1 rounded-full bg-muted-foreground/30"
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
                  className="px-6 pb-2 border-b border-border"
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
                    className="text-lg font-bold text-foreground"
                  >
                    {title}
                  </Text>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text
                      style={[
                        styles.closeText,
                        {
                          color: theme.textMuted,
                          fontSize: typography.fontSize.sm,
                        },
                      ]}
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <View
                style={[
                  styles.body,
                  { paddingHorizontal: spacing.lg, paddingTop: spacing.base },
                  contentStyle,
                ]}
                className="px-6 pt-4"
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
