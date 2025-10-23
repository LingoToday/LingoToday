import React, { createContext, useContext, useState, useCallback } from 'react';

interface SheetControl {
  dismiss: () => void;
}

interface SheetManagerContextValue {
  activeSheetId: string | null;
  openSheet: (id: string, control: SheetControl) => void;
  dismissSheet: (id: string) => void;
  dismissAllSheets: () => Promise<void>;
}

const SheetManagerContext = createContext<SheetManagerContextValue | undefined>(undefined);

export function SheetManagerProvider({ children }: { children: React.ReactNode }) {
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [sheetControls, setSheetControls] = useState<Map<string, SheetControl>>(new Map());

  const openSheet = useCallback((id: string, control: SheetControl) => {
    setSheetControls(prev => {
      const currentActiveId = Array.from(prev.keys())[0];
      if (currentActiveId && currentActiveId !== id) {
        const currentControl = prev.get(currentActiveId);
        currentControl?.dismiss();
      }
      
      const newMap = new Map();
      newMap.set(id, control);
      return newMap;
    });
    setActiveSheetId(id);
  }, []);

  const dismissSheet = useCallback((id: string) => {
    setSheetControls(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
    setActiveSheetId(prev => prev === id ? null : prev);
  }, []);

  const dismissAllSheets = useCallback(async () => {
    return new Promise<void>((resolve) => {
      setSheetControls(prev => {
        prev.forEach(control => control.dismiss());
        return new Map();
      });
      setActiveSheetId(null);
      
      setTimeout(resolve, 300);
    });
  }, []);

  return (
    <SheetManagerContext.Provider value={{ activeSheetId, openSheet, dismissSheet, dismissAllSheets }}>
      {children}
    </SheetManagerContext.Provider>
  );
}

export function useSheetManager() {
  const context = useContext(SheetManagerContext);
  if (!context) {
    throw new Error('useSheetManager must be used within SheetManagerProvider');
  }
  return context;
}
