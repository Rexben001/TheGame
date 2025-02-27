import {
  Box,
  Flex,
  Heading,
  HStack,
  LoadingState,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  SimpleGrid,
  Text,
  useDisclosure,
} from '@metafam/ds';
import { MetaLink as Link } from 'components/Link';
import { ProfileSection } from 'components/Profile/ProfileSection';
import { PlayerFragmentFragment } from 'graphql/autogen/types';
import { Collectible, useOpenSeaCollectibles } from 'lib/hooks/opensea';
import React from 'react';
import { BoxType } from 'utils/boxTypes';
import { isBackdropFilterSupported } from 'utils/compatibilityHelpers';

const GalleryItem: React.FC<{ nft: Collectible; noMargin?: boolean }> = ({
  nft,
  noMargin = false,
}) => (
  <Link
    href={nft.openseaLink}
    isExternal
    mb={noMargin ? undefined : 6}
    minW={0}
    display="flex"
  >
    <HStack spacing={6}>
      <Flex width="7.5rem" height="7.5rem">
        <Box
          bgImage={`url(${nft.imageUrl})`}
          backgroundSize="contain"
          backgroundRepeat="no-repeat"
          backgroundPosition="center"
          w="7.5rem"
          h="7.5rem"
          m="auto"
        />
      </Flex>
      <Flex direction="column">
        <Heading
          fontSize="xs"
          mt={3}
          mb={3}
          textTransform="uppercase"
          display="inline-block"
          style={{ wordWrap: 'break-word', wordBreak: 'break-all' }}
        >
          {nft.title}
        </Heading>
        <Text fontSize="sm">{nft.priceString}</Text>
      </Flex>
    </HStack>
  </Link>
);

type Props = {
  player: PlayerFragmentFragment;
  isOwnProfile?: boolean;
  canEdit?: boolean;
  onRemoveClick?: () => void;
};

export const PlayerGallery: React.FC<Props> = ({
  player,
  onRemoveClick,
  isOwnProfile,
  canEdit,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { favorites, data, loading } = useOpenSeaCollectibles({ player });

  const modalContentStyles = isBackdropFilterSupported()
    ? {
        backgroundColor: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
      }
    : {
        backgroundColor: 'rgba(7, 2, 29, 0.91)',
      };

  return (
    <ProfileSection
      title="NFT Gallery"
      onRemoveClick={onRemoveClick}
      isOwnProfile={isOwnProfile}
      canEdit={canEdit}
      boxType={BoxType.PLAYER_NFT_GALLERY}
    >
      {loading && <LoadingState />}
      {!loading &&
        favorites?.map((nft) => <GalleryItem nft={nft} key={nft.tokenId} />)}
      {!loading && data?.length > 3 && (
        <Text
          as="span"
          fontSize="xs"
          color="cyanText"
          cursor="pointer"
          onClick={onOpen}
        >
          View all
        </Text>
      )}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay>
          <ModalContent maxW="6xl" bg="none">
            <Box bg="purple80" borderTopRadius="lg" p={4} w="100%">
              <HStack>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="blueLight"
                  as="div"
                  mr="auto"
                >
                  NFT Gallery
                </Text>
                <ModalCloseButton color="blueLight" />
              </HStack>
            </Box>
            <Flex p={2} css={modalContentStyles}>
              <Box
                overflowY="scroll"
                overflowX="hidden"
                maxH="80vh"
                borderBottomRadius="lg"
                w="100%"
                css={{
                  scrollbarColor: 'rgba(70,20,100,0.8) rgba(255,255,255,0)',
                  '::-webkit-scrollbar': {
                    width: '8px',
                    background: 'none',
                  },
                  '::-webkit-scrollbar-thumb': {
                    background: 'rgba(70,20,100,0.8)',
                    borderRadius: '999px',
                  },
                }}
              >
                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  gap={6}
                  padding={6}
                  boxShadow="md"
                >
                  {data?.map((nft) => (
                    <GalleryItem
                      nft={nft}
                      key={`${nft.tokenId}-${nft.address}`}
                      noMargin
                    />
                  ))}
                </SimpleGrid>
              </Box>
            </Flex>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </ProfileSection>
  );
};
