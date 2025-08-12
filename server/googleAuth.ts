import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { storage } from "./storage";
import type { Express } from "express";

// Setup Google and GitHub OAuth strategies
export function setupOAuthStrategies(passport: any) {
  // Only setup OAuth strategies if credentials are provided
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const githubClientId = process.env.GITHUB_CLIENT_ID;
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (googleClientId && googleClientSecret) {
    // Google OAuth Strategy
    passport.use('google', new GoogleStrategy({
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: "/api/auth/google/callback"
    }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // Check if user exists
      const existingUsers = await storage.getUserByEmail(profile.emails[0].value);
      let user = existingUsers.find((u: any) => u.authProvider === 'google');
      
      if (user) {
        // Update existing user
        user = await storage.upsertUser({
          id: user.id,
          email: profile.emails[0].value,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName || '',
          profileImageUrl: profile.photos[0]?.value,
          authProvider: 'google',
        });
      } else {
        // Create new user
        const userId = `google_${profile.id}`;
        user = await storage.upsertUser({
          id: userId,
          email: profile.emails[0].value,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName || '',
          profileImageUrl: profile.photos[0]?.value,
          authProvider: 'google',
        });
      }

      // Create session user object
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
  }));
  }

  if (githubClientId && githubClientSecret) {
    // GitHub OAuth Strategy
    passport.use('github', new GitHubStrategy({
      clientID: githubClientId,
      clientSecret: githubClientSecret,
      callbackURL: "/api/auth/github/callback"
    }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // GitHub might not have email in profile, use primary email from emails array
      const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
      
      // Check if user exists
      const existingUsers = await storage.getUserByEmail(email);
      let user = existingUsers.find((u: any) => u.authProvider === 'github');
      
      if (user) {
        // Update existing user
        user = await storage.upsertUser({
          id: user.id,
          email: email,
          firstName: profile.displayName?.split(' ')[0] || profile.username,
          lastName: profile.displayName?.split(' ').slice(1).join(' ') || '',
          profileImageUrl: profile.photos[0]?.value,
          authProvider: 'github',
        });
      } else {
        // Create new user
        const userId = `github_${profile.id}`;
        user = await storage.upsertUser({
          id: userId,
          email: email,
          firstName: profile.displayName?.split(' ')[0] || profile.username,
          lastName: profile.displayName?.split(' ').slice(1).join(' ') || '',
          profileImageUrl: profile.photos[0]?.value,
          authProvider: 'github',
        });
      }

      // Create session user object
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
  }));
  }

  // Serialize/deserialize user for sessions
  passport.serializeUser((user: any, done: any) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done: any) => {
    done(null, user);
  });
}

// Add OAuth routes
export function setupOAuthRoutes(app: Express, passport: any) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const githubClientId = process.env.GITHUB_CLIENT_ID;

  if (googleClientId) {
    // Google OAuth routes
    app.get('/api/auth/google', 
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    app.get('/api/auth/google/callback', 
      passport.authenticate('google', { failureRedirect: '/onboarding' }),
      (req, res) => {
        // Successful authentication, redirect to home
        res.redirect('/');
      }
    );
  } else {
    // Fallback route when Google OAuth is not configured
    app.get('/api/auth/google', (req, res) => {
      res.status(503).json({ message: 'Google OAuth not configured' });
    });
  }

  if (githubClientId) {
    // GitHub OAuth routes
    app.get('/api/auth/github', 
      passport.authenticate('github', { scope: ['user:email'] })
    );

    app.get('/api/auth/github/callback', 
      passport.authenticate('github', { failureRedirect: '/onboarding' }),
      (req, res) => {
        // Successful authentication, redirect to home
        res.redirect('/');
      }
    );
  } else {
    // Fallback route when GitHub OAuth is not configured
    app.get('/api/auth/github', (req, res) => {
      res.status(503).json({ message: 'GitHub OAuth not configured' });
    });
  }
}