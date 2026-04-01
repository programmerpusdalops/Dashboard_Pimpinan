import { Outlet, useLocation } from 'react-router-dom';
import './App.css';

import Sidebar from './components/common/Sidebar';
import Topbar from './components/common/Topbar';
import InstructionPanel from './components/common/InstructionPanel';

const pageTitles = {
  '/': 'Dasbor Utama',
  '/map': 'Peta Risiko & Dampak',
  '/ops': 'Pusat Pengendalian',
  '/logistics': 'Logistik & Peralatan',
  '/refugees': 'Data Pengungsi',
  '/funding': 'Anggaran & Pendanaan',
  '/admin': 'Pengaturan Master',
  '/instruksi': 'Log Instruksi Pimpinan',
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
      <InstructionPanel />
    </div>
  );
}

