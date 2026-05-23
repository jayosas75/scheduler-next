'use client';

import { useEffect, useRef } from 'react';

/** True when the user has requested reduced motion. */
export function useReducedMotion() {
    const ref = useRef(false);
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        ref.current = mq.matches;
        const onChange = (e: MediaQueryListEvent) => (ref.current = e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);
    return ref;
}

/**
 * Drives mouse + scroll parallax by writing CSS custom properties
 * (--px, --py, --scroll) onto the returned element. Children with
 * .parallax-layer read those vars and offset themselves by --depth.
 * Throttled with requestAnimationFrame; no-ops under reduced motion.
 */
export function useParallax<T extends HTMLElement>() {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        let px = 0, py = 0, scroll = 0, frame = 0;

        const apply = () => {
            frame = 0;
            el.style.setProperty('--px', px.toFixed(2));
            el.style.setProperty('--py', py.toFixed(2));
            el.style.setProperty('--scroll', scroll.toFixed(1));
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(apply);
        };

        const onMove = (e: PointerEvent) => {
            px = (e.clientX / window.innerWidth - 0.5) * 40;
            py = (e.clientY / window.innerHeight - 0.5) * 40;
            schedule();
        };
        const onScroll = () => {
            scroll = window.scrollY;
            schedule();
        };

        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('scroll', onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    return ref;
}

/**
 * Adds .in-view to every .reveal descendant as it scrolls into view.
 * Under reduced motion the CSS already shows the end state, so we
 * simply mark everything visible immediately.
 */
export function useScrollReveal<T extends HTMLElement>() {
    const ref = useRef<T>(null);

    useEffect(() => {
        const root = ref.current;
        if (!root) return;
        const targets = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            targets.forEach((t) => t.classList.add('in-view'));
            return;
        }

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-view');
                        io.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
        );
        targets.forEach((t) => io.observe(t));
        return () => io.disconnect();
    }, []);

    return ref;
}
