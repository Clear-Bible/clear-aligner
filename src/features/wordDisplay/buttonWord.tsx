import { Corpus, LanguageInfo, LinkOriginManual, LinkStatus, RepositoryLink, TextDirection, Word } from '../../structs';
import React, { useMemo, useRef } from 'react';
import { Button, decomposeColor, Stack, SvgIconOwnProps, SxProps, Theme, Typography, useTheme } from '@mui/material';
import { LocalizedTextDisplay } from '../localizedTextDisplay';
import { LocalizedButtonGroup } from '../../components/localizedButtonGroup';
import { useAppDispatch, useAppSelector } from '../../app/index';
import { hover } from '../../state/textSegmentHover.slice';
import { Box } from '@mui/system';
import { toggleTextSegment } from '../../state/alignment.slice';
import { AutoAwesome, Cancel, CheckCircle, CommentOutlined, Flag, InsertLink, Lightbulb } from '@mui/icons-material';
import { LimitedToLinks } from '../corpus/verseDisplay';
import BCVWP from '../bcvwp/BCVWPSupport';
import { AlignmentSide } from '../../common/data/project/corpus';
import _ from 'lodash';
import useAlignmentStateContextMenu from '../../hooks/useAlignmentStateContextMenu';
import { useTokenSuggestionRelevancyScore } from '../../hooks/useSuggestions';
import { useLinkNotes } from '../linkNotes/useLinkNotes';

/**
 * top color of the machine alignment gradient
 */
const gradientTopColor = '#33D6FF';
/**
 * bottom color of the machine alignment gradient
 */
const gradientBottomColor = '#AD8CFF';

const defaultMargin = '12px';
const noMargin = '4px';

/**
 * Dimension for {@link ButtonToken} status and origin icons in the X and Y directions
 */
const iconSize = '12px';
/**
 * margin around icons
 */
const iconMargin = '2px';

/**
 * props for the {@link ButtonWord} component
 */
export interface ButtonWordProps extends LimitedToLinks {
  tokens?: Word[];
  /**
   * whether gloss should be displayed
   */
  enableGlossDisplay?: boolean;
  /**
   * link data
   */
  links?: Map<string, RepositoryLink[]>;
  corpus?: Corpus;
  suppressAfter?: boolean;
  disabled?: boolean;
  fillWidth?: boolean;
}

/**
 * Displays a word as a {@link LocalizedButtonGroup}
 * @param disabled if the word has input disabled
 * @param links links map to be displayed with this group of tokens
 * @param tokens tokens being displayed
 * @param corpus corpus for displayed tokens
 * @param enableGlossDisplay whether gloss display is toggled on
 * @param suppressAfter whether the after of tokens should be displayed or suppressed
 * @param disableHighlighting whether highlighting behavior is turned off, defaults to normal highlighting behavior
 * @param fillWidth
 */
export const ButtonWord = ({
                             disabled,
                             links,
                             tokens,
                             corpus,
                             enableGlossDisplay,
                             suppressAfter,
                             disableHighlighting,
                             fillWidth = false
                           }: ButtonWordProps) => {
  const { language: languageInfo } = useMemo(() => corpus ?? { language: undefined }, [corpus]);

  return (
    <LocalizedButtonGroup id={tokens?.[0]?.id}
                          disabled={disabled}
                          languageInfo={languageInfo}
                          sx={{
                            borderStyle: 'none',
                            ...(fillWidth ? { width: '100%' } : {}),
                            '.MuiButtonGroup-grouped': {
                              padding: '0px !important',
                              minWidth: '12px !important',
                              height: enableGlossDisplay ? '82px !important' : '62px !important'
                            }
                          }}>
      {tokens?.map((token) => <ButtonToken key={token.id} token={token} completeWord={tokens}
                                           enableGlossDisplay={enableGlossDisplay} links={links}
                                           languageInfo={languageInfo} suppressAfter={suppressAfter} disabled={disabled}
                                           hoverHighlightingDisabled={disableHighlighting} fillWidth={fillWidth} />)}
    </LocalizedButtonGroup>
  );
};

