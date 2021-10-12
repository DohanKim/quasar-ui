import useQuasarStore from '../stores/useQuasarStore'
import { mangoProgramId } from '../stores/useQuasarStore'
import { notify } from '../utils/notifications'

const InitQuasarGroupButton = () => {
  const quasarClient = useQuasarStore((s) => s.connection.client)

  const initQuasarGroup = async () => {
    const wallet = useQuasarStore.getState().wallet.current

    try {
      const quasarGroupPk = await quasarClient.initQuasarGroup(
        mangoProgramId,
        wallet,
      )
      notify({
        title: 'quasar group initialized',
      })

      console.log(await quasarClient.getQuasarGroup(quasarGroupPk))
      console.log(quasarGroupPk.toString())
    } catch (err) {
      console.warn('Error initializing quasar group:', err)
      notify({
        title: 'Could not initialize quasar group',
        description: `${err}`,
        type: 'error',
      })
    }
  }

  return (
    <>
      <div className="m-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => initQuasarGroup()}
        >
          init quasar group
        </button>
      </div>
    </>
  )
}

export default InitQuasarGroupButton
