import { Link, useLocation } from 'react-router-dom';

const MENU = [
  { path: '/', label: 'Tableau de bord', roles: ['ADMIN', 'COORDINATOR'] },
  { path: '/alerts', label: '🔔 Alertes', roles: ['ADMIN', 'COORDINATOR'] },
  { path: '/map', label: '🌍 Carte', roles: ['ADMIN', 'COORDINATOR'] },
  { path: '/inventory', label: '📦 Stocks', roles: ['ADMIN', 'COORDINATOR'] },
  { path: '/users', label: '👥 Utilisateurs', roles: ['ADMIN'] },
  { path: '/my-missions', label: '🎯 Mes Missions', roles: ['ADMIN', 'COORDINATOR', 'VOLUNTEER'] },
];

export default function Sidebar({ role }) {
  const location = useLocation();
  const allowed = MENU.filter((item) => item.roles.includes(role));

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {allowed.map((item) => {
        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
              isActive
                ? 'bg-slate-200 text-slate-900'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
