import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  private currentSession = signal<Session | null>(null);

  readonly user = computed(() => this.currentUser());
  readonly session = computed(() => this.currentSession());
  readonly isAuthenticated = computed(() => !!this.currentSession());

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    // Get initial session
    const { data: { session } } = await this.supabaseService.client.auth.getSession();
    this.currentSession.set(session);
    this.currentUser.set(session?.user ?? null);

    // Listen for auth state changes
    this.supabaseService.client.auth.onAuthStateChange((_event, session) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user ?? null);
    });
  }

  async signIn(email: string, password: string): Promise<{ error: AuthError | null }> {
    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
      email,
      password
    });

    if (!error && data.session) {
      this.currentSession.set(data.session);
      this.currentUser.set(data.user);
    }

    return { error };
  }

  async signOut(): Promise<void> {
    await this.supabaseService.client.auth.signOut();
    this.currentSession.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  async getSession(): Promise<Session | null> {
    const { data: { session } } = await this.supabaseService.client.auth.getSession();
    return session;
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }
}
