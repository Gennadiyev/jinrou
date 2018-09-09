import * as React from 'react';
import * as Color from 'color';
import { WrapperElement, WrapperHeader, Content } from './elements';
import { Theme } from '../../theme';
import { withTheme } from '../../util/styled';
import { TranslationFunction } from '../../i18n';

const WrapperInner: React.StatelessComponent<{
  t: TranslationFunction;
  /**
   * Current team.
   */
  team: string | undefined;
  theme: Theme;
}> = ({ children, t, team, theme }) => {
  // get the color for this team.
  const teamColor = Color(!team ? '#cccccc' : theme.teamColors[team]);
  const teamTextColor = teamColor.isDark()
    ? Color('#ffffff')
    : Color('#000000');
  const backColorBase = teamColor.mix(Color('#ffffff'), 0.9).rgb();
  // if team is undefined, fade to mix to background color.
  const backColor = team == null ? backColorBase.fade(0.4) : backColorBase;
  const borderColor = teamColor.mix(Color('#000000'), 0.4).rgb();

  const teamString = team
    ? t('game_client:jobinfo.team.message_short', {
        team: t(`roles:teamName.${team}`),
      })
    : t('game_client:jobinfo.team.none_short');
  return (
    <WrapperElement borderColor={borderColor} backColor={backColor}>
      {team != null ? (
        <WrapperHeader teamColor={teamColor} textColor={teamTextColor}>
          {teamString}
        </WrapperHeader>
      ) : null}
      <Content>{children}</Content>
    </WrapperElement>
  );
};

/**
 * Wrapper of the job info component.
 * @package
 */
export const Wrapper = withTheme(WrapperInner);
