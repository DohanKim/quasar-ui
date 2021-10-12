import TopBar from './components/TopBar'
import Home from './components/Home'
import Admin from './components/Admin'
import Notifications from './components/Notification'
import useWallet from './hooks/useWallet'
import { BrowserRouter, Route } from 'react-router-dom'
import useHydrateStore from './hooks/useHydrateStore'

function App() {
  useWallet()
  useHydrateStore()

  return (
    <div className="App">
      <BrowserRouter>
        <Notifications />
        <TopBar />
        <>
          <Route exact path="/" component={Home} />
          <Route path="/admin" component={Admin} />
        </>
      </BrowserRouter>
    </div>
  )
}

export default App