/**
 * props used by {@link ButtonToken}
 */
export interface ButtonTokenProps {
  /**
   * context of all tokens in the word of which the displayed token is a member
   */
  completeWord: Word[];
  token: Word;
  /**
   * whether gloss should be displayed
   */
  enableGlossDisplay?: boolean;
  /**
   * whether rejected links should be shown. If this is false|undefined (default), it is as if the link does not exist
   */
  showRejected?: boolean;
  /**
   * link data
   */
  links?: Map<string, RepositoryLink[]>;
  languageInfo?: LanguageInfo;
  suppressAfter?: boolean;
  disabled?: boolean;
  /**
   * whether hover highlighting behavior is enabled
   */
  hoverHighlightingDisabled?: boolean;
  fillWidth?: boolean;
}

/**
 * component that displays an individual token as a button
 * @param disabled whether the button is disabled
 * @param links links possibly associated with the token
 * @param token token being displayed
 * @param completeWord all tokens in the word of which the displayed token is a member
 * @param languageInfo language information for the token
 * @param enableGlossDisplay whether gloss is toggled on
 * @param showRejected whether rejected links should be displayed
 * @param suppressAfter whether the after string should be displayed
 * @param hoverHighlightingDisabled whether normal hover behavior is suppressed
 * @param fillWidth True to use max available width.
 */
