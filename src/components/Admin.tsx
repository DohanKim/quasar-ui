import InitQuasarGroupButton from './InitQuasarGroupButton'
import AddBaseTokenForm from './AddBaseTokenForm'
import AddLeverageTokenForm from './AddLeverageTokenForm'

const Admin = () => {
  return (
    <>
      <div>
        Admin page
        <InitQuasarGroupButton />
        <AddBaseTokenForm />
        <AddLeverageTokenForm />
      </div>
    </>
  )
}

export default Admin
