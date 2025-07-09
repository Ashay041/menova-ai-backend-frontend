import { useState, useEffect } from "react";
import { Heart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileMenu from "@/components/ui/mobile-menu";
import { Link } from "wouter";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const headerClasses = `sticky top-0 z-50 w-full border-b transition-all ${
    scrolled ? "bg-white/90 backdrop-blur-sm border-gray-200 shadow-sm" : "bg-white border-transparent"
  }`;

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <div className="flex items-center space-x-2">
  <a href="#" className="flex items-center space-x-2">
    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
      <Heart size={20} />
    </div>
    <span className="text-xl font-bold text-gray-900">Menova<span className="text-primary">.ai</span></span>
  </a>
  {/* Maya Temporary Chat Icon */}
  <div className="ml-3 flex items-center">
    <button
      type="button"
      onClick={() => alert('Open Maya (Emotional Agent)')}
      className="w-9 h-9 flex items-center justify-center border-2 border-dashed border-gray-400 rounded-full bg-white hover:border-primary hover:bg-primary/5 transition-colors shadow-sm"
      title="Open Maya (Emotional Agent)"
      aria-label="Open Maya (Emotional Agent)"
    >
      {/* Use a Lucide icon for Maya, e.g., User or MessageCircle */}
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
  <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
  <path d="M15.5 15.5c-1.38-1.38-3.62-1.38-5 0M12 13a3 3 0 100-6 3 3 0 000 6z" />
</svg>
<span className="ml-2 text-xs text-primary font-semibold">Maya</span>
    </button>
  </div>
</div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors">
              How It Works
            </a>
            <a href="#community" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors">
              Community
            </a>
            <a href="#faq" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors">
              FAQ
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex space-x-3">
            <Button variant="outline" asChild className="border-primary text-primary hover:bg-primary/10">
              <Link href="/chat" className="flex items-center gap-1.5">
                <MessageSquare size={16} />
                <span>Try AI Chat</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-primary text-primary hover:bg-primary/10">
              <a href="#signin">Sign In</a>
            </Button>
            <Button asChild>
              <a href="#waitlist">Take Assessment</a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} closeMenu={() => setMobileMenuOpen(false)} />
    </header>
  );
}
