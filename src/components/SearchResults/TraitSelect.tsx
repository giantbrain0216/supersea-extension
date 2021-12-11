import _ from 'lodash'
import { useMemo, useState } from 'react'
import { CheckIcon } from '@chakra-ui/icons'
import { FaListUl } from 'react-icons/fa'
import {
  Input,
  useColorModeValue,
  Text,
  Box,
  Flex,
  Tag,
  TagLabel,
  TagCloseButton,
} from '@chakra-ui/react'
import SelectSearch from 'react-select-search'
import { Trait } from '../../utils/api'
import TraitTag from './TraitTag'

const TraitSelect = ({
  traits,
  value,
  onChange,
}: {
  traits: Trait[]
  value: string[]
  onChange: (value: string[]) => void
}) => {
  const [focused, setFocused] = useState(false)
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

  return (
    <Box
      width="100%"
      color={useColorModeValue('black', 'white')}
      sx={{
        '.select-search__select': {
          background: useColorModeValue('gray.50', 'gray.800'),
          marginTop: '10px',
          position: 'absolute',
          top: '100%',
          left: 0,
          width: '100%',
          borderRadius: '5px',
          overflow: 'auto',
          maxHeight: '300px',
          zIndex: 99,
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
          onChange={onChange as any}
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
