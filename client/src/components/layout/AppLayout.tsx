import { ReactNode } from "react";
import MobileNavBar from "./MobileNavBar"; 
import { useIsNativePlatform, usePlatform } from "@/hooks/use-capacitor";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
  hideFooter?: boolean;
}

export default function AppLayout({ children, hideNav = false, hideFooter = false }: AppLayoutProps) {
  const isNativePlatform = useIsNativePlatform();
  const platform = usePlatform();
  const isMobile = useIsMobile();
  
  // Determine if we should show the mobile navigation bar
  const showMobileNav = (isNativePlatform || isMobile) && !hideNav;
  
  // iOS specific class for safe area at top
  const iosHeaderClass = isNativePlatform && platform === 'ios' ? 'ios-header-safe' : '';
  
  return (
    <div className={`flex flex-col min-h-screen ${iosHeaderClass}`}>
      {/* Main content */}
      <div className="flex-1">
        {children}
      </div>
      
      {/* Mobile navigation */}
      {showMobileNav && <MobileNavBar />}
    </div>
  );
}