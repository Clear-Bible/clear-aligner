import { createContext, useState } from 'react';

/**
 * BusyDialog context props
 */
export interface BusyDialogContextProps {
  /**
   * this attribute is only intended to be read by the useBusyDialog component
   */
  isForceShowBusyDialog: boolean;
  /**
   * overrides the busy dialog state to pop it early
   */
  setForceShowBusyDialog: Function;
  /**
   * custom status for the busy dialog, which is cleared when the dialog closes
   */
  customStatus?: string;
  /**
   * sets a custom status for the busy dialog, which is cleared when the dialog closes
   */
  setCustomStatus: Function;
  /**
   * function called on dialog cancel, cleared when the dialog closes
   */
  onCancel?: CallableFunction;
  /**
   * sets the function to be run when the dialog is closed
   */
  setOnCancel: Function;
}

/**
 * Context for busy dialog display
 */
export const BusyDialogContext = createContext({} as BusyDialogContextProps);

/**
 * hook for creating the busy dialog context
 */
export const useBusyDialogContext = (): BusyDialogContextProps => {
  const [ isForceShowBusyDialog, setForceShowBusyDialog ] = useState<boolean>(false);
  const [ customStatus, setCustomStatus ] = useState<string|undefined>(undefined);
  const [ onCancel, setOnCancel ] = useState<CallableFunction|undefined>(undefined);

  return {
    isForceShowBusyDialog,
    setForceShowBusyDialog,
    customStatus,
    setCustomStatus,
    onCancel,
    setOnCancel
  };
}
