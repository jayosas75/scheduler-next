'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Footer() {
    const [likes, setLikes] = useState(0);
    const [liked, setLiked] = useState(false);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        // Load likes
        const storedLikes = localStorage.getItem('yosas-global-likes');
        const userLiked = localStorage.getItem('yosas-user-liked') === 'true';

        setLikes(storedLikes ? parseInt(storedLikes) : 1337);
        setLiked(userLiked);
    }, []);

    const handleLike = () => {
        if (liked) return;

        const newLikes = likes + 1;
        setLikes(newLikes);
        setLiked(true);
        setAnimating(true);

        localStorage.setItem('yosas-global-likes', newLikes.toString());
        localStorage.setItem('yosas-user-liked', 'true');

        setTimeout(() => setAnimating(false), 300);
    };

    const handleReset = () => {
        if (window.confirm('Reset local preferences and likes? This does not delete your calendar events.')) {
            localStorage.removeItem('yosas-global-likes');
            localStorage.removeItem('yosas-user-liked');
            setLikes(1337);
            setLiked(false);
        }
    };

    return (
        <footer className="bg-black/95 border-t border-cyan-500/30 w-full mt-auto relative z-20">
            <div className="px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-4 text-xs mb-3">

                    {/* Version & Links */}
                    <div className="flex items-center gap-4 text-cyan-400">
                        <span className="opacity-60">v1.2.0</span>
                        <span className="opacity-30">|</span>
                        <Link href="/about" className="text-yellow-400 hover:text-yellow-300 transition underline">
                            About
                        </Link>
                        <span className="opacity-30">|</span>
                        <button onClick={handleReset} className="text-red-400 hover:text-red-300 transition underline">
                            Reset Local Data
                        </button>
                    </div>

                    {/* Social Share */}
                    <div className="flex items-center gap-3">
                        <span className="text-cyan-500/50 uppercase tracking-widest text-[10px] font-bold">Share:</span>
                        <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-200 transition hover:scale-110">TikTok</a>
                        <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-200 transition hover:scale-110">X</a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-200 transition hover:scale-110">Instagram</a>
                    </div>

                    {/* Like Counter */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleLike}
                            disabled={liked}
                            className={`flex items-center gap-2 px-3 py-1 rounded border transition font-bold uppercase tracking-wider ${liked
                                ? 'border-yellow-400/30 text-yellow-400/50 cursor-not-allowed'
                                : 'border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 hover:scale-105 cursor-crosshair'
                                }`}
                        >
                            <span>{liked ? '👍' : '👍'}</span>
                            <span>{liked ? 'Liked!' : 'Like'}</span>
                        </button>

                        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded">
                            <span className={`text-yellow-400 font-bold font-mono ${animating ? 'scale-110 transition-transform' : ''}`}>
                                {likes.toLocaleString()}
                            </span>
                            <span className="text-yellow-400/60 uppercase text-[10px] font-bold tracking-widest">global likes</span>
                        </div>
                    </div>

                </div>

                {/* Debug info */}
                <div className="text-[10px] text-cyan-400/40 text-center pt-2 border-t border-cyan-500/10 font-mono uppercase tracking-widest">
                    Running in NEON-MATRIX Environment
                </div>
            </div>
        </footer>
    );
}
