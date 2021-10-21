import TopBar from './components/TopBar'
import Admin from './components/Admin'
import Notifications from './components/Notification'
import useWallet from './hooks/useWallet'
import { BrowserRouter, Route } from 'react-router-dom'
import useHydrateStore from './hooks/useHydrateStore'
import TokenList from './components/TokenList'
import LeverageTokenDetail from './components/LeverageTokenDetail'

function App() {
  useWallet()
  useHydrateStore()

  return (
    <div className="App">
      <BrowserRouter>
        <Notifications />
        <TopBar />
        <>
          <Route exact path="/" component={TokenList} />
          <Route exact path="/tokens" component={TokenList} />
          <Route path="/tokens/:tokenMint" component={LeverageTokenDetail} />
          <Route path="/admin" component={Admin} />
        </>
      </BrowserRouter>
    </div>
  )
}

export default App
