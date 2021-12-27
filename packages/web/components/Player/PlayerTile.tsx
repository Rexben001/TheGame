import {
  Box,
  getTimeZoneFor,
  Heading,
  HStack,
  LinkBox,
  LinkOverlay,
  MetaTag,
  MetaTile,
  MetaTileBody,
  MetaTileHeader,
  Text,
  TimeZone,
  Tooltip,
  VStack,
  Wrap,
  WrapItem,
} from '@metafam/ds';
import { Maybe } from '@metafam/utils';
import { PlayerAvatar } from 'components/Player/PlayerAvatar';
import { PlayerContacts } from 'components/Player/PlayerContacts';
import { PlayerTileMemberships } from 'components/Player/PlayerTileMemberships';
import { SkillsTags } from 'components/Skills';
import { Player, Skill } from 'graphql/autogen/types';
import NextLink from 'next/link';
import React, { useMemo } from 'react';
import { FaGlobe } from 'react-icons/fa';
import {
  getBannerFor,
  getDescriptionOf,
  getNameOf,
  getURLFor,
} from 'utils/playerHelpers';

type Props = {
  player: Player;
  showSeasonalXP?: boolean;
};

const MAX_BIO_LENGTH = 240;

export const PlayerTile: React.FC<Props> = ({
  player,
  showSeasonalXP = false,
}) => {
  const tz: Maybe<TimeZone> = useMemo(
    () => getTimeZoneFor({ location: player.profile?.timeZone ?? undefined }),
    [player.profile?.timeZone],
  );
  const description = getDescriptionOf(player);
  const displayDescription =
    (description?.length ?? 0) > MAX_BIO_LENGTH
      ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        `${description!.substring(0, MAX_BIO_LENGTH - 9)}…`
      : description;

  console.info({ player });

  return (
    <LinkBox>
      <MetaTile>
        <Box
          bgImage={`url(${getBannerFor(player)})`}
          bgSize="cover"
          bgPosition="center"
          position="absolute"
          top={0}
          left={0}
          w="100%"
          h="4.5rem"
        />
        <NextLink
          as={getURLFor(player, { rel: true })}
          href="/player/[username]"
          passHref
        >
          <LinkOverlay>
            <MetaTileHeader>
              <VStack>
                <PlayerAvatar {...{ player }} size="xl" />
                <Heading size="xs" color="white">
                  {getNameOf(player)}
                </Heading>
              </VStack>
              <Wrap w="100%" justify="center">
                {player.type?.title && (
                  <WrapItem>
                    <MetaTag size="md" textTransform="uppercase">
                      {player.type.title}
                    </MetaTag>
                  </WrapItem>
                )}
                {player.rank && (
                  <WrapItem>
                    <MetaTag
                      backgroundColor={player.rank?.toLowerCase()}
                      size="md"
                      color="blackAlpha.600"
                    >
                      {player.rank}
                    </MetaTag>
                  </WrapItem>
                )}
                <WrapItem>
                  <MetaTag size="md">
                    {showSeasonalXP ? 'TOTAL XP: ' : 'XP: '}
                    {Math.floor(player.totalXP)}
                  </MetaTag>
                </WrapItem>
                {showSeasonalXP && (
                  <WrapItem>
                    <MetaTag size="md">
                      SEASON Ⅳ XP: {Math.floor(player.seasonXP)}
                    </MetaTag>
                  </WrapItem>
                )}
              </Wrap>
              {tz && (
                <Tooltip label={tz.name} hasArrow>
                  <HStack alignItems="baseline" w="auto" justify="center">
                    <FaGlobe color="blueLight" fontSize="0.875rem" />
                    <Text fontSize="lg">{tz.abbreviation}</Text>
                    {tz.utc && <Text fontSize="sm">{tz.utc}</Text>}
                  </HStack>
                </Tooltip>
              )}
              {displayDescription && (
                <VStack spacing={2} align="stretch" pt="0.5rem">
                  <Text textStyle="caption" textTransform="uppercase">
                    About
                  </Text>
                  <Text fontSize="sm">{displayDescription}</Text>
                </VStack>
              )}
            </MetaTileHeader>
          </LinkOverlay>
        </NextLink>
        <MetaTileBody>
          {player.skills?.length ? (
            <VStack spacing={2} align="stretch">
              <Text textStyle="caption" textTransform="uppercase">
                Skills
              </Text>
              <SkillsTags
                skills={
                  player.skills.map(({ Skill: skill }) => skill) as Skill[]
                }
              />
            </VStack>
          ) : null}

          <PlayerTileMemberships {...{ player }} />

          {player.accounts?.length && (
            <VStack spacing={2} align="stretch">
              <Text textStyle="caption" textTransform="uppercase">
                Contact
              </Text>
              <HStack mt={2}>
                <PlayerContacts {...{ player }} disableBrightId />
              </HStack>
            </VStack>
          )}
        </MetaTileBody>
      </MetaTile>
    </LinkBox>
  );
};
