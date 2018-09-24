import * as React from 'react';
import { Transition } from 'react-transition-group';
import { I18n } from '../../../i18n';
import { bind } from '../../../util/bind';

import {
  GameInfo,
  RoleInfo,
  SpeakState,
  LogVisibility,
  SpeakQuery,
  TimerInfo,
  PlayerInfo,
} from '../defs';

import { LogVisibilityControl } from './log-visibility';
import { WillForm } from './will-form';
import { Timer } from './timer';
import { makeMapByKey } from '../../../util/map-by-key';
import { SpeakKindSelect } from './speak-kind-select';

export interface IPropSpeakForm extends SpeakState {
  /**
   * Info of game.
   */
  gameInfo: GameInfo;
  /**
   * Info of roles.
   */
  roleInfo: RoleInfo | null;
  /**
   * List of players currently in the room.
   */
  players: PlayerInfo[];
  /**
   * Info of log visibility.
   */
  logVisibility: LogVisibility;
  /**
   * Whether rule is available now.
   */
  rule: boolean;
  /**
   * Timer info.
   */
  timer: TimerInfo;
  /**
   * update to a speak form state.
   */
  onUpdate: (obj: Partial<SpeakState>) => void;
  /**
   * update to log visibility.
   */
  onUpdateLogVisibility: (obj: LogVisibility) => void;
  /**
   * Speak a comment.
   */
  onSpeak: (query: SpeakQuery) => void;
  /**
   * Push a refuse revival button.
   */
  onRefuseRevival: () => void;
  /**
   * Push the rule button.
   */
  onRuleOpen: () => void;
  /**
   * Change the will.
   */
  onWillChange: (will: string) => void;
}
/**
 * Speaking controls.
 */
