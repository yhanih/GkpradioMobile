// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { supabaseStorage } from './storage-supabase';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('CRITICAL: SUPABASE_URL or VITE_SUPABASE_URL is required for authentication');
  console.error('Please set up your Supabase project and add the credentials to your .env file');
}

// Admin client for server-side operations
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;

// Helper function to verify JWT token and return user info
export async function verifyToken(token: string): Promise<{ userId: number; username: string; email: string } | null> {
  if (!supabaseAnonKey || !supabaseUrl) {
    console.error('Supabase configuration missing');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Get user details from database
    const dbUser = await supabaseStorage.getUserByEmail(user.email!);
    
    if (!dbUser) {
      return null;
    }

    return {
      userId: dbUser.id,
      username: dbUser.username,
      email: dbUser.email
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Validation schemas
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

const signupSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  // Temporarily making city and country optional due to Supabase schema sync issue
  city: z.string().optional(),
  country: z.string().optional(),
  renderAt: z.number().optional(),
  hp: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Middleware to verify Supabase token
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Please login or sign up first to continue" });
  }

  // Create a Supabase client with the user's token
  if (!supabaseAnonKey) {
    return res.status(500).json({ error: "Server configuration error - authentication unavailable" });
  }
  
  const supabase = createClient(supabaseUrl!, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return res.status(403).json({ error: "Your session has expired. Please login again" });
    }

    // Get user details from Supabase storage
    let dbUser = await supabaseStorage.getUserByEmail(user.email!);
    
    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Attach user info to request
    (req as any).user = {
      userId: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      supabaseId: user.id
    };
    
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(403).json({ error: "Authentication failed" });
  }
}

// Auth endpoints
export const authRoutes = {
  // Sign up
  async signup(req: Request, res: Response) {
    try {
      const validatedData = signupSchema.parse(req.body);
      
      // Check if username already exists in our database via Supabase
      const existingUser = await supabaseStorage.getUserByUsername(validatedData.username);
      
      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Check if email already exists
      const existingEmail = await supabaseStorage.getUserByEmail(validatedData.email);
      
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Create Supabase auth user using admin client to bypass email restrictions
      if (!supabaseAdmin) {
        return res.status(500).json({ 
          error: "Server configuration error. Please contact admin." 
        });
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: validatedData.email,
        password: validatedData.password,
        email_confirm: true,
        user_metadata: {
          username: validatedData.username,
          city: validatedData.city,
          country: validatedData.country
        }
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        
        if (authError.message?.includes('already registered')) {
          return res.status(400).json({ error: "Email already registered" });
        }
        return res.status(400).json({ 
          error: authError.message || "Failed to create account" 
        });
      }

      if (!authData.user) {
        return res.status(400).json({ error: "Failed to create account" });
      }

      // Create user in our database via Supabase storage
      // Note: Using minimal fields due to Supabase schema differences
      const newUser = await supabaseStorage.createUser({
        username: validatedData.username,
        email: validatedData.email
        // Password is handled by Supabase Auth, not stored in our table
      });

      // Sign in the user immediately after creation
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: validatedData.email,
      });

      res.status(201).json({ 
        message: "Account created successfully",
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          city: newUser.city,
          country: newUser.country
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: error.errors[0]?.message || "Invalid data" 
        });
      }
      console.error('Signup error:', error);
      res.status(500).json({ error: "Failed to create account" });
    }
  },

  // Sign in
  async signin(req: Request, res: Response) {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // First check if user exists in our database via Supabase storage
      const user = await supabaseStorage.getUserByUsername(validatedData.username);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Use service role client to sign in
      if (!supabaseAnonKey) {
        return res.status(500).json({ error: "Server configuration error - authentication unavailable" });
      }

      const supabase = createClient(supabaseUrl!, supabaseAnonKey);

      // Sign in with Supabase Auth using email (not username)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: validatedData.password
      });

      if (authError || !authData.session) {
        console.error('Supabase signin error:', authError);
        return res.status(401).json({ error: "Invalid username or password" });
      }

      res.json({
        message: "Login successful",
        token: authData.session.access_token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          city: user.city,
          country: user.country
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: error.errors[0]?.message || "Invalid data" 
        });
      }
      console.error('Signin error:', error);
      res.status(500).json({ error: "Login failed" });
    }
  },

  // Sign out
  async signout(req: Request, res: Response) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl!, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        });
        
        await supabase.auth.signOut();
      }

      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error('Signout error:', error);
      // Still return success even if signout fails
      res.json({ message: "Logged out successfully" });
    }
  },

  // Get current user
  async getMe(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await supabaseStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        city: user.city,
        country: user.country,
        bio: user.bio,
        createdAt: user.createdAt
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: "Failed to get user information" });
    }
  },

  // Refresh token
  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token required" });
      }

      if (!supabaseAnonKey) {
        return res.status(500).json({ error: "Server configuration error - authentication unavailable" });
      }

      const supabase = createClient(supabaseUrl!, supabaseAnonKey);
      
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error || !data.session) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      res.json({
        token: data.session.access_token,
        refreshToken: data.session.refresh_token
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({ error: "Failed to refresh token" });
    }
  }
};