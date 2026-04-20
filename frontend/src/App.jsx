import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import './App.css';

import Sidebar from './components/common/Sidebar';
import Topbar from './components/common/Topbar';
import InstructionPanel from './components/common/InstructionPanel';
import PageBanners from './components/common/PageBanners';
import useAuthStore from './store/authStore';
import { useNavAccessByRole } from './features/app-settings/hooks/useAppSettings';

const NAV_KEY_MAP = {
    dashboard:      { path: '/' },
    map:            { path: '/map' },
    ops:            { path: '/ops' },
    logistics:      { path: '/logistics' },
    refugees:       { path: '/refugees' },
    funding:        { path: '/funding' },
    admin:          { path: '/admin' },
    instruksi:      { path: '/instruksi' },
    'app-settings': { path: '/app-settings' },
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: navConfigs } = useNavAccessByRole(user?.role);
  
  const isMapPage = location.pathname === '/map';

  // ── Enforce Navigation Access ──
  useEffect(() => {
    if (navConfigs && navConfigs.length > 0) {
      const currentPath = location.pathname;
      const navEntry = navConfigs.find(cfg => {
        const meta = NAV_KEY_MAP[cfg.nav_key];
        return meta && meta.path === currentPath;
      });

      // Jika nav item ditemukan dan dibatasi (is_visible === false)
      if (navEntry && !navEntry.is_visible) {
        const visibleEntries = navConfigs.filter(c => c.is_visible);
        if (visibleEntries.length > 0) {
          // Pilih path acak dari nav yang masih boleh diakses
          const randomNav = visibleEntries[Math.floor(Math.random() * visibleEntries.length)];
          const targetMeta = NAV_KEY_MAP[randomNav.nav_key];
          if (targetMeta) {
            navigate(targetMeta.path, { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        } else {
          // Jika semua ditutup, jatuh ke dasbor (atau throw ke login)
          navigate('/', { replace: true });
        }
      }
    }
  }, [navConfigs, location.pathname, navigate]);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Topbar />
        <PageBanners />
        <div className={`page-content${isMapPage ? ' page-map' : ''}`}>
          <Outlet />
        </div>
      </div>
      <InstructionPanel />
    </div>
  );
}

