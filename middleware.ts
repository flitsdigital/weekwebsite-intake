import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { createAllowlist } from '@/lib/admin-allowlist';

/** Alleen deze twee mogen uitgelogd bereikbaar zijn. */
const OPEN = ['/admin/login', '/admin/auth'];

const mayEnter = createAllowlist({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (OPEN.some((path) => pathname.startsWith(path))) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const login = new URL('/admin/login', request.url);

  if (!user?.email) {
    login.searchParams.set('reden', 'inloggen');
    return NextResponse.redirect(login);
  }

  if (!(await mayEnter(user.email))) {
    await supabase.auth.signOut();
    login.searchParams.set('reden', 'geen-toegang');
    return NextResponse.redirect(login);
  }

  return response;
}

// Alles onder /admin, zodat een nieuwe pagina standaard dicht zit.
// De vorige opsomming per route liet /admin/bord open toen die erbij kwam.
export const config = {
  matcher: ['/admin/:path*'],
};
