import { Room, RoomListMode, GameInfo } from './defs';
import {
  RoomWrapper,
  RoomName,
  StatusLine,
  roomStatus,
  Locked,
  HasGM,
  Blind,
  RoomOpenTime,
  Comment,
  RoomOwner,
  RoomStatusLine,
  OwnerStatusLine,
  RoomTypeLine,
  RoomOpenTimeLine,
  GameInfoLine,
  gameResult,
  RoomNumber,
  CommentStatusLine,
  RoomOwnerIcon,
} from './elements';
import * as React from 'react';
import { I18n, TranslationFunction } from '../../i18n';
import { Observer } from 'mobx-react';
import { FontAwesomeIcon } from '../../util/icon';
import { GetJobColorConsumer } from './get-job-color';

/**
 * Component to show one room.
 */
export function Room({
  room,
  listMode,
  index,
}: {
  room: Room;
  listMode: RoomListMode;
  index: number;
}) {
  const { id, name } = room;

  return (
    <I18n namespace="rooms_client">
      {t => (
        <Observer>
          {() => (
            <RoomWrapper>
              <RoomNumber>{index}</RoomNumber>
              <RoomName href={`/room/${id}`}>{name}</RoomName>
              <RoomStatus room={room} listMode={listMode} t={t} />
            </RoomWrapper>
          )}
        </Observer>
      )}
    </I18n>
  );
}

/**
 * Show room status.
 */
function RoomStatus({
  room,
  listMode,
  t,
}: {
  room: Room;
  listMode: RoomListMode;
  t: TranslationFunction;
}) {
  const {
    mode,
    needpassword,
    gm,
    blind,
    players,
    number,
    made,
    comment,
    owner,
    gameinfo,
  } = room;

  const RS = roomStatus[mode];

  const madeDate = new Date(made);

  return (
    <>
      <RoomStatusLine>
        <RS>
          {t(`status.${mode}`)} ({t('playerNumber', { count: players.length })}{' '}
          / {t('playerNumber', { count: number })})
        </RS>
      </RoomStatusLine>
      <RoomTypeLine>
        {needpassword ? (
          listMode === 'old' || listMode === 'log' || listMode === 'my' ? (
            // lock is outdated.
            <Locked title={t('game_client:roominfo.password')}>
              <FontAwesomeIcon icon="unlock" />
            </Locked>
          ) : (
            <Locked>
              <FontAwesomeIcon icon="lock" />
              {t('game_client:roominfo.password')}
            </Locked>
          )
        ) : null}
        {gm ? (
          <HasGM>
            <FontAwesomeIcon icon="user-tie" />
            {t('gm')}
          </HasGM>
        ) : null}
        {blind === 'yes' ? (
          <Blind>
            <FontAwesomeIcon icon="user-secret" />
            {t('game_client:roominfo.blind')}
          </Blind>
        ) : blind === 'complete' ? (
          <Blind>
            <FontAwesomeIcon icon="user-secret" />
            {t('game_client:roominfo.blindComplete')}
          </Blind>
        ) : null}
      </RoomTypeLine>
      {gameinfo != null ? (
        <GameInfoLine>
          <GameInfoInner t={t} gameinfo={gameinfo} />
        </GameInfoLine>
      ) : null}
      <CommentStatusLine>
        <Comment>{comment}</Comment>
      </CommentStatusLine>
      <OwnerStatusLine>
        <RoomOwner>
          <RoomOwnerIcon title={t('ownerTitle')}>
            <FontAwesomeIcon icon="user" />
          </RoomOwnerIcon>
          {owner != null ? (
            <a href={`/user/${owner.userid}`}>{owner.name}</a>
          ) : (
            t('ownerHidden')
          )}
        </RoomOwner>
      </OwnerStatusLine>
      <RoomOpenTimeLine>
        <RoomOpenTime>
          <time dateTime={madeDate.toISOString()}>
            {madeDate.toLocaleString(undefined, {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </time>
        </RoomOpenTime>
      </RoomOpenTimeLine>
    </>
  );
}

function GameInfoInner({
  t,
  gameinfo: { job, subtype },
}: {
  t: TranslationFunction;
  gameinfo: GameInfo;
}) {
  return (
    <GetJobColorConsumer>
      {getJobColor => {
        // result of game.
        let result = null;
        if (subtype === 'win' || subtype === 'lose' || subtype === 'draw') {
          const RC = gameResult[subtype];
          result = <RC>{t(`rooms_client:result.${subtype}`)}</RC>;
        }
        const jc = getJobColor(job);
        const jobSquare =
          jc != null ? (
            <span
              style={{
                color: jc,
              }}
            >
              ■
            </span>
          ) : null;
        const jobName = t(`roles:jobname.${job}`);
        return (
          <>
            {result}
            {'　'}
            {jobSquare}
            {jobName}
          </>
        );
      }}
    </GetJobColorConsumer>
  );
}