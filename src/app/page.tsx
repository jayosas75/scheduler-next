import { auth } from '@/auth';
import Landing from '@/components/landing/landing';

export default async function Home() {
    const session = await auth();
    return <Landing isAuthed={!!session?.user} />;
}
