import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-black dark:text-white">
      <Navbar />
      <div className="flex">
        <Sidebar className = "transition-colors duration-300" />
        <main className="flex-1 p-6 lg:ml-64 mt-16 bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
