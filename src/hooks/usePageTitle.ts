import { useEffect } from 'react'

const SUFFIX = 'CLBR Org Chart'

export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} — ${SUFFIX}` : SUFFIX
    return () => {
      document.title = previous
    }
  }, [title])
}
