import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { AlertButton } from 'react-native';

type AlertType = 'success' | 'error' | 'info';

interface AlertState {
  isVisible: boolean;
  title: string;
  message: string;
  type: AlertType;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (title: string, message: string, buttons?: AlertButton[], type?: AlertType) => void;
  hideAlert: () => void;
  alertState: AlertState;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alertState, setAlertState] = useState<AlertState>({
    isVisible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
  });

  const showAlert = useCallback((title: string, message: string, buttons?: AlertButton[], type: AlertType = 'info') => {
    setAlertState({ isVisible: true, title, message, type, buttons });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState((prevState) => ({ ...prevState, isVisible: false }));
  }, []);

  return <AlertContext.Provider value={{ showAlert, hideAlert, alertState }}>{children}</AlertContext.Provider>;
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};