/**
 * hooks/usePermission.js
 * Hook untuk role-based UI rendering
 *
 * Usage:
 *   const { can, isAdmin, isOperator } = usePermission();
 *   if (can('admin')) return <AdminButton />;
 */
import useAuthStore from '../store/authStore';

const ROLE_HIERARCHY = {
    viewer: 1,
    operator: 2,
    admin: 3,
    superadmin: 4,
};

export function usePermission() {
    const { user } = useAuthStore();
    const userLevel = ROLE_HIERARCHY[user?.role] || 0;

    // Cek apakah user punya minimal level role tertentu
    const can = (minRole) => {
        const required = ROLE_HIERARCHY[minRole] || 99;
        return userLevel >= required;
    };

    return {
        role: user?.role,
        can,
        isViewer: userLevel >= ROLE_HIERARCHY.viewer,
        isOperator: userLevel >= ROLE_HIERARCHY.operator,
        isAdmin: userLevel >= ROLE_HIERARCHY.admin,
        isSuperAdmin: userLevel >= ROLE_HIERARCHY.superadmin,
    };
}
