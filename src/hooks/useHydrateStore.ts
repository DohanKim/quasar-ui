import { useEffect } from 'react'
import useQuasarStore from '../stores/useQuasarStore'
import useInterval from './useInterval'

const SECONDS = 1000
const _SLOW_REFRESH_INTERVAL = 20 * SECONDS

const useHydrateStore = () => {
  const setQuasarStore = useQuasarStore((s) => s.set)
  const actions = useQuasarStore((s) => s.actions)
  const markets = useQuasarStore((s) => s.selectedMangoGroup.markets)
  const connection = useQuasarStore((s) => s.connection.current)

  useEffect(() => {
    actions.fetchQuasarGroup()
    actions.fetchMangoGroup()
  }, [actions])

  useInterval(() => {
    actions.fetchQuasarGroup()
    actions.fetchMangoGroup()
  }, 120 * SECONDS)
}

export default useHydrateStore
