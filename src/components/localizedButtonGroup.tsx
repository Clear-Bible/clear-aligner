import { ButtonGroup, ButtonGroupProps, Theme } from '@mui/material';
import { LanguageInfo, TextDirection } from '../structs';
import { useMemo } from 'react';
import { SxProps } from '@mui/system';

/**
 * props for {@link LocalizedButtonGroup}
 */
export interface LocalizedButtonGroupProps extends ButtonGroupProps {
  languageInfo?: LanguageInfo;
}

const outsideCornerRadius = '4px';
const dividerBorderRadius = 0;
const outsideEdgeStyle = 'solid';
const dividingEdgeStyle = 'dashed';
const baseGroupedButtonSx: SxProps<Theme> = ({
  borderTopStyle: outsideEdgeStyle,
  borderBottomStyle: outsideEdgeStyle
});

/**
 * component to display buttons with localization awareness (things like LTR, RTL display, font choices, etc.)
 * @param languageInfo language information used for the button group
 * @param sx style information
 * @param children buttons in the button group
 * @param fillWidth
 * @param others any other parameters normally applied to a material UI {@link ButtonGroup}
 */
export const LocalizedButtonGroup = ({
                                       languageInfo,
                                       sx,
                                       children,
                                       ...others
                                     }: LocalizedButtonGroupProps) => {

  const firstButtonSx = useMemo<SxProps<Theme>>(() => {
    if (languageInfo?.textDirection === TextDirection.RTL) {
      return {
        ...baseGroupedButtonSx,
        borderTopRightRadius: outsideCornerRadius,
        borderBottomRightRadius: outsideCornerRadius,
        borderRightStyle: outsideEdgeStyle,
        borderTopLeftRadius: dividerBorderRadius,
        borderBottomLeftRadius: dividerBorderRadius,
        borderLeftStyle: dividingEdgeStyle
      };
    } else { // LTR
      return {
        ...baseGroupedButtonSx,
        borderTopLeftRadius: outsideCornerRadius,
        borderBottomLeftRadius: outsideCornerRadius,
        borderLeftStyle: outsideEdgeStyle,
        borderRightStyle: dividingEdgeStyle,
        borderTopRightRadius: dividerBorderRadius,
        borderBottomRightRadius: dividerBorderRadius
      };
    }
  }, [languageInfo?.textDirection]);

  const middleButtonSx = useMemo<SxProps<Theme>>(() => ({
    ...baseGroupedButtonSx,
    borderLeftStyle: dividingEdgeStyle,
    borderRightStyle: dividingEdgeStyle
  }), []);

  const lastButtonSx = useMemo<SxProps<Theme>>(() => {
    if (languageInfo?.textDirection === TextDirection.RTL) {
      return {
        ...baseGroupedButtonSx,
        borderRightStyle: dividingEdgeStyle,
        borderTopRightRadius: dividerBorderRadius,
        borderBottomRightRadius: dividerBorderRadius,
        borderTopLeftRadius: outsideCornerRadius,
        borderBottomLeftRadius: outsideCornerRadius,
        borderLeftStyle: outsideEdgeStyle
      };
    } else {
      return {
        ...baseGroupedButtonSx,
        borderLeftStyle: dividingEdgeStyle,
        borderTopLeftRadius: dividerBorderRadius,
        borderBottomLeftRadius: dividerBorderRadius,
        borderTopRightRadius: outsideCornerRadius,
        borderBottomRightRadius: outsideCornerRadius,
        borderRightStyle: outsideEdgeStyle
      };
    }
  }, [languageInfo?.textDirection]);

  const sxProp = useMemo<SxProps<Theme>>(() => {
    return {
      ...(sx ?? {}),
      direction: languageInfo?.textDirection ?? TextDirection.LTR,
      ...(!!languageInfo?.fontFamily ? {
        fontFamily: languageInfo?.fontFamily
      } : {}),
      margin: '1px',
      '.MuiButtonGroup-grouped': {
        paddingX: '4px !important',
        minWidth: '12px !important',
        ...((sx as any | undefined)?.['.MuiButtonGroup-grouped'] ?? {})
      },
      '.MuiButtonGroup-firstButton': firstButtonSx,
      '.MuiButtonGroup-middleButton': middleButtonSx,
      '.MuiButtonGroup-lastButton': lastButtonSx
    };
  }, [sx, languageInfo?.textDirection, languageInfo?.fontFamily, firstButtonSx, middleButtonSx, lastButtonSx]);

  return (
    <ButtonGroup
      sx={sxProp}
      dir={languageInfo?.textDirection ?? TextDirection.LTR}
      {...others}>
      {children}
    </ButtonGroup>
  );
};
