'use client';

import Link from 'next/link';
import { Shield, Zap, Globe, Cpu, Lock, Terminal } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6 bg-transparent relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-yellow-400/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-4xl w-full space-y-12">
                {/* Hero Section */}
                <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter title-shine uppercase font-orbitron">
                        SCHEDULER // 2026
                    </h1>
                    <p className="text-cyan-400 font-mono text-sm tracking-[0.3em] uppercase">
                        Protocol v1.1.0 // Status: Operational
                    </p>
                    <div className="h-1 w-32 bg-cyan-500 mx-auto mt-6 glow" />
                </div>

                {/* Grid of Features/Lore */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FeatureCard
                        icon={<Cpu className="w-6 h-6" />}
                        title="Neural Core"
                        description="Synchronized temporal management for the modern netrunner. Built on Next.js 15 for lightning-fast latency."
                    />
                    <FeatureCard
                        icon={<Lock className="w-6 h-6" />}
                        title="Data Sovereignty"
                        description="Your schedule is yours. No third-party tracking, no corporate oversight. Encrypted with BcryptJS standards."
                    />
                    <FeatureCard
                        icon={<Terminal className="w-6 h-6" />}
                        title="Matrix Ready"
                        description="Fully responsive interface optimized for retinal implants and mobile devices alike. Cyberpunk design system integrated."
                    />
                </div>

                {/* Lore / Story */}
                <div className="bg-black/60 border border-cyan-500/30 rounded-3xl p-8 glow scanlines relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <Globe className="w-24 h-24 text-cyan-500" />
                    </div>

                    <h2 className="text-2xl font-black text-cyan-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                        <Zap className="w-6 h-6 text-yellow-400" /> The Chronos Protocol
                    </h2>

                    <div className="space-y-4 text-cyan-100/80 font-mono text-sm leading-relaxed">
                        <p>
                            In the year 2026, time is the only currency that matters. The <span className="text-cyan-400 font-bold">SCHEDULER // 2026</span> was born from the need to organize chaos in a world of information overload.
                        </p>
                        <p>
                            Developed by rogue netrunners who refused to let their lives be dictated by centralized megacorporations, this tool provides a secure, locally-controlled alternative to the legacy "cloud" calendars of the past.
                        </p>
                        <p>
                            Whether you're planning your next heist, a corporate meeting, or just your morning coffee, the Chronos Protocol ensures you never miss a beat in the neon-drenched streets of the future.
                        </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-cyan-500/20 flex flex-wrap gap-4">
                        <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                            Built with Next.js
                        </div>
                        <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                            Secured by Prisma
                        </div>
                        <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                            Styled with Tailwind
                        </div>
                    </div>
                </div>

                {/* Back Link */}
                <div className="text-center">
                    <Link
                        href="/calendar"
                        className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-bold uppercase tracking-widest text-xs group"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span>
                        Return to Calendar Matrix
                    </Link>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="bg-black/40 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-400/50 transition-all hover:bg-cyan-500/5 group">
            <div className="w-12 h-12 bg-cyan-500/20 border border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-lg font-black text-cyan-100 uppercase tracking-widest mb-2 font-orbitron">{title}</h3>
            <p className="text-xs text-cyan-100/60 leading-relaxed font-mono">
                {description}
            </p>
        </div>
    );
}
