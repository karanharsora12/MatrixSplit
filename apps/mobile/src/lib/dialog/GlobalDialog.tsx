import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { useDialogStore } from './dialogStore';
import { useWatermelonTheme } from '@/theme';
import { cn } from '@/lib/utils';
import { DialogButton, DialogType } from './types';

const iconConfigMap: Record<
  DialogType,
  {
    name: keyof typeof Ionicons.glyphMap;
    color: string;
    bgClass: string;
  }
> = {
  success: {
    name: 'checkmark-circle',
    color: '#10B981',
    bgClass: 'bg-emerald-500/15 border-emerald-500/30',
  },
  error: {
    name: 'alert-circle',
    color: '#F43F5E',
    bgClass: 'bg-rose-500/15 border-rose-500/30',
  },
  warning: {
    name: 'warning-outline',
    color: '#F59E0B',
    bgClass: 'bg-amber-500/15 border-amber-500/30',
  },
  confirm: {
    name: 'help-circle-outline',
    color: '#10B981',
    bgClass: 'bg-emerald-500/15 border-emerald-500/30',
  },
  info: {
    name: 'information-circle-outline',
    color: '#3B82F6',
    bgClass: 'bg-blue-500/15 border-blue-500/30',
  },
};

export function GlobalDialog() {
  const { isOpen, options, hide } = useDialogStore();
  const { isDark } = useWatermelonTheme();

  if (!isOpen) return null;

  const type = options.type || 'info';
  const iconConfig = iconConfigMap[type] || iconConfigMap.info;
  const buttons = options.buttons || [{ text: 'OK' }];

  const handleButtonPress = async (btn: DialogButton) => {
    hide();
    if (btn.onPress) {
      try {
        await btn.onPress();
      } catch (err) {
        console.error('[GlobalDialog] Error in button callback:', err);
      }
    }
  };

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) hide();
      }}
    >
      <AlertDialogContent
        className={cn(
          'w-[90%] max-w-[340px] p-6 rounded-3xl border shadow-2xl items-center self-center',
          isDark
            ? 'bg-[#141D2E] border-[#23324D]'
            : 'bg-white border-slate-200 shadow-slate-900/10'
        )}
      >
        {/* Visual Alert Icon Badge */}
        <View
          className={cn(
            'w-14 h-14 rounded-2xl border items-center justify-center mb-3',
            iconConfig.bgClass
          )}
        >
          <Ionicons
            name={iconConfig.name}
            size={28}
            color={iconConfig.color}
          />
        </View>

        <AlertDialogHeader className="items-center w-full">
          <AlertDialogTitle
            className={cn(
              'text-lg font-extrabold text-center tracking-tight mb-1',
              isDark ? 'text-white' : 'text-slate-900'
            )}
          >
            {options.title}
          </AlertDialogTitle>
          {options.description ? (
            <AlertDialogDescription className="text-xs text-slate-400 text-center leading-5 px-1">
              {options.description}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter className="w-full mt-4">
          {buttons.length === 1 ? (
            <AlertDialogAction
              onPress={() => handleButtonPress(buttons[0])}
              className="w-full h-11 rounded-2xl bg-emerald-500 items-center justify-center active:scale-[0.98] shadow-sm border-0"
            >
              <Text className="text-xs font-bold text-white">
                {buttons[0].text}
              </Text>
            </AlertDialogAction>
          ) : buttons.length === 2 ? (
            <View className="flex-row gap-2.5 w-full">
              {buttons.map((btn, idx) => {
                const isDestructive = btn.style === 'destructive';
                const isCancel = btn.style === 'cancel' || idx === 0;

                if (isCancel) {
                  return (
                    <AlertDialogCancel
                      key={btn.text}
                      onPress={() => handleButtonPress(btn)}
                      className={cn(
                        'flex-1 h-11 rounded-2xl items-center justify-center active:scale-[0.98] border',
                        isDark
                          ? 'bg-[#090D16] border-[#23324D]'
                          : 'bg-slate-100 border-slate-200'
                      )}
                    >
                      <Text
                        className={cn(
                          'text-xs font-bold',
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        )}
                      >
                        {btn.text}
                      </Text>
                    </AlertDialogCancel>
                  );
                }

                return (
                  <AlertDialogAction
                    key={btn.text}
                    onPress={() => handleButtonPress(btn)}
                    className={cn(
                      'flex-1 h-11 rounded-2xl items-center justify-center active:scale-[0.98] shadow-sm border-0',
                      isDestructive ? 'bg-rose-500' : 'bg-emerald-500'
                    )}
                  >
                    <Text className="text-xs font-bold text-white">
                      {btn.text}
                    </Text>
                  </AlertDialogAction>
                );
              })}
            </View>
          ) : (
            <View className="w-full gap-2">
              {buttons.map((btn) => (
                <AlertDialogAction
                  key={btn.text}
                  onPress={() => handleButtonPress(btn)}
                  className={cn(
                    'w-full h-11 rounded-2xl items-center justify-center active:scale-[0.98]',
                    btn.style === 'destructive'
                      ? 'bg-rose-500'
                      : btn.style === 'cancel'
                      ? isDark
                        ? 'bg-[#090D16] border border-[#23324D]'
                        : 'bg-slate-100 border border-slate-200'
                      : 'bg-emerald-500'
                  )}
                >
                  <Text
                    className={cn(
                      'text-xs font-bold',
                      btn.style === 'destructive' || btn.style !== 'cancel'
                        ? 'text-white'
                        : isDark
                        ? 'text-slate-300'
                        : 'text-slate-700'
                    )}
                  >
                    {btn.text}
                  </Text>
                </AlertDialogAction>
              ))}
            </View>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

