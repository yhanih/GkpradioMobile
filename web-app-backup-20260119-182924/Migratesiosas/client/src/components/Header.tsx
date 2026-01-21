import { useState } from "react";
import { Menu, X, Radio, Heart, User, LogOut, Bell, Store } from '@/lib/icons';
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Button3D from "./Button3D";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import AuthModal from "./AuthModal";
import SearchComponent from "./SearchComponent";
import DonationModal from "./DonationModal";
import { NotificationBell } from "./NotificationBell";
import { useAuth } from "@/contexts/AuthContext";

import unnamed from "@assets/unnamed.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const { user, signOut } = useAuth();

  const navigationItems = [
    { name: "Home", href: "/" },
    { name: "Community", href: "/community" },
    { name: "Podcasts", href: "/podcasts" },
    { name: "Video", href: "/videos" },
    { name: "Live Studio", href: "/live" },
    { name: "Promotions", href: "/promotions" }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 overflow-hidden">
      <div className="container mx-auto px-4 w-full max-w-full">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src={unnamed}
              alt="GKP Radio"
              width="192"
              height="48"
              loading="eager"
              decoding="async"
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search Component */}
          <div className="hidden md:flex">
            <SearchComponent />
          </div>

          {/* Merch Button */}
          <div className="hidden lg:flex">
            <Button3D href="/merch" variant="primary">
              <Store className="h-4 w-4 mr-2" />
              Merch
            </Button3D>
          </div>

          {/* CTA Button and User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button variant="outline" className="font-medium" onClick={() => setIsDonationOpen(true)}>
                  <Heart className="w-4 h-4 mr-2" />
                  Donate
                </Button>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-10 w-10 rounded-full p-0 hover:bg-transparent hover:opacity-80 transition-opacity"
                      aria-label="User menu"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.user_metadata?.avatar || ""} alt={user.user_metadata?.displayName || user.email} />
                        <AvatarFallback className="bg-accent text-accent-foreground">
                          {(user.user_metadata?.username || user.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.user_metadata?.displayName || user.user_metadata?.username || user.email?.split('@')[0] || 'User'}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/notifications" className="flex items-center">
                        <Bell className="mr-2 h-4 w-4" />
                        <span>Notifications</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Heart className="mr-2 h-4 w-4" />
                      <span>My Prayers</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsAuthOpen(true)}>
                  Sign In
                </Button>
                <Button className="btn-faith-gold font-medium" onClick={() => setIsDonationOpen(true)}>
                  <Heart className="w-4 h-4 mr-2" />
                  Donate
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-secondary transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-3">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t pt-4">
                <Button3D 
                  href="/merch" 
                  variant="primary" 
                  className="w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Store className="h-4 w-4 mr-2" />
                  Merch
                </Button3D>
              </div>
              {user ? (
                <div className="pt-4 border-t">
                  <div className="flex items-center space-x-2 mb-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                        {(user.user_metadata?.username || user.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{user.user_metadata?.displayName || user.user_metadata?.username || user.email?.split('@')[0] || 'User'}</span>
                  </div>
                  <Button onClick={() => signOut()} variant="outline" className="w-full">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </Button>
                </div>
              ) : (
                <div className="pt-4 border-t space-y-2">
                  <Button onClick={() => setIsAuthOpen(true)} variant="outline" className="w-full">
                    Sign In
                  </Button>
                  <Button className="btn-faith-gold font-medium w-full" onClick={() => setIsDonationOpen(true)}>
                    <Heart className="w-4 h-4 mr-2" />
                    Donate
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onLogin={() => setIsAuthOpen(false)} 
      />
      <DonationModal 
        isOpen={isDonationOpen} 
        onClose={() => setIsDonationOpen(false)} 
      />
    </header>
  );
};

export { Header };
export default Header;