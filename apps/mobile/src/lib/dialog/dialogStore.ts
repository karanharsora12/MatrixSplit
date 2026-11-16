import { create } from 'zustand';
import {
  DialogOptions,
  DialogType,
  ConfirmDialogOptions,
  DialogButton,
} from './types';

interface DialogStoreState {
  isOpen: boolean;
  options: DialogOptions;
  activeResolver: ((value: boolean) => void) | null;
  show: (options: DialogOptions) => void;
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  hide: () => void;
}

function inferDialogType(options: DialogOptions): DialogType {
  if (options.type) return options.type;

  const lowerTitle = options.title.toLowerCase();
  const lowerDesc = (options.description || '').toLowerCase();
  const text = `${lowerTitle} ${lowerDesc}`;
  const hasDestructive = options.buttons?.some((b) => b.style === 'destructive');

  if (hasDestructive) return 'error';

  if (
    text.includes('success') ||
    text.includes('saved') ||
    text.includes('recorded') ||
    text.includes('sent') ||
    text.includes('verified')
  ) {
    return 'success';
  }

  if (
    text.includes('error') ||
    text.includes('failed') ||
    text.includes('delete') ||
    text.includes('logout')
  ) {
    return 'error';
  }

  if (
    text.includes('required') ||
    text.includes('mismatch') ||
    text.includes('invalid') ||
    text.includes('incomplete') ||
    text.includes('warning')
  ) {
    return 'warning';
  }

  if (options.buttons && options.buttons.length >= 2) {
    return 'confirm';
  }

  return 'info';
}

export const useDialogStore = create<DialogStoreState>((set, get) => ({
  isOpen: false,
  options: {
    title: '',
    buttons: [{ text: 'OK' }],
  },
  activeResolver: null,

  show: (options: DialogOptions) => {
    // Resolve any previous pending confirm
    const prevResolver = get().activeResolver;
    if (prevResolver) {
      prevResolver(false);
    }

    const type = inferDialogType(options);
    const buttons =
      options.buttons && options.buttons.length > 0
        ? options.buttons
        : [{ text: 'OK' }];

    set({
      isOpen: true,
      options: {
        ...options,
        type,
        buttons,
      },
      activeResolver: null,
    });
  },

  confirm: (options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      // Resolve any previous pending confirm
      const prevResolver = get().activeResolver;
      if (prevResolver) {
        prevResolver(false);
      }

      const buttons: DialogButton[] = [
        {
          text: options.cancelText || 'Cancel',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: options.confirmText || 'Confirm',
          style: options.destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ];

      set({
        isOpen: true,
        options: {
          title: options.title,
          description: options.description,
          type: options.destructive ? 'error' : 'confirm',
          buttons,
        },
        activeResolver: resolve,
      });
    });
  },

  hide: () => {
    const resolver = get().activeResolver;
    if (resolver) {
      resolver(false);
    }
    set({
      isOpen: false,
      activeResolver: null,
    });
  },
}));

export const dialog = {
  show: (options: DialogOptions) => {
    useDialogStore.getState().show(options);
  },

  confirm: (options: ConfirmDialogOptions): Promise<boolean> => {
    return useDialogStore.getState().confirm(options);
  },

  alert: (
    title: string,
    description?: string,
    buttons?: DialogButton[],
    type?: DialogType
  ) => {
    useDialogStore.getState().show({
      title,
      description,
      buttons,
      type,
    });
  },

  success: (title: string, description?: string, onOk?: () => void) => {
    useDialogStore.getState().show({
      title,
      description,
      type: 'success',
      buttons: [{ text: 'OK', onPress: onOk }],
    });
  },

  error: (title: string, description?: string, onOk?: () => void) => {
    useDialogStore.getState().show({
      title,
      description,
      type: 'error',
      buttons: [{ text: 'OK', onPress: onOk }],
    });
  },

  warning: (title: string, description?: string, onOk?: () => void) => {
    useDialogStore.getState().show({
      title,
      description,
      type: 'warning',
      buttons: [{ text: 'OK', onPress: onOk }],
    });
  },

  info: (title: string, description?: string, onOk?: () => void) => {
    useDialogStore.getState().show({
      title,
      description,
      type: 'info',
      buttons: [{ text: 'OK', onPress: onOk }],
    });
  },

  hide: () => {
    useDialogStore.getState().hide();
  },
};

