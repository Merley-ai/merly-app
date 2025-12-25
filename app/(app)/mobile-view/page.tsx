import { getSession } from '@/lib/auth0/server';
import { MobileViewContent } from './MobileViewContent';

export const metadata = {
    title: 'Desktop Only - Merley',
    robots: 'noindex, nofollow',
};

export default async function MobileViewPage() {
    const session = await getSession();
    const email = session?.user?.email ?? null;

    return <MobileViewContent email={email} />;
}
