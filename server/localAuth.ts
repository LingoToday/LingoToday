import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { Express } from "express";
import { z } from "zod";

// Registration schema
export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
});

export type RegisterRequest = z.infer<typeof registerSchema>;

// Setup local authentication strategy
export function setupLocalAuth(passport: any) {
  // Local login strategy
  passport.use('local-login', new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email: string, password: string, done: any) => {
      try {
        // Find user by email with local auth provider
        const users = await storage.getUserByEmail(email);
        const user = users.find((u: any) => u.authProvider === 'local');
        
        if (!user || !user.password) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Create user session object similar to OAuth
        const sessionUser = {
          claims: {
            sub: user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            profile_image_url: user.profileImageUrl,
          }
        };

        return done(null, sessionUser);
      } catch (error) {
        return done(error);
      }
    }
  ));
}

// Register user function
export async function registerUser(userData: RegisterRequest) {
  const { email, password, firstName, lastName } = userData;
  
  // Check if user already exists with local auth
  const existingUsers = await storage.getUserByEmail(email);
  const localUser = existingUsers.find((u: any) => u.authProvider === 'local');
  
  if (localUser) {
    throw new Error('User already exists with this email');
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Generate unique user ID for local users
  const userId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create user
  const user = await storage.upsertUser({
    id: userId,
    email,
    firstName,
    lastName: lastName || '', // Default to empty string if not provided
    password: hashedPassword,
    authProvider: 'local',
  });

  return user;
}

// Add routes for local authentication
export function setupLocalRoutes(app: Express, passport: any) {
  // Register endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const user = await registerUser(userData);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName || '',
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }
      
      if (error instanceof Error && error.message === 'User already exists with this email') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local-login', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Authentication error'
        });
      }
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: info?.message || 'Invalid credentials'
        });
      }

      req.logIn(user, (err: any) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Login session error'
          });
        }
        
        res.json({
          success: true,
          message: 'Login successful',
          user: {
            id: user.claims.sub,
            email: user.claims.email,
            firstName: user.claims.first_name,
            lastName: user.claims.last_name,
          }
        });
      });
    })(req, res, next);
  });
}