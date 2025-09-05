import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, canAccessAdminPortal, canAccessClientPortal } from '@/lib/auth';

// Routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/admin-login',
  '/auth/logout',
  '/forgot-password',
  '/reset-password',
  '/activate-account',
  '/api/auth',
];

// Routes du portail client (nécessitent un utilisateur client)
const clientRoutes = [
  '/client',
];

// Routes du portail admin (nécessitent un utilisateur admin)
const adminRoutes = [
  '/admin',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifier si c'est une route publique
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Récupérer le token de session depuis les cookies
  const sessionToken = request.cookies.get('better-auth.session_token')?.value;

  // Si pas de session et route protégée, rediriger vers la page de connexion appropriée
  if (!sessionToken) {
    // Déterminer vers quel portail rediriger selon la route demandée
    if (pathname.startsWith('/admin')) {
      const loginUrl = new URL('/auth/admin-login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith('/client')) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Route par défaut - rediriger vers le portail client
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Valider la session côté serveur
  console.log('🔍 Middleware - Validation session pour:', pathname);
  const sessionData = await auth.validateSession(sessionToken);
  console.log('📋 Middleware - Données session:', sessionData ? 'valide' : 'null');

  if (!sessionData) {
    console.log('❌ Middleware - Session invalide, redirection vers login');
    // Session invalide, rediriger vers la page de connexion appropriée
    if (pathname.startsWith('/admin')) {
      const loginUrl = new URL('/auth/admin-login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith('/client')) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Route par défaut
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { user } = sessionData;

  // Vérifier l'état du compte
  if (!user.isActive) {
    const disabledUrl = new URL('/auth/account-disabled', request.url);
    disabledUrl.searchParams.set('reason', 'account_disabled');
    return NextResponse.redirect(disabledUrl);
  }

  // Vérifier les accès aux portails selon les rôles
  if (pathname.startsWith('/admin')) {
    if (!canAccessAdminPortal(user)) {
      // Rediriger vers la page "mauvais portail"
      const wrongPortalUrl = new URL('/auth/wrong-portal', request.url);
      wrongPortalUrl.searchParams.set('required', 'admin');
      wrongPortalUrl.searchParams.set('current', user.userType);
      return NextResponse.redirect(wrongPortalUrl);
    }
  }

  if (pathname.startsWith('/client')) {
    if (!canAccessClientPortal(user)) {
      // Rediriger vers la page "mauvais portail"
      const wrongPortalUrl = new URL('/auth/wrong-portal', request.url);
      wrongPortalUrl.searchParams.set('required', 'client');
      wrongPortalUrl.searchParams.set('current', user.userType);
      return NextResponse.redirect(wrongPortalUrl);
    }
  }

  return NextResponse.next();
}

// Configuration des routes à matcher par le middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
