import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import LoginPage from '../features/auth/LoginPage';
import ExecutivePage from '../features/executive/ExecutivePage';
import MapPage from '../features/map/MapPage';
import OpsPage from '../features/operations/OpsPage';
import LogisticsPage from '../features/logistics/LogisticsPage';
import RefugeesPage from '../features/refugees/RefugeesPage';
import FundingPage from '../features/funding/FundingPage';
import AdminPage from '../features/admin/AdminPage';
import InstructionLogPage from '../features/instructions/InstructionLogPage';
import AppSettingsPage from '../features/app-settings/AppSettingsPage';
import ProtectedRoute from '../components/common/ProtectedRoute';

const router = createBrowserRouter([
    { path: '/login', element: <LoginPage /> },
    {
        path: '/',
        element: <ProtectedRoute><App /></ProtectedRoute>,
        children: [
            { index: true, element: <ExecutivePage /> },
            { path: 'map', element: <MapPage /> },
            { path: 'ops', element: <OpsPage /> },
            { path: 'logistics', element: <LogisticsPage /> },
            { path: 'refugees', element: <RefugeesPage /> },
            { path: 'funding', element: <FundingPage /> },
            { path: 'admin', element: <AdminPage /> },
            { path: 'instruksi', element: <InstructionLogPage /> },
            { path: 'app-settings', element: <AppSettingsPage /> },
        ],
    },
]);

export default router;

