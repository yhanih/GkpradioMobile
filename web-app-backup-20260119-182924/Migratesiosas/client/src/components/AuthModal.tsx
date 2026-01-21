import { useState } from "react";
import { X, User, Mail, Lock, Eye, EyeOff, MapPin, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
// TurnstileGate removed per user request
import { countries, getCitiesByCountry, getCountryName, type LocationOption } from "@shared/locations";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: () => void;
}

const AuthModal = ({ isOpen, onClose, onLogin }: AuthModalProps) => {
  const { toast } = useToast();
  const { signIn: authSignIn, signUp: authSignUp } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ 
    username: "", 
    email: "", 
    password: "", 
    confirmPassword: "",
    city: "",
    country: ""
  });
  const [availableCities, setAvailableCities] = useState<LocationOption[]>([]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  // Turnstile token removed per user request
  const [formRenderTime] = useState(Date.now());

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await authSignIn(loginForm.email, loginForm.password);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Welcome back!",
        description: `Successfully signed in`,
      });
      onLogin?.();
      onClose();
      setLocation("/profile");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupForm.password !== signupForm.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    // CAPTCHA verification removed per user request
    
    setIsLoading(true);
    
    try {
      // Prepare user metadata
      const userMetadata = {
        username: signupForm.username,
        displayName: signupForm.username,
        city: signupForm.city,
        country: signupForm.country,
      };

      const { error } = await authSignUp(signupForm.email, signupForm.password, userMetadata);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Welcome to GKP Radio!",
        description: `Account created successfully`,
      });
      onLogin?.();
      onClose();
      setLocation("/profile");
    } catch (error) {
      let errorMessage = "Failed to create account";
      
      if (error instanceof Error) {
        if (error.message.includes("rate_limit")) {
          errorMessage = "Too many signup attempts. Please wait before trying again.";
        } else if (error.message.includes("captcha")) {
          errorMessage = "Security verification failed.";
          // CAPTCHA functionality removed
        } else if (error.message.includes("too_fast")) {
          errorMessage = "Please wait a moment before submitting.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-center">
            Join GKP Radio Community
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Sign in to your account or create a new one to access exclusive features
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Join Us</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full btn-faith-gold" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="text-center">
              <Button variant="link" className="text-sm text-muted-foreground">
                Forgot your password?
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="signup-username"
                    placeholder="Choose a username"
                    className="pl-10"
                    value={signupForm.username}
                    onChange={(e) => setSignupForm({...signupForm, username: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="signup-country">Country</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
                    <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={countryOpen}
                          className="w-full justify-between pl-10 font-normal"
                          data-testid="select-country"
                        >
                          {signupForm.country
                            ? getCountryName(signupForm.country)
                            : "Search country..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search country..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                              {countries.map((country) => (
                                <CommandItem
                                  key={country.value}
                                  value={country.label}
                                  onSelect={() => {
                                    setSignupForm({...signupForm, country: country.value, city: ""});
                                    setAvailableCities(getCitiesByCountry(country.value));
                                    setCountryOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      signupForm.country === country.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {country.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-city">City</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
                    <Popover open={cityOpen} onOpenChange={setCityOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={cityOpen}
                          className="w-full justify-between pl-10 font-normal"
                          data-testid="select-city"
                          disabled={!signupForm.country}
                        >
                          {signupForm.city
                            ? availableCities.find(city => city.value === signupForm.city)?.label || signupForm.city
                            : signupForm.country 
                              ? "Search city..." 
                              : "Choose country first"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search city..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No city found.</CommandEmpty>
                            <CommandGroup>
                              {availableCities.map((city) => (
                                <CommandItem
                                  key={city.value}
                                  value={city.label}
                                  onSelect={() => {
                                    setSignupForm({...signupForm, city: city.value});
                                    setCityOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      signupForm.city === city.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {city.label}
                                </CommandItem>
                              ))}
                              {availableCities.length === 0 && signupForm.country && (
                                <CommandItem
                                  value="other"
                                  onSelect={() => {
                                    setSignupForm({...signupForm, city: "other"});
                                    setCityOpen(false);
                                  }}
                                  className="text-muted-foreground"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      signupForm.city === "other" ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  Other (Contact support to add your city)
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    className="pl-10 pr-10"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    className="pl-10"
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm({...signupForm, confirmPassword: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* CAPTCHA/Spam Protection removed per user request */}

              <Button type="submit" className="w-full btn-faith-primary" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Join Community"}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center">
              By joining, you agree to our Terms of Service and Privacy Policy
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;