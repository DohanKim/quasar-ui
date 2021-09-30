import useQuasarStore from '../stores/useQuasarStore'

export function notify(newNotification: {
    type?: 'success' | 'info' | 'error'
    title: string
    description?: string
    txid?: string
}) {
    const setQuasarStore = useQuasarStore.getState().set
    const notifications = useQuasarStore.getState().notifications

    setQuasarStore((state) => {
        state.notifications = [
            ...notifications,
            { type: 'success', ...newNotification },
        ]
    })
}
