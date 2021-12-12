import { Portal } from '@chakra-ui/portal'
import { SCOPED_CLASS_NAME } from './ScopedCSSReset'

const getOrCreatePortal = () => {
  let portal = document.getElementById('SuperSea__Portal')
  if (!portal) {
    portal = document.createElement('div')
    portal.id = 'SuperSea__Portal'
    portal.classList.add(SCOPED_CLASS_NAME)
    document.body.appendChild(portal)
  }
  return { current: portal }
}

const ScopedCSSPortal = ({ children }: React.PropsWithChildren<{}>) => (
  <Portal containerRef={getOrCreatePortal()}>{children}</Portal>
)

export default ScopedCSSPortal
