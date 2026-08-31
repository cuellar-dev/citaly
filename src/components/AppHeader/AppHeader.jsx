import { useAppHeader } from '../../hooks/useAppHeader.js'
import { Search, Ellipsis, Plus,ClipboardClock,Bell,Pencil } from 'lucide-react'
import './AppHeader.css'


function getHeaderIcons(title) {
  switch (title) {
    case 'Descubre':
      return [
        {
          name: 'search',
          content: <Search size={25} color="currentColor" />,
        },
        {
          name: 'settings',
          content: <Ellipsis size={25} color="currentColor" />,
        },
      ]

    case 'Mis Citas':
      return [
        {
          name: 'plus',
          content: <Plus size={24} color="currentColor" />,
        },
        {
          name: 'clipboard-clock',
          content: <ClipboardClock size={24} color="currentColor" />,
        },
        {
          name: 'settings',
          content: <Ellipsis size={24} color="currentColor" />,
        },
      ]

    case 'Mi Negocio':
      return [
        {
          name: 'notification',
          content: <Bell size={24} color="currentColor" />,
        },
        {
          name: 'settings',
          content: <Ellipsis size={24} color="currentColor" />,
        },
      ]

    case 'Mi Perfil':
      return [
        {
          name: 'edit',
          content: <Pencil size={24} color="currentColor" />,
        },
        {
          name: 'settings',
          content: <Ellipsis size={24} color="currentColor" />,
        },
      ]
      
    default:
      return []
  }
}

function AppHeader() {
  const { visible, title } = useAppHeader()

  if (!visible) return null
  let change = false
  const icons = getHeaderIcons(title)
  if (title === 'Mi Perfil') {
    change = true
  }
  return (
    <header className="app-header">
      <div className="app-header-inner" style={{ backgroundColor: change ? 'var(--colors-background-primary)' : 'transparent' , borderBottom: change ? '1px solid var(--colors-border-primary)' : 'none' }}>
        <span className="app-header-brand">Citaly</span>
        <h1 className="app-header-title">{title}</h1>
      </div>
      <div className="app-header-icons">
        {icons.map((icon) => (
          <span className="app-header-icon" key={icon.name}>
            {icon.content}
          </span>
        ))}
      </div>
    </header>
  )
}

export default AppHeader
