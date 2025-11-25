import { useState } from 'react';
import { User, Mail, Lock, LogOut, Shield, FileText, UserCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../utils/AuthContext';
import { toast } from 'sonner@2.0.3';

interface ProfileScreenProps {
  onNavigate?: (screen: string) => void;
}

export function ProfileScreen({ onNavigate }: ProfileScreenProps) {
  const { user, signIn, signUp, signOut } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const result = await signUp(formData.email, formData.password, formData.name);
        if (result.success) {
          toast.success('Account created successfully!');
          setFormData({ email: '', password: '', name: '' });
        } else {
          toast.error(result.error || 'Failed to create account');
        }
      } else {
        const result = await signIn(formData.email, formData.password);
        if (result.success) {
          toast.success('Signed in successfully!');
          setFormData({ email: '', password: '', name: '' });
        } else {
          toast.error(result.error || 'Failed to sign in');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully!');
  };

  if (user) {
    return (
      <div className="pb-32 pt-4 px-4">
        <div className="space-y-4">
          {/* Profile Header with Glass */}
          <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl rounded-3xl border border-primary/20 shadow-lg shadow-black/5">
            <div className="flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-primary/15 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg border border-primary/10">
                <UserCircle className="h-12 w-12 text-primary" />
              </div>
              <h2 className="font-semibold mb-1">{user.name || 'User'}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Account Options with Glass */}
          <div className="divide-y bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-lg shadow-black/5 overflow-hidden">
            <button
              onClick={() => onNavigate?.('privacy')}
              className="w-full flex items-center gap-3 p-4 hover:bg-white/80 transition-colors"
            >
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="text-[15px]">Privacy Policy</span>
            </button>
            <button
              onClick={() => onNavigate?.('terms')}
              className="w-full flex items-center gap-3 p-4 hover:bg-white/80 transition-colors"
            >
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-[15px]">Terms of Service</span>
            </button>
          </div>

          {/* Sign Out Button */}
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground bg-white/60 backdrop-blur-xl rounded-2xl"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>

          {/* App Info */}
          <div className="text-center text-sm text-muted-foreground pt-4">
            <p>GKP Radio</p>
            <p>Version 1.0.0</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-6 px-4">
      <div className="max-w-sm mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-lg border border-primary/5">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-bold mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp 
              ? 'Join our faith community to interact and share' 
              : 'Sign in to interact with the community'}
          </p>
        </div>

        {/* Auth Form with Glass */}
        <div className="p-6 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-lg shadow-black/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 bg-white/80 backdrop-blur-sm rounded-2xl"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 bg-white/80 backdrop-blur-sm rounded-2xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 bg-white/80 backdrop-blur-sm rounded-2xl"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full rounded-2xl shadow-lg shadow-primary/25" disabled={loading}>
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setFormData({ email: '', password: '', name: '' });
              }}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        {/* Info Card with Glass */}
        <div className="p-4 bg-muted/30 backdrop-blur-xl rounded-3xl border border-white/40">
          <p className="text-xs text-muted-foreground text-center">
            Sign in to post prayer requests, share testimonies, and engage with our faith community. 
            You can listen to the radio and view content without an account.
          </p>
        </div>

        {/* Legal Links */}
        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
          <button onClick={() => onNavigate?.('privacy')} className="hover:text-primary">
            Privacy Policy
          </button>
          <span>•</span>
          <button onClick={() => onNavigate?.('terms')} className="hover:text-primary">
            Terms of Service
          </button>
        </div>
      </div>
    </div>
  );
}