import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { MessageSquare } from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  closeMenu: () => void;
}

export default function MobileMenu({ isOpen, closeMenu }: MobileMenuProps) {
  const menuLinks = [
    { href: "#features", text: "Features" },
    { href: "#how-it-works", text: "How It Works" },
    { href: "#community", text: "Community" },
    { href: "#faq", text: "FAQ" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {menuLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                onClick={closeMenu}
              >
                {link.text}
              </a>
            ))}
            <div className="pt-2 space-y-2">
              <Button 
                variant="outline"
                className="w-full border-primary text-primary" 
                asChild
                onClick={closeMenu}
              >
                <Link href="/chat" className="flex items-center justify-center gap-1.5">
                  <MessageSquare size={16} />
                  <span>Try AI Chat</span>
                </Link>
              </Button>
              <Button 
                variant="outline"
                className="w-full border-primary text-primary" 
                asChild
                onClick={closeMenu}
              >
                <a href="#signin">Sign In</a>
              </Button>
              <Button 
                className="w-full" 
                asChild
                onClick={closeMenu}
              >
                <a href="#waitlist">Take Assessment</a>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
