import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AppHeader from '../components/AppHeader/AppHeader.jsx'
import NavBar from '../components/NavBar/NavBar.jsx'
import './Layout.css'

function Layout() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="layout">
      <AppHeader />
      <main className="layout-main">
        <div key={location.pathname} className="layout-page">
          <Outlet />
        </div>
      </main>
      <NavBar />
    </div>
  )
}

export default Layout
