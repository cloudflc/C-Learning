import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { Home, Map, Trophy, User, Settings, LogOut, Menu, X, Code, Coins, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const NavItem = ({ to, icon: Icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={clsx(
        'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
        isActive 
          ? 'bg-primary-500/20 text-primary-400' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      )}
    >
      <Icon size={20} />
      <span>{children}</span>
    </Link>
  );
};

const Layout = () => {
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const getRankIcon = (rank) => {
    const icons = {
      'Bronze': '🥉',
      'Silver': '🥈', 
      'Gold': '🥇',
      'Platinum': '💎',
      'Diamond': '👑'
    };
    return icons[rank] || '🥉';
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="fixed top-0 left-0 h-full w-64 bg-slate-800 border-r border-slate-700 z-40 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2 text-xl font-bold text-white">
            <Code className="text-primary-500" />
            <span>C++ Learn</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem to="/" icon={Home}>首页</NavItem>
          <NavItem to="/levels" icon={Map}>关卡</NavItem>
          <NavItem to="/rankings" icon={Trophy}>排行榜</NavItem>
          <NavItem to="/shop" icon={ShoppingCart}>商城</NavItem>
        </nav>
        
        <div className="p-4 border-t border-slate-700">
          {user && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                {user.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span>{getRankIcon(user.rank)}</span>
                  <span className="text-white font-medium truncate">{user.username}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">EXP: {user.exp}</span>
                  <span className="text-yellow-400 flex items-center gap-1">
                    <Coins size={12} />
                    {user.coins || 0}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Link
              to="/profile"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors w-full"
            >
              <User size={20} />
              <span>个人中心</span>
            </Link>
            {user?.role === 'teacher' && (
              <Link
                to="/admin"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors w-full"
              >
                <Settings size={20} />
                <span>教师后台</span>
              </Link>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors w-full"
            >
              <LogOut size={20} />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </div>

      <div className="md:ml-64">
        <header className="md:hidden bg-slate-800 border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xl font-bold text-white">
              <Code className="text-primary-500" />
              <span>C++ Learn</span>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-slate-400 hover:text-white"
            >
              {sidebarOpen ? <X /> : <Menu />}
            </button>
          </div>
        </header>

        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 bg-slate-900/95 z-50 p-4">
            <nav className="space-y-2 mt-16">
              <NavItem to="/" icon={Home}>首页</NavItem>
              <NavItem to="/levels" icon={Map}>关卡</NavItem>
              <NavItem to="/rankings" icon={Trophy}>排行榜</NavItem>
              <NavItem to="/profile" icon={User}>个人中心</NavItem>
            </nav>
          </div>
        )}

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
