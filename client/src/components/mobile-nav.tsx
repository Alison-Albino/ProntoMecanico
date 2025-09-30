import { Link, useLocation } from 'wouter';
import { Home, History, User, Wallet } from 'lucide-react';

export function MobileNav() {
  const [location] = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/history', icon: History, label: 'Histórico' },
    { path: '/wallet', icon: Wallet, label: 'Carteira' },
    { path: '/profile', icon: User, label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              data-testid={`link-nav-${item.label.toLowerCase()}`}
            >
              <button
                className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover-elevate'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
