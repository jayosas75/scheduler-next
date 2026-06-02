
import Header from '@/components/header';
import Footer from '@/components/footer';
import SkyGutter from '@/components/sky-gutter';

export default function CalendarLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black relative overflow-x-clip">
            {/* Gutter background. Day-cycle sky prototype — swap back to the
                static starfield by restoring: <div className="stars-bg z-0" /> */}
            <SkyGutter />

            {/* Glow overlays for depth */}
            <div className="fixed inset-0 z-1 pointer-events-none hidden lg:block bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

            <div className="relative z-10 flex flex-col min-h-screen lg:max-w-4xl lg:mx-auto lg:shadow-[0_0_100px_rgba(var(--accent-rgb),0.15)] bg-black/90">
                <Header />
                <main className="flex-1 w-full">
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
}
