
export interface Segment {
    offset: number;
    label: string;
    category: string;
}

export const CATEGORY_COLORS: Record<string, string> = {
    health: 'bg-cyan-400',
    work: 'bg-purple-400',
    growth: 'bg-lime-400',
    relations: 'bg-yellow-400',
    admin: 'bg-blue-400',
    misc: 'bg-white',
};

// Map bg- colors to border- colors (simple string replacement)
export const CATEGORY_BORDERS: Record<string, string> = {
    health: '#22d3ee', // cyan-400
    work: '#e879f9', // fuchsia-400
    growth: '#39ff14', // neon green
    relations: '#facc15', // yellow-400
    admin: '#60a5fa', // blue-400
    misc: '#ffffff', // white
};


/**
 * Generates a display title by joining unique labels from segments.
 * If multiple segments have the same label, it appears once.
 */
// Map bg- colors to border- colors (simple string replacement)
// _FREE_ segments shouldn't have a border color (transparent)
// We can handle that in generateBorderGradient logic directly.

// ...

export function generateEventTitle(segments: Segment[]): string {
    if (!segments || segments.length === 0) return 'Untitled';

    // Get unique labels, excluding _FREE_
    const labels = Array.from(new Set(
        segments
            .filter(s => s.label !== '_FREE_')
            .map(s => s.label)
            .filter(Boolean)
    ));

    if (labels.length === 0) return 'Untitled';
    return labels.join(' / ');
}

export function generateBorderGradient(segments: Segment[]): string {
    if (!segments || segments.length === 0) return CATEGORY_BORDERS.misc;

    // Sort by offset to ensure correct gradient order
    const sorted = [...segments].sort((a, b) => a.offset - b.offset);

    // If all segments have same category (and not free), return solid color
    const uniqueCategories = new Set(sorted.map(s => s.category));
    const hasFree = sorted.some(s => s.label === '_FREE_');
    if (uniqueCategories.size === 1 && !hasFree) {
        return CATEGORY_BORDERS[sorted[0].category] || CATEGORY_BORDERS.misc;
    }

    // Single segment handle (fallback for safety)
    if (sorted.length === 1) {
        if (sorted[0].label === '_FREE_') return 'transparent';
        return CATEGORY_BORDERS[sorted[0].category] || CATEGORY_BORDERS.misc;
    }

    // Build linear gradient
    // We need precise stops based on offset/duration.
    // offsets: 0, 15, 45...
    // We assume the timeline is 0 to 60.

    let gradient = 'linear-gradient(to bottom, ';

    sorted.forEach((s, i) => {
        const next = (i < sorted.length - 1) ? sorted[i + 1].offset : 60;
        const color = s.label === '_FREE_' ? 'transparent' : (CATEGORY_BORDERS[s.category] || CATEGORY_BORDERS.misc);

        const startPct = (s.offset / 60) * 100;
        const endPct = (next / 60) * 100;

        gradient += `${color} ${startPct}%, ${color} ${endPct}%${i < sorted.length - 1 ? ', ' : ''}`;
    });

    gradient += ')';
    return gradient;
}
