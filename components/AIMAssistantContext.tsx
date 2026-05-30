"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface AIMAssistantState {
  isOpen: boolean;
  isExpanded: boolean;
  setIsOpen: (v: boolean) => void;
  setIsExpanded: (v: boolean) => void;
  openExpanded: () => void;
  close: () => void;
}

const AIMAssistantContext = createContext<AIMAssistantState | null>(null);

export function AIMAssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const openExpanded = useCallback(() => {
    setIsOpen(true);
    setIsExpanded(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setIsExpanded(false);
  }, []);

  return (
    <AIMAssistantContext.Provider
      value={{
        isOpen,
        isExpanded,
        setIsOpen,
        setIsExpanded,
        openExpanded,
        close,
      }}
    >
      {children}
    </AIMAssistantContext.Provider>
  );
}

export function useAIMAssistant(): AIMAssistantState {
  const ctx = useContext(AIMAssistantContext);
  if (!ctx) {
    throw new Error(
      "useAIMAssistant must be used within an AIMAssistantProvider",
    );
  }
  return ctx;
}