export class SpeakForm extends React.PureComponent<IPropSpeakForm, {}> {
  protected comment: HTMLInputElement | HTMLTextAreaElement | null = null;
  /**
   * Temporally saved comment.
   */
  protected commentString: string = '';
  /**
   * Temporal flag to focus on the comment input.
   */
  protected focus: boolean = false;
  public render() {
    const {
      gameInfo,
      roleInfo,
      players,
      size,
      kind,
      multiline,
      willOpen,
      logVisibility,
      rule,
      timer,
    } = this.props;

    // list of speech kind.
    const speaks = roleInfo != null ? roleInfo.speak : ['day'];
    const playersMap = makeMapByKey(players, 'id');
    return (
      <I18n>
        {t => (
          <>
            <form onSubmit={this.handleSubmit}>
              {/* Comment input form. */}
              {multiline ? (
                <textarea
                  ref={e => (this.comment = e)}
                  cols={50}
                  rows={4}
                  required
                  autoComplete="off"
                  defaultValue={this.commentString}
                  onChange={this.handleCommentChange}
                />
              ) : (
                <input
                  ref={e => (this.comment = e)}
                  type="text"
                  size={50}
                  required
                  autoComplete="off"
                  defaultValue={this.commentString}
                  onChange={this.handleCommentChange}
                  onKeyDown={this.handleKeyDownComment}
                />
              )}
              {/* Speak button. */}
              <input type="submit" value={t('game_client:speak.say')} />
              {/* Speak size select control. */}
              <select value={size} onChange={this.handleSizeChange}>
                <option value="small">
                  {t('game_client:speak.size.small')}
                </option>
                <option value="normal">
                  {t('game_client:speak.size.normal')}
                </option>
                <option value="big">{t('game_client:speak.size.big')}</option>
              </select>
              {/* Speech kind selection. */}
              <SpeakKindSelect
                kinds={speaks}
                current={kind}
                t={t}
                playersMap={playersMap}
                onChange={this.handleKindChange}
              />
              {/* Multiline checkbox. */}
              <label>
                <input
                  type="checkbox"
                  name="multilinecheck"
                  checked={multiline}
                  onChange={this.handleMultilineChange}
                />
                {t('game_client:speak.multiline')}
              </label>
              {/* Show timer. */} <Timer timer={timer} />
              {/* Will open button. */}
              <button type="button" onClick={this.handleWillClick}>
                {willOpen
                  ? t('game_client:speak.will.close')
                  : t('game_client:speak.will.open')}
              </button>
              {/* Show rule button. */}
              <button
                type="button"
                onClick={this.handleRuleClick}
                disabled={!rule}
              >
                {t('game_client:speak.rule')}
              </button>
              {/* Log visibility control. */}
              <LogVisibilityControl
                visibility={logVisibility}
                day={gameInfo.day}
                onUpdate={this.handleVisibilityUpdate}
              />
              {/* Refuse revival button. */}
              <button
                type="button"
                onClick={this.handleRefuseRevival}
                disabled={gameInfo.status !== 'playing'}
              >
                {t('game_client:speak.refuseRevival')}
              </button>
            </form>
            <Transition in={willOpen} timeout={250}>
              {(state: string) => (
                <WillForm
                  t={t}
                  open={willOpen}
                  will={(roleInfo && roleInfo.will) || undefined}
                  onWillChange={this.handleWillChange}
                />
              )}
            </Transition>
          </>
        )}
      </I18n>
    );
  }
  public componentDidUpdate() {
    // process the temporal flag to focus.
    if (this.focus && this.comment != null) {
      this.focus = false;
      this.comment.focus();
    }
  }
  /**
   * Handle submission of the speak form.
   */
  @bind
  protected handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): void {
    const { kind, size, onSpeak } = this.props;
    e.preventDefault();

    const query: SpeakQuery = {
      comment: this.commentString,
      mode: kind,
      // XXX compatibility!
      size: size === 'normal' ? '' : size,
    };
    this.props.onSpeak(query);
    // reset the comment form.
    this.commentString = '';
    if (this.comment != null) {
      this.comment.value = '';
    }
  }
  /**
   * Handle a change of comment input.
   */
  @bind
  protected handleCommentChange(
    e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void {
    this.commentString = e.currentTarget.value;
  }
  /**
   * Handle a keydown event of comment input.
   */
  @bind
  protected handleKeyDownComment(
    e: React.KeyboardEvent<HTMLInputElement>,
  ): void {
    if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey || e.metaKey)) {
      // this keyboard input switches to the multiline mode.
      e.preventDefault();
      this.commentString += '\n';
      this.focus = true;
      this.props.onUpdate({
        multiline: true,
      });
    }
  }
  /**
   * Handle a change of comment size.
   */
  @bind
  protected handleSizeChange(e: React.SyntheticEvent<HTMLSelectElement>): void {
    this.props.onUpdate({
      size: e.currentTarget.value as 'small' | 'normal' | 'big',
    });
  }
  /**
   * Handle a change of speech kind.
   */
  @bind
  protected handleKindChange(kind: string): void {
    this.props.onUpdate({
      kind,
    });
  }
  /**
   * Handle a change of multiline checkbox.
   */
  @bind
  protected handleMultilineChange(
    e: React.SyntheticEvent<HTMLInputElement>,
  ): void {
    this.props.onUpdate({
      multiline: e.currentTarget.checked,
    });
  }
  /**
   * Handle a click of will button.
   */
  @bind
  protected handleWillClick(): void {
    this.props.onUpdate({
      willOpen: !this.props.willOpen,
    });
  }
  /**
   * Handle a change to the will.
   */
  @bind
  protected handleWillChange(will: string): void {
    const { onUpdate, onWillChange } = this.props;
    // close will form.
    onUpdate({
      willOpen: false,
    });
    onWillChange(will);
  }
  /**
   * Handle a click of rule button.
   */
  @bind
  protected handleRuleClick(): void {
    this.props.onRuleOpen();
  }
  /**
   * Handle an update of log visibility.
   */
  @bind
  protected handleVisibilityUpdate(v: LogVisibility): void {
    this.props.onUpdateLogVisibility(v);
  }
  /**
   * Handle a click of refuse revival button.
   */
  @bind
  protected handleRefuseRevival(): void {
    this.props.onRefuseRevival();
  }
}
