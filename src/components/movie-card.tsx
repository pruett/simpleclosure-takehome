import Image from "next/image";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import type { Movie } from "@/data/tmdb";

/** TMDB poster CDN host. Distinct from the data-layer API host in @/data/tmdb. */
const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

/**
 * A single movie rendered as a shadcn Card: poster on top (or a styled
 * placeholder when `poster_path` is null), the title, and the vote_average
 * rating shown as an overlaid badge.
 */
export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Card className="gap-0 ring-white/10 bg-neutral-900/60 py-0">
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-800">
        {movie.poster_path ? (
          <Image
            src={`${POSTER_BASE_URL}${movie.poster_path}`}
            alt={`Poster for ${movie.title}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-neutral-800 to-neutral-900 p-4 text-center">
            <span
              aria-hidden
              className="font-heading text-3xl font-semibold text-neutral-600"
            >
              ⧉
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              No poster
            </span>
          </div>
        )}

        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-amber-300 ring-1 ring-white/10 backdrop-blur">
          <span aria-hidden className="text-amber-400">
            ★
          </span>
          <span aria-label={`Rating ${movie.vote_average.toFixed(1)} out of 10`}>
            {movie.vote_average.toFixed(1)}
          </span>
        </div>
      </div>

      <CardContent className="px-3 py-3">
        <CardTitle className="line-clamp-2 text-sm leading-snug text-neutral-100">
          {movie.title}
        </CardTitle>
      </CardContent>
    </Card>
  );
}
