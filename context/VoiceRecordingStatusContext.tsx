"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type RecordingStatus =
  | "ready"
  | "recording"
  | "recorded"
  | "processing"
  | "completed"
  | "failed";

type RecordingStatusContextType = {
  status: RecordingStatus;
  setStatus: (status: RecordingStatus) => void;
  resetStatus: () => void;
};

const RecordingStatusContext = createContext<RecordingStatusContextType | null>(
  null,
);

export function RecordingStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<RecordingStatus>("ready");

  const value = useMemo(
    () => ({
      status,
      setStatus,
      resetStatus: () => setStatus("ready"),
    }),
    [status],
  );

  return (
    <RecordingStatusContext.Provider value={value}>
      {children}
    </RecordingStatusContext.Provider>
  );
}

export function useRecordingStatus() {
  const context = useContext(RecordingStatusContext);

  if (!context) {
    throw new Error(
      "useRecordingStatus must be used within RecordingStatusProvider",
    );
  }

  return context;
}
