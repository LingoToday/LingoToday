import { useRef } from 'react';
import { Toast } from '../components/ui/Toast';

// Simple toast hook for React Native
export interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

let toastCounter = 0;
const generateId = () => `toast-${++toastCounter}`;

export function useToast() {
  const toastRef = useRef<any>(null);

  const toast = (props: ToastProps) => {
    const id = props.id || generateId();
    
    // For React Native, we'll use a simple alert or a toast component
    // This is a simplified version - you might want to use a library like react-native-toast-message
    if (toastRef.current) {
      toastRef.current.show({
        id,
        title: props.title,
        description: props.description,
        variant: props.variant || 'default',
        duration: props.duration || 3000,
      });
    }

    return {
      id,
      dismiss: () => {
        if (toastRef.current) {
          toastRef.current.hide(id);
        }
      },
    };
  };

  const dismiss = (toastId?: string) => {
    if (toastRef.current) {
      toastRef.current.hide(toastId);
    }
  };

  return {
    toast,
    dismiss,
    toastRef,
  };
}