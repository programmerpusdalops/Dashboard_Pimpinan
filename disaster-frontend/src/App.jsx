import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './components/common/Sidebar';
import Topbar from './components/common/Topbar';

const pageTitles = {
  '/': 'Executive Command View',
  '/map': 'Risk & Impact Map',
  '/ops': 'Operations Center (ICS)',
  '/logistics': 'Logistics & Distribution',
  '/refugees': 'Refugee Services',
  '/funding': 'Funding & Budget',
  '/admin': 'Admin Panel',
};

export default function App() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';
  const isMapPage = location.pathname === '/map';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Topbar title={title} />
        <div className={`page-content${isMapPage ? ' page-map' : ''}`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
