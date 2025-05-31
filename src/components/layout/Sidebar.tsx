
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Mail, Inbox, Settings, LogOut, Server, Send, Edit, FileText } from 'lucide-react';
import { loadConfig } from '@/lib/config';

const Sidebar = () => {
  const location = useLocation();
  const config = loadConfig();
  
  const isActive = (path: string) => {
    return location.pathname === path || 
      (path !== '/' && location.pathname.startsWith(path));
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Compor',
      href: '/compose',
      icon: Edit,
    },
    {
      name: 'Todos',
      href: '/inbox',
      icon: Inbox,
    },
    {
      name: 'Enviados',
      href: '/sent',
      icon: Send,
    },
    {
      name: 'Recebidos',
      href: '/received',
      icon: Mail,
    },
    {
      name: 'Templates',
      href: '/templates',
      icon: FileText,
    },
    {
      name: 'Configurações',
      href: '/settings',
      icon: Settings,
    },
  ];

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border min-h-screen flex flex-col">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-6">
          <Server className="h-6 w-6 text-sidebar-primary" />
          <h1 className="font-semibold text-lg">{config?.app_name || 'Mail Nexus Gateway'}</h1>
        </div>
      </div>
      
      <div className="flex-1 px-3 py-2">
        <div className="space-y-2">
          {navigationItems.map((item) => (
            <Link key={item.href} to={item.href} className="block">
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground py-3 h-auto',
                  isActive(item.href) && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span className="text-left">{item.name}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>

      <div className="p-3 mt-auto border-t border-sidebar-border">
        <div className="flex flex-col">
          <div className="flex items-center mb-3 px-2 py-1">
            <div className="ml-2">
              <p className="text-xs text-sidebar-foreground/70">{config?.server.domain || 'Sem domínio configurado'}</p>
              <p className="text-xs text-sidebar-foreground/50">{config?.server.vps_ip || 'IP não configurado'}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogOut className="h-5 w-5 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
