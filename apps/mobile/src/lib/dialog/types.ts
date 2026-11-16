export type DialogType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export type DialogButtonStyle = 'default' | 'cancel' | 'destructive';

export interface DialogButton {
  text: string;
  style?: DialogButtonStyle;
  onPress?: () => void | Promise<void>;
}

export interface DialogOptions {
  title: string;
  description?: string;
  type?: DialogType;
  buttons?: DialogButton[];
  dismissable?: boolean;
}

export interface ConfirmDialogOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

