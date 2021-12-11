import _ from 'lodash'
import { useEffect, useState, useRef } from 'react'
import { Button, Flex } from '@chakra-ui/react'
import Logo from '../Logo'
import ListingNotifierModal, { Notifier } from './ListingNotifierModal'
import { MatchedAsset } from './MatchedAssetListing'
import { readableEthValue, weiToEth } from '../../utils/ethereum'
import { getExtensionConfig } from '../../utils/extensionConfig'
import { fetchCollectionAddress, fetchRarities } from '../../utils/api'
import { determineRarityType, RARITY_TYPES } from '../../utils/rarity'

const POLL_INTERVAL_MS = 5000

const createPollTime = (bufferSeconds = 0) =>
  new Date(Date.now() - bufferSeconds * 1000).toISOString().replace(/Z$/, '')

type Rarities = {
  tokenRarity: Record<string, number>
  tokenCount: number
}

const assetMatchesNotifier = ({
  asset,
  notifier,
  rarities,
}: {
  asset: MatchedAsset
  notifier: Notifier
  rarities: Rarities | null
}) => {
  // Min Price
  if (
    notifier.minPrice !== null &&
    weiToEth(Number(asset.price)) < notifier.minPrice
  ) {
    return false
  }
  // Max Price
  if (
    notifier.maxPrice !== null &&
    weiToEth(Number(asset.price)) > notifier.maxPrice
  ) {
    return false
  }
  // Rarity
  if (notifier.lowestRarity !== 'Common' && rarities) {
    const rank = rarities.tokenRarity[asset.tokenId]
    if (rank !== undefined) {
      const assetRarity = determineRarityType(rank, rarities.tokenCount)
      const notifierRarityIndex = RARITY_TYPES.findIndex(
        ({ name }) => name === notifier.lowestRarity,
      )
      const assetRarityIndex = RARITY_TYPES.findIndex(
        ({ name }) => name === assetRarity.name,
      )
      if (assetRarityIndex > notifierRarityIndex) {
        return false
      }
    }
  }

  return true
}

const throttledPlayNotificationSound = _.throttle(() => {
  const audio = new Audio(chrome.runtime.getURL('/notification.mp3'))
  audio.play()
}, 1000)

const ListingNotifier = ({ collectionSlug }: { collectionSlug: string }) => {
  const [modalOpen, setModalOpen] = useState(false)
  // Save in memory
  const [activeNotifiers, setActiveNotifiers] = useState<Notifier[]>([])
  const [matchedAssets, setMatchedAssets] = useState<MatchedAsset[]>([])
  const addedListings = useRef<Record<string, boolean>>({}).current
  const pollTimeRef = useRef<string | null>(null)
  const [rarities, setRarities] = useState<Rarities | null>(null)

  // Load rarities and traits
  // TODO: Check if member
  useEffect(() => {
    ;(async () => {
      const address = await fetchCollectionAddress(collectionSlug)
      const rarities = await fetchRarities(address)
      setRarities({
        tokenRarity: _.mapValues(
          _.keyBy(rarities.tokens, 'iteratorID'),
          'rank',
        ),
        tokenCount: rarities.tokenCount,
      })
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionSlug])

  // Set up polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null
    if (activeNotifiers.length === 0) {
      pollInterval !== null && clearInterval(pollInterval)
    } else {
      if (pollTimeRef.current === null) {
        pollTimeRef.current = createPollTime(5)
      }
      pollInterval = setInterval(async () => {
        chrome.storage.local.get(
          ['openSeaGraphQlRequests'],
          async ({ openSeaGraphQlRequests }) => {
            const request = openSeaGraphQlRequests['EventHistoryPollQuery']
            if (request) {
              const body = JSON.parse(request.body)
              // TODO: Get variable paths and static values from remote
              body.variables.collections = [collectionSlug]
              body.variables.eventTimestamp_Gt = pollTimeRef.current
              body.variables.eventTypes = ['AUCTION_CREATED']

              const nextPollTime = createPollTime(2)
              // TODO: handle errors, with retry as below
              const res = await fetch(request.url, {
                method: 'POST',
                body: JSON.stringify(body),
                headers: request.headers.reduce(
                  (
                    acc: Record<string, string>,
                    { name, value }: { name: string; value: string },
                  ) => {
                    if (value) {
                      acc[name] = value
                    }
                    return acc
                  },
                  {},
                ),
              }).then((res) => res.json())
              pollTimeRef.current = nextPollTime

              const assets = res.data.assetEvents.edges
                .map(({ node }: any) => {
                  if (!node.assetQuantity?.asset) return null
                  return {
                    listingId: node.relayId,
                    tokenId: node.assetQuantity.asset.tokenId,
                    contractAddress:
                      node.assetQuantity.asset.assetContract.address,
                    name:
                      node.assetQuantity.asset.name ||
                      node.assetQuantity.asset.collection.name,
                    image: node.assetQuantity.asset.displayImageUrl,
                    price: node.price.quantityInEth,
                    currency: node.price.asset.symbol,
                    timestamp: node.eventTimestamp,
                  }
                })
                .filter(Boolean)
                .filter(
                  (asset: MatchedAsset) => !addedListings[asset.listingId],
                )
                .filter((asset: MatchedAsset) => {
                  const matches = activeNotifiers.some((notifier) =>
                    assetMatchesNotifier({ asset, notifier, rarities }),
                  )
                  if (!matches) {
                    console.log(
                      'no matching notifier',
                      asset,
                      `https://opensea.io/assets/${asset.contractAddress}/${asset.tokenId}`,
                    )
                  }
                  return matches
                })

              assets.forEach((asset: MatchedAsset) => {
                addedListings[asset.listingId] = true
                chrome.runtime.sendMessage(
                  {
                    method: 'notify',
                    params: {
                      id: asset.listingId,
                      openOnClick: `https://opensea.io/assets/${asset.contractAddress}/${asset.tokenId}`,
                      options: {
                        title: 'SuperSea - New Listing',
                        type: 'basic',
                        iconUrl: asset.image,
                        requireInteraction: true,
                        silent: true,
                        message: `${asset.name} (${readableEthValue(
                          +asset.price,
                        )} ${asset.currency})`,
                      },
                    },
                  },
                  async () => {
                    const { notificationSounds } = await getExtensionConfig(
                      false,
                    )
                    if (notificationSounds) {
                      throttledPlayNotificationSound()
                    }
                  },
                )
              })
              if (assets.length) {
                setMatchedAssets((prev) => [...assets, ...prev])
              }
            } else {
              // Retry n number of times before showing error
              console.log('no req yet')
            }
          },
        )
      }, POLL_INTERVAL_MS)
    }

    return () => {
      pollInterval && clearInterval(pollInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNotifiers, collectionSlug, rarities])

  return (
    <Flex justifyContent="flex-end" py="2">
      <Button
        rightIcon={<Logo width="24px" height="24px" flipped />}
        iconSpacing="4"
        onClick={() => setModalOpen(true)}
      >
        Listing Notifiers
      </Button>
      <ListingNotifierModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        addedNotifiers={activeNotifiers}
        onAddNotifier={(notifier) => {
          setActiveNotifiers((notifiers) => [...notifiers, notifier])
        }}
        onRemoveNotifier={(id) => {
          setActiveNotifiers((notifiers) =>
            notifiers.filter((n) => n.id !== id),
          )
        }}
        matchedAssets={matchedAssets}
      />
    </Flex>
  )
}

export default ListingNotifier
