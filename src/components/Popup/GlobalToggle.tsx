import {
  Switch,
  FormControl,
  FormHelperText,
  FormLabel,
} from '@chakra-ui/react'

const GlobalToggle = ({
  isChecked,
  onChange,
  ...rest
}: {
  isChecked: boolean
  onChange: (isChecked: boolean) => void
} & Omit<React.ComponentProps<typeof FormControl>, 'onChange'>) => {
  return (
    <FormControl {...rest}>
      <FormLabel htmlFor="quick-buy" fontSize="sm">
        Enable SuperSea
      </FormLabel>
      <Switch
        id="quick-buy"
        isChecked={isChecked}
        onChange={() => {
          onChange(!isChecked)
        }}
      />
      <FormHelperText color="gray.400">
        Allow SuperSea to inject into OpenSea web pages.
      </FormHelperText>
    </FormControl>
  )
}

export default GlobalToggle
