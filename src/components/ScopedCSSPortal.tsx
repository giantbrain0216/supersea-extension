import { Portal } from '@chakra-ui/portal'
import { SCOPED_CLASS_NAME } from './ScopedCSSReset'

const ScopedCSSPortal = ({ children }: React.PropsWithChildren<{}>) => (
  <Portal>
    <span className={SCOPED_CLASS_NAME}>{children}</span>
  </Portal>
)

export default ScopedCSSPortal
