import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material';
import { ThemeSelector } from './themeSelector';
import { TokenSuggestionPreference } from './tokenSuggestionPreference';
import React, { useContext, useState } from 'react';
import { AppContext, THEME_PREFERENCE } from '../../App';
import { Settings } from '@mui/icons-material';

/**
 * Props for {@link PreferencesDialog}
 */
export interface PreferencesDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
  preferredTheme: THEME_PREFERENCE;
  setPreferredTheme: React.Dispatch<React.SetStateAction<THEME_PREFERENCE>>;
}

/**
 * Preferences Dialog for editing application-wide preferences
 * @param isOpen whether the dialog is being shown
 * @param onClose function to invoke to close the dialog
 * @param preferredTheme from {@link App}
 * @param setPreferredTheme from {@link App}
 */
export const PreferencesDialog = ({
  isOpen,
  onClose,
  preferredTheme,
  setPreferredTheme,
}: PreferencesDialogProps) => {
  const { features, setFeatures } = useContext(AppContext);

  return (
    <Dialog open={!!isOpen} onClose={onClose}>
      <DialogTitle>Preferences</DialogTitle>
      <DialogContent
        sx={{
          minWidth: 400,
        }}
      >
        <Stack direction={'column'}>
          <ThemeSelector
            sx={{ width: '400px' }}
            preferredTheme={preferredTheme}
            setPreferredTheme={setPreferredTheme}
          />
          <TokenSuggestionPreference
            sx={{ width: '400px' }}
            tokenSuggestionEnabled={features.enableTokenSuggestions}
            setTokenSuggestionsEnabled={(suggestionsEnabled: boolean) => {
              setFeatures((featurePrefs) => ({
                ...featurePrefs,
                enableTokenSuggestions: suggestionsEnabled,
              }));
            }}
          />
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Temporary component for displaying the Preferences Dialog before the menu item is added
 * @param preferredTheme from {@link App}
 * @param setPreferredTheme from {@link App}
 */
export const PreferencesButton = ({
  preferredTheme,
  setPreferredTheme,
}: {
  preferredTheme: THEME_PREFERENCE;
  setPreferredTheme: React.Dispatch<React.SetStateAction<THEME_PREFERENCE>>;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Settings />
      </Button>
      <PreferencesDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        preferredTheme={preferredTheme}
        setPreferredTheme={setPreferredTheme}
      />
    </>
  );
};