export const ButtonToken = ({
                              disabled,
                              links,
                              token,
                              completeWord,
                              languageInfo,
                              enableGlossDisplay,
                              showRejected,
                              suppressAfter,
                              hoverHighlightingDisabled,
                              fillWidth = false
                            }: ButtonTokenProps) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isTokenExcluded = token.exclude === 1;

  const alphaTransparencyValueForButtonTokens = useMemo( () => theme.palette.mode === 'light' ? '.12' : '.25', [theme.palette.mode])

  /**
   * element id for the color gradient svg to be referenced in order to use the gradient
   */
  const gradientSvgId = useMemo<string>(() => `machine-color-gradient-${token.side}-${token.id}`, [token.side, token.id]);
  const gradientSvgUrl = useMemo<string>(() => `url(#${gradientSvgId})`, [gradientSvgId]);
  const gradientSvg = useMemo<React.JSX.Element>(() =>
    (<svg width={0} height={0}>
      <linearGradient id={gradientSvgId} x1={1} y1={0} x2={1} y2={1}>
        <stop offset={0} stopColor={gradientTopColor} />
        <stop offset={1} stopColor={gradientBottomColor} />
      </linearGradient>
    </svg>), [gradientSvgId]);


  /**
   * whether the current token is being hovered by the user
   */
  const isHoveredToken = useAppSelector(
    (state) =>
      state.textSegmentHover.hovered?.side === token.side &&
      state.textSegmentHover.hovered?.id === token.id
  );

  /**
   * the token currently being hovered by the user
   */
  const currentlyHoveredToken = useAppSelector(
    (state) => state.textSegmentHover.hovered
  );

  /**
   * links currently being hovered over by the user, if any
   */
  const currentlyHoveredLinks = useMemo<RepositoryLink[]>(() => {
    if (!links
      || !currentlyHoveredToken?.id) {
      return [];
    }
    const sanitized = BCVWP.sanitize(currentlyHoveredToken.id);
    const result = [...links.values()].flatMap((a) => a).find((link: RepositoryLink) => link[currentlyHoveredToken.side].includes(sanitized));
    return result ? [result] : [];
  }, [links, currentlyHoveredToken?.id, currentlyHoveredToken?.side]);

  /**
   * link this token is a member of, undefined if not a member
   */
  const memberOfLinks = useMemo(() => {
    const foundLinks = links?.get(BCVWP.sanitize(token.id));
    if (showRejected) return foundLinks;
    return foundLinks?.filter((link) => link?.metadata.status !== LinkStatus.REJECTED);
  }, [links, showRejected, token.id]);

  /**
   * since rejected links no longer show up, we must filter the links and choose a primary link to use for display purposes that this token is a member of
   */
  const memberOfPrimaryLink = useMemo(() => memberOfLinks?.[0], [memberOfLinks]);

  const anchorEl = useRef();

  /**
   * editedLink is an object representing the currently selected tokens that comprise an
   * inProgressLink
   */
  const editedLink = useAppSelector((state) => state.alignment.present.inProgressLink);

  /**
   * indicates if this token is a member of any link
   */
  const isMemberOfAnyLink = useMemo(() => !!memberOfPrimaryLink, [memberOfPrimaryLink]);
  /**
   * indicates whether this token was a member of the link which is currently being edited (does not indicate if it is currently selected in the edited link, just that it was a member of that link before it was opened for editing)
   */
  const isMemberOfEditedLink = useMemo<boolean>(() => memberOfPrimaryLink?.id === editedLink?.id, [memberOfPrimaryLink?.id, editedLink?.id]);

  const { onOpenEditor, editorDialog, hasNote, isEditorOpen } = useLinkNotes({ memberOfLink: memberOfPrimaryLink });

  // Allow the user to right-click on an alignment and change it's state
  const [ContextMenuAlignmentState, handleRightClick] = useAlignmentStateContextMenu(anchorEl, memberOfPrimaryLink, onOpenEditor);

  const { wasSubmittedForConsideration, isMostRelevantSuggestion, scoreIsRelevant } = useTokenSuggestionRelevancyScore(token, isMemberOfAnyLink);

  const isSelectedInEditedLink = useMemo<boolean>(() => {
    switch (token.side) {
      case AlignmentSide.SOURCE:
        return !!editedLink?.sources.includes( BCVWP.sanitize(token.id) );
      case AlignmentSide.TARGET:
        return !!editedLink?.targets.includes( BCVWP.sanitize(token.id) );
    }
  }, [ token.id, token.side, editedLink?.sources, editedLink?.targets ]);

  const isCurrentlyHoveredToken = useMemo<boolean>(() => token?.side === currentlyHoveredToken?.side && token?.id === currentlyHoveredToken?.id, [ token.id, token.side, currentlyHoveredToken?.id, currentlyHoveredToken?.side ]);

  /**
   * whether this token is a member of an alignment that the currently hovered token is a member of
   */
  const isInLinkWithCurrentlyHoveredToken = useMemo(
    () => {
      return _.intersection(memberOfLinks, currentlyHoveredLinks).length > 0;
    },
    [memberOfLinks, currentlyHoveredLinks]
  );

  /**
   * This is the color used for the iconography and borders in an unselected state
   * when the token is selected, this is the background/fill color
   */
  const buttonPrimaryColor = useMemo(() => {
    if (!memberOfPrimaryLink?.metadata.status && isSelectedInEditedLink) return theme.palette.tokenButtons.defaultTokenButtons.selected;
    if (wasSubmittedForConsideration && scoreIsRelevant) return theme.palette.mode === 'light' ? theme.palette.secondary.light : theme.palette.secondary.main;
    if (!memberOfPrimaryLink?.metadata.status) return theme.palette.text.disabled;
    switch (memberOfPrimaryLink?.metadata.status) {
      case LinkStatus.APPROVED:
        return theme.palette.success.main;
      case LinkStatus.CREATED:
        return theme.palette.primary.main;
      case LinkStatus.NEEDS_REVIEW:
        return theme.palette.warning.main;
      case LinkStatus.REJECTED:
        return theme.palette.error.main;
      default:
        return theme.palette.text.disabled;
    }
  }, [ wasSubmittedForConsideration, scoreIsRelevant, memberOfPrimaryLink?.metadata.status, isSelectedInEditedLink, theme ]);

  const buttonNormalBackgroundColor = useMemo(() => theme.palette.background.default, [theme.palette.background.default]);

  /**
   * This is the computed color for the sx object for the Button.
   */
  const computedButtonColor = useMemo(() => {
    if(isMostRelevantSuggestion) {
      return theme.palette.mode === 'light' ?
        theme.palette.tokenButtons.defaultTokenButtons.text :
        theme.palette.tokenButtons.defaultTokenButtons.textContrast
    }
    if (!memberOfPrimaryLink?.metadata.status && isSelectedInEditedLink && theme.palette.mode === 'dark') {
      return theme.palette.tokenButtons.defaultTokenButtons.textContrast
    }
    if (!memberOfPrimaryLink?.metadata.status && isSelectedInEditedLink ) {
      return theme.palette.tokenButtons.defaultTokenButtons.text
    }
    // If this token is excluded, then make sure it gets the specified excluded color from the theme.
    // !important ensures it overrides the color it gets as a result of disabled being set to true.
    if(isTokenExcluded){
      return `${theme.palette.tokenButtons.excludedTokenButtons.text} !important`
    }
    return (isSelectedInEditedLink || isMostRelevantSuggestion) && !isHoveredToken ? buttonNormalBackgroundColor : theme.palette.text.primary
  },[buttonNormalBackgroundColor, isHoveredToken, isMostRelevantSuggestion, isSelectedInEditedLink, isTokenExcluded, theme, memberOfPrimaryLink])

  const sourceIndicator = useMemo<React.JSX.Element>(() => {
    const color = (() => {
      if (isCurrentlyHoveredToken) return buttonPrimaryColor;
      if (isMostRelevantSuggestion){
       return theme.palette.tokenButtons.suggestedTokenButtons.icon;
      }
      if (isSelectedInEditedLink || wasSubmittedForConsideration) {
        return buttonNormalBackgroundColor;
      }
      return buttonPrimaryColor;
    })();
    const iconProps: SvgIconOwnProps = {
      sx: {
        fontSize: iconSize,
        margin: iconMargin,
        color,
      }
    };
    const emptyBox = (<Box
      sx={{
        height: iconSize,
        margin: iconMargin
      }}>
    </Box>);
    if (isMostRelevantSuggestion) {
      return (
        <Lightbulb
          {...{
            ...iconProps,
            sx: iconProps?.sx,
          }}
        />
      );
    }
    if (!memberOfPrimaryLink) {
      return emptyBox;
    }
    /* eslint-disable no-fallthrough */
    switch (memberOfPrimaryLink?.metadata.origin) {
      case LinkOriginManual:
        return emptyBox;
      default:
        return (<AutoAwesome {...{
          sx: {
            ...iconProps?.sx,
            ...(memberOfPrimaryLink?.metadata.status === LinkStatus.CREATED
              ? {
                color: undefined,
                fill: color === buttonNormalBackgroundColor ? buttonNormalBackgroundColor : gradientSvgUrl
              } : {})
          }
        }} />);
    }
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ isMostRelevantSuggestion, wasSubmittedForConsideration, memberOfPrimaryLink, memberOfPrimaryLink?.metadata.origin, buttonPrimaryColor, isCurrentlyHoveredToken, isSelectedInEditedLink, buttonNormalBackgroundColor, gradientSvgUrl, memberOfPrimaryLink?.metadata.status]);

  const upperRightHandCornerIndicator = useMemo<React.JSX.Element>(() => {
    const color = (() => {
      if (isCurrentlyHoveredToken) return buttonPrimaryColor;
      if (isSelectedInEditedLink) {
        return buttonNormalBackgroundColor;
      }
      return buttonPrimaryColor;
    })();
    const iconProps: SvgIconOwnProps = {
      sx: {
        fontSize: iconSize,
        margin: iconMargin,
        color,
      }
    };
    if (hasNote) {
      return (<CommentOutlined
                {...{
                  sx: {
                    ...iconProps?.sx
                  }
                }} />);
    }
    return (<>
    </>);
  }, [ isCurrentlyHoveredToken, buttonPrimaryColor, isSelectedInEditedLink, buttonNormalBackgroundColor, hasNote ]);

  const statusIndicator = useMemo<React.JSX.Element>(() => {
      const color = (() => {
        if (isCurrentlyHoveredToken) return buttonPrimaryColor;
        if (isSelectedInEditedLink) {
          return buttonNormalBackgroundColor;
        }
        return buttonPrimaryColor;
      })();
      const baseSx: SxProps<Theme> = {
        fontSize: iconSize,
        margin: iconMargin,
        color
      };
      switch (memberOfPrimaryLink?.metadata.status) {
        case LinkStatus.APPROVED:
          return (<CheckCircle sx={{
            ...baseSx
          }} />);
        case LinkStatus.CREATED:
          return (<InsertLink sx={{
            ...baseSx
          }} />);
        case LinkStatus.NEEDS_REVIEW:
          return (<Flag sx={() => ({
            ...baseSx
          })} />);
        case LinkStatus.REJECTED:
          return (<Cancel sx={{
            ...baseSx
          }} />);
      }
      if (memberOfPrimaryLink) {
        return (<InsertLink sx={{
          ...baseSx
        }} />);
      }
      return (<Box sx={{
        height: iconSize,
        margin: iconMargin
      }}>
      </Box>);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [memberOfPrimaryLink, memberOfPrimaryLink?.metadata.status, memberOfPrimaryLink?.metadata.origin, isSelectedInEditedLink, buttonNormalBackgroundColor, isCurrentlyHoveredToken, buttonPrimaryColor]);

  const gradientTopColorDecomposed = useMemo(() => decomposeColor(gradientTopColor), []);
  const gradientBottomColorDecomposed = useMemo(() => decomposeColor(gradientBottomColor), []);

  const backgroundImageGradientTransparent = useMemo(() => `linear-gradient(rgba(${gradientTopColorDecomposed.values[0]}, ${gradientTopColorDecomposed.values[1]}, ${gradientTopColorDecomposed.values[2]}, ${alphaTransparencyValueForButtonTokens}), rgba(${gradientBottomColorDecomposed.values[0]}, ${gradientBottomColorDecomposed.values[1]}, ${gradientBottomColorDecomposed.values[2]}, ${alphaTransparencyValueForButtonTokens}))`, [gradientTopColorDecomposed.values, gradientBottomColorDecomposed.values, alphaTransparencyValueForButtonTokens]);

  const hoverSx: SxProps<Theme> = useMemo(() => {
      if (!memberOfPrimaryLink) {
      return ({
        backgroundColor: theme.palette.tokenButtons.defaultTokenButtons.rollover,
        color: theme.palette.tokenButtons.defaultTokenButtons.text,
      })
    }
    if (buttonPrimaryColor === theme.palette.text.disabled) {
      const decomposedColor = decomposeColor(theme.palette.primary.main);
      return ({
        backgroundColor: `rgba(${decomposedColor.values[0]}, ${decomposedColor.values[1]}, ${decomposedColor.values[2]}, ${alphaTransparencyValueForButtonTokens})`
      });
    }
    if (memberOfPrimaryLink?.metadata.origin !== LinkOriginManual && memberOfPrimaryLink?.metadata.status === LinkStatus.CREATED) {
      return ({
        backgroundColor: undefined,
        backgroundImage: backgroundImageGradientTransparent
      });
    }
    const rgbColor = decomposeColor(buttonPrimaryColor);
    return ({
      backgroundColor: `rgba(${rgbColor.values[0]}, ${rgbColor.values[1]}, ${rgbColor.values[2]}, ${alphaTransparencyValueForButtonTokens})`
    });
  }, [buttonPrimaryColor, backgroundImageGradientTransparent, memberOfPrimaryLink, theme, alphaTransparencyValueForButtonTokens]);

  const wordPart = useMemo<number | undefined>(() => BCVWP.parseFromString(token.id).part, [token.id]);
  const wordLength = useMemo<number>(() => completeWord.length, [completeWord.length]);

  const textJustification = useMemo<string>(() => {
    if (!wordPart || wordLength < 2)
      return 'center';
    const beginning = languageInfo?.textDirection === TextDirection.LTR ? 'left' : 'right';
    const end = languageInfo?.textDirection === TextDirection.LTR ? 'right' : 'left';
    if (wordPart === 1) return end;
    return beginning;
  }, [wordPart, wordLength, languageInfo?.textDirection]);

  const marginLeft = useMemo<string>(() => {
    if (!wordPart || wordLength < 2)
      return defaultMargin;
    if (wordPart > 1)
      return languageInfo?.textDirection === TextDirection.LTR ? noMargin : defaultMargin;
    return languageInfo?.textDirection === TextDirection.LTR ? defaultMargin : noMargin;
  }, [wordPart, wordLength, languageInfo?.textDirection]);

  const marginRight = useMemo<string>(() => {
    if (!wordPart || wordLength < 2)
      return defaultMargin;
    if (wordPart > 1)
      return languageInfo?.textDirection === TextDirection.LTR ? defaultMargin : noMargin;
    return languageInfo?.textDirection === TextDirection.LTR ? noMargin : defaultMargin;
  }, [languageInfo?.textDirection, wordPart, wordLength]);

  const isSpecialMachineLearningCase = useMemo<boolean>(() => memberOfPrimaryLink?.metadata.origin !== LinkOriginManual && memberOfPrimaryLink?.metadata.status === LinkStatus.CREATED, [memberOfPrimaryLink?.metadata.origin, memberOfPrimaryLink?.metadata.status]);

  /**
   * This is the computed border color for the sx object for the Button.
   */
  const computedBorderColor = useMemo(() => {
    // If this token is excluded, make sure it has no border
    if(isTokenExcluded){
      return `transparent !important`
    }
    return ((isSpecialMachineLearningCase && isSelectedInEditedLink) || isMostRelevantSuggestion) ? 'transparent !important' : `${buttonPrimaryColor} !important`

  },[buttonPrimaryColor, isMostRelevantSuggestion, isSelectedInEditedLink, isSpecialMachineLearningCase, isTokenExcluded])

  /**
   * This is the computed color for the text of the Gloss, when gloss is used.
   */
  const computedGlossColor = useMemo(() => {
    if(isMostRelevantSuggestion && isHoveredToken ){
      return theme.palette.mode === 'light' ?
        theme.palette.tokenButtons.defaultTokenButtons.textContrast :
        theme.palette.tokenButtons.defaultTokenButtons.text;
    }
    else if (isMostRelevantSuggestion){
     return theme.palette.mode === 'light' ?
       theme.palette.tokenButtons.defaultTokenButtons.text :
       theme.palette.tokenButtons.defaultTokenButtons.textContrast;
    }
    else if (!memberOfPrimaryLink?.metadata.status && isSelectedInEditedLink && theme.palette.mode === 'dark') {
      return theme.palette.tokenButtons.defaultTokenButtons.textContrast
    }
    else if (!memberOfPrimaryLink?.metadata.status && isSelectedInEditedLink ) {
      return theme.palette.tokenButtons.defaultTokenButtons.text
    }
    else if((isSelectedInEditedLink || isMostRelevantSuggestion) && !isHoveredToken){
      return buttonNormalBackgroundColor
    }
    else {
      return theme.palette.tokenButtons.defaultTokenButtons.text
    }
  },[buttonNormalBackgroundColor, isHoveredToken, isMostRelevantSuggestion, isSelectedInEditedLink, theme, token.gloss, memberOfPrimaryLink?.metadata.status])

  return (<>
    <Box
      onContextMenu={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => handleRightClick(event, token.id, links)}
      ref={anchorEl}
      sx={{
        ...(fillWidth ? { width: '100%' } : {})
      }}
    >
    {isMemberOfAnyLink && editorDialog}
    <Button
      disabled={isEditorOpen || isTokenExcluded || disabled || (!!editedLink && isMemberOfAnyLink && !isMemberOfEditedLink)}
      component={'button'}
      sx={() => ({
        textTransform: 'none',
        color: computedButtonColor,
        borderColor: computedBorderColor,
        '&:hover': hoverSx,
        padding: '0 !important',
        ...(isSelectedInEditedLink || isMostRelevantSuggestion ? {
          backgroundColor:  buttonPrimaryColor,
        } : {}),
        /**
         * override CSS with the hover CSS if this token is a member of a link with the currently hovered token
         */
        ...(isInLinkWithCurrentlyHoveredToken && !isSelectedInEditedLink ? hoverSx : {}),
        ...(fillWidth ? { width: '100%' } : {})
      })}
      onMouseEnter={!!hoverHighlightingDisabled || (!editedLink && isSelectedInEditedLink) ? () => {} : () => dispatch(hover(token))}
      onMouseLeave={!!hoverHighlightingDisabled ? () => {} : () => dispatch(hover(null))}
      onClick={() => {
        if (isEditorOpen) return;
        return dispatch(toggleTextSegment({
          foundRelatedLinks: [memberOfPrimaryLink].filter((v) => !!v),
          word: token
        }));
      }}
      onKeyDown={(e) => {
        if (e.key === ' ') { // prevent the space bar from triggering a click action so it can be used for control panel actions
          e.preventDefault();
        }
      }} >
      {gradientSvg}
      <LocalizedTextDisplay
        sx={{
          width: '100%',
          height: '100%'
        }}
        languageInfo={languageInfo}>
        <Box
          sx={{
            display: 'flex',
            height: '100%',
            flexDirection: 'column'
          }}>
          <Box
            dir={'ltr'}
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              m: 0
            }}>
            {sourceIndicator}
            {upperRightHandCornerIndicator}
          </Box>
          <Box
            sx={{
              display: 'flex',
              marginLeft,
              marginRight,
              alignItems: 'center',
              justifyContent: `${textJustification} !important`,
              minWidth: `calc(32px - ${marginLeft} - ${marginRight}) !important`,
              flexGrow: 1,
            }}>
            <Stack>
              {/*
                * word text display
                */}
                <LocalizedTextDisplay
                  languageInfo={languageInfo}
                  sx={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: `${textJustification} !important`,
                    fontSize: languageInfo?.code === 'heb' ? '19px' : '13px'
                  }}>
                  {token.text}
                </LocalizedTextDisplay>
                {/*
                * gloss display
                */}
                {enableGlossDisplay ?
                  <Typography
                    variant={'caption'}
                    sx={{
                      display: 'flex',
                      width: '100%',
                      justifyContent: `${textJustification} !important`,
                      color: computedGlossColor,
                    }}>
                    {token.gloss ?? '-'}
                  </Typography> : <></>}
              </Stack>
            </Box>
            <Box
              sx={{
                display: 'flex',
                width: '100%',
                justifyContent: 'right',
                m: 0
              }}>
              {statusIndicator}
            </Box>
          </Box>
        </LocalizedTextDisplay>
      </Button>
      <ContextMenuAlignmentState />
    </Box>
    {!!token.after && !suppressAfter
      ? <Button disabled={true}>
        <LocalizedTextDisplay languageInfo={languageInfo}>
          {token.after}
        </LocalizedTextDisplay>
      </Button> : ''}
  </>);
};
