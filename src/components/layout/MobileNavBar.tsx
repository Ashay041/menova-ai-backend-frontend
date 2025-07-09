import { Link, useLocation } from "wouter";
import { Home, MessageCircle, Activity, Users } from "lucide-react";
import { useIsNativePlatform, usePlatform } from "@/hooks/use-capacitor";

export default function MobileNavBar() {
  const [location] = useLocation();
  const isNativePlatform = useIsNativePlatform();
  const platform = usePlatform();
  
  // iOS specific class for safe area at bottom
  const iosBottomClass = isNativePlatform && platform === 'ios' ? 'ios-bottom-safe' : '';
  
  // Define the navigation items
  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: <Home className="h-5 w-5" />,
      active: location === '/'
    },
    {
      label: 'Chat',
      href: '/chat',
      icon: <MessageCircle className="h-5 w-5" />,
      active: location === '/chat'
    },
    {
      label: 'Track',
      href: '/track',
      icon: <Activity className="h-5 w-5" />,
      active: location === '/track'
    },
    {
      label: 'Community',
      href: '/community',
      icon: <Users className="h-5 w-5" />,
      active: location === '/community'
    },
  ];
  
  return (
  // To change the nav bar background, use one of these options:
  // Option 1: Light Coral (matches tabs)
  // <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-[#FFD7D0] border-t border-gray-200 ${iosBottomClass}`}>

  // Option 2: Tailwind orange-50 (very subtle)
  // <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-orange-50 border-t border-gray-200 ${iosBottomClass}`}>

  // Option 3: Transparent primary/20
  <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#FFD7D0] shadow-md ${iosBottomClass}`}>

      <div className="grid grid-cols-4 max-w-md mx-auto">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a className="flex flex-col items-center justify-center py-2 px-1">
              <div 
                className={`p-2 rounded-full ${
                  item.active 
                    ? 'text-[#f26158] bg-[#ffd7d0]' 
                    : 'text-gray-500'
                }`}
              >
                {item.icon}
              </div>
              <span 
                className={`text-xs mt-1 ${
                  item.active 
                    ? 'text-[#f26158] font-medium' 
                    : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </a>
          </Link>
        ))}
      </div>
    </nav>
  );
}