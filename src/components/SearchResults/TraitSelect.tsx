import _ from 'lodash'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckIcon } from '@chakra-ui/icons'
import { FaListUl } from 'react-icons/fa'
import { Input, useColorModeValue, Text, Box, Flex } from '@chakra-ui/react'
import SelectSearch from 'react-select-search'
import { Trait } from '../../utils/api'
import TraitTag from './TraitTag'

const MENU_MAX_HEIGHT = 300

const TraitSelect = ({
  traits,
  value,
  onChange,
  isDisabled,
}: {
  traits: Trait[]
  value: string[]
  onChange: (value: string[]) => void
  isDisabled?: boolean
}) => {
  const [focused, setFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [menuPlacement, setMenuPlacement] = useState<'above' | 'below'>('below')
  const options = useMemo(() => {
    return _.map(_.groupBy(traits, 'trait_type'), (items, groupName) => {
      return {
        name: groupName,
        type: 'group',

        items: items
          .sort((a, b) => b.count - a.count)
          .map(({ value, count }) => {
            return {
              name: String(value),
              value: JSON.stringify({ groupName, value, count }),
            }
          }),
      }
    })
  }, [traits])

  const inputBorder = useColorModeValue('blackAlpha.300', 'whiteAlpha.300')
  const groupHeaderBg = useColorModeValue('blackAlpha.50', 'blackAlpha.500')
  const highlightBg = useColorModeValue('blackAlpha.100', 'whiteAlpha.300')
  const hoverBg = useColorModeValue('blackAlpha.50', 'whiteAlpha.200')
  const iconColor = useColorModeValue('gray.400', 'gray.500')

  useEffect(() => {
    const updatePlacement = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        if (rect.top + MENU_MAX_HEIGHT + 50 > window.innerHeight) {
          setMenuPlacement('above')
        } else {
          setMenuPlacement('below')
        }
      }
    }
    updatePlacement()
    const throttledUpdatePlacement = _.throttle(updatePlacement, 300)
    window.addEventListener('resize', throttledUpdatePlacement)
    window.addEventListener('scroll', throttledUpdatePlacement)
    return () => {
      window.removeEventListener('resize', throttledUpdatePlacement)
      window.removeEventListener('scroll', throttledUpdatePlacement)
    }
  }, [])

  return (
    <Box
      width="100%"
      color={useColorModeValue('black', 'white')}
      ref={containerRef}
      sx={{
        '.select-search__select': {
          background: useColorModeValue('gray.50', 'gray.800'),
          marginTop: '10px',
          marginBottom: '10px',
          position: 'absolute',
          left: 0,
          width: '100%',
          borderRadius: '5px',
          overflow: 'auto',
          maxHeight: `${MENU_MAX_HEIGHT}px`,
          zIndex: 99,
          ...(menuPlacement === 'above' ? { bottom: '100%' } : { top: '100%' }),
        },
        '.select-search__options': {
          listStyleType: 'none',
        },
      }}
    >
      <Box position="relative" width="100%">
        <SelectSearch
          options={options as any}
          search
          disabled={isDisabled}
          closeOnSelect
          multiple
          printOptions="on-focus"
          value={value}
          filterOptions={(_options) => {
            return (value) => {
              if (!value) return _options
              return _options
                .map((group) => {
                  const exactGroupMatch =
                    group.name.toLowerCase() === value.toLowerCase()
                  return {
                    ...group,
                    items: exactGroupMatch
                      ? group.items!
                      : group.items!.filter(({ name }) =>
                          name.toLowerCase().includes(value.toLowerCase()),
                        ),
                  }
                })
                .filter((group) => group.items.length)
            }
          }}
          // @ts-ignore
          onBlur={() => setFocused(false)}
          onFocus={() => setFocused(true)}
          onChange={(value: any) => {
            // Defer update to hack around a bug where internal and external
            // value state starts to mismatch
            setTimeout(() => onChange(value), 0)
          }}
          renderValue={(valueProps) => {
            return (
              <Input
                {...(valueProps as any)}
                value={focused ? valueProps.value : ''}
                borderColor={inputBorder}
                placeholder="Search traits"
                width="100%"
              />
            )
          }}
          renderGroupHeader={(name) => {
            return (
              <Flex
                py="2"
                px="3"
                textTransform="uppercase"
                fontWeight="600"
                fontSize="12px"
                bg={groupHeaderBg}
              >
                <Box mr={2} my={'auto'} color={iconColor}>
                  <FaListUl
                    color={iconColor}
                    width="12px"
                    height="auto"
                    display="inline-block"
                  />
                </Box>
                <Text>{name}</Text>
              </Flex>
            ) as any
          }}
          renderOption={(optionsProps, optionData, optionSnapshot) => {
            const { value, count } = JSON.parse(optionData.value)
            return (
              <Flex
                {...(optionsProps as any)}
                py="2"
                px="3"
                pl={'5'}
                textAlign="left"
                justifyContent="space-between"
                bg={optionSnapshot.highlighted ? highlightBg : undefined}
                width="100%"
                fontSize="15px"
                cursor="pointer"
                _hover={{
                  bg: optionSnapshot.highlighted ? undefined : hoverBg,
                }}
                as="button"
              >
                <Text>
                  {value}
                  {optionSnapshot.selected ? (
                    <CheckIcon
                      width="12px"
                      height="auto"
                      display="inline-block"
                      mt="-2px"
                      ml="2"
                    />
                  ) : null}
                </Text>
                <Text opacity={0.5}>{count}</Text>
              </Flex>
            )
          }}
        />
      </Box>
      <Flex flexWrap="wrap" py={value.length ? 3 : 0}>
        {value.map((val) => {
          return (
            <TraitTag
              key={val}
              traitJson={val}
              closeable
              onClickClose={() => onChange(value.filter((v) => v !== val))}
            />
          )
        })}
      </Flex>
    </Box>
  )
}

export default TraitSelect
