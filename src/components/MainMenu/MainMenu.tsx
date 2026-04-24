import { useHistory } from 'react-router-dom';
import { Film, Play, Tv, Video, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ModeCard {
  key: string;
  title: string;
  subtitle: string;
  to: string;
  icon: LucideIcon;
  accent: string;
}

const modes: ModeCard[] = [
  {
    key: 'live',
    title: 'Live TV',
    subtitle: 'Channels, EPG, catch-up',
    to: '/live/',
    icon: Tv,
    accent: 'from-red-600/40 to-red-900/20',
  },
  {
    key: 'movie',
    title: 'Movies',
    subtitle: 'Blockbusters and classics on demand',
    to: '/movie/',
    icon: Film,
    accent: 'from-indigo-600/40 to-indigo-900/20',
  },
  {
    key: 'series',
    title: 'TV Series',
    subtitle: 'Episodes, seasons, autoplay',
    to: '/series/',
    icon: Video,
    accent: 'from-emerald-600/40 to-emerald-900/20',
  },
];

export default function MainMenu() {
  const history = useHistory();

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-neutral-50">
      {/* Ambient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 600px at 70% 10%, rgba(229,9,20,0.35), rgba(0,0,0,0) 60%), radial-gradient(800px 400px at 10% 80%, rgba(124,58,237,0.25), rgba(0,0,0,0) 65%), linear-gradient(180deg, #0a0a0a 0%, #050505 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '3px 3px',
        }}
      />

      {/* Content — top-anchored, no centered free space */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-24 md:px-10 md:pt-28">
        <section className="pb-8">
          <img
            src="/img/streamify-logo.svg"
            alt="Streamify"
            className="mb-6 h-12 w-auto md:h-14"
          />
          <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-white md:text-6xl">
            Everything you watch.
            <br />
            <span className="bg-gradient-to-r from-red-500 via-rose-400 to-orange-300 bg-clip-text text-transparent">
              One player.
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-neutral-300 md:text-lg">
            Live TV, movies, and series — all pulled from your Xtream playlist, rendered the way
            modern streaming should look.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => history.push('/live/')}>
              <Play className="fill-current" /> Start Watching Live
            </Button>
            <Button size="lg" variant="outline" onClick={() => history.push('/movie/')}>
              Browse Movies
            </Button>
          </div>
        </section>

        <section className="pb-10 md:pb-14">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Jump back in
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {modes.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => history.push(m.to)}
                className="group relative flex aspect-[16/9] flex-col justify-between overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 p-5 text-left transition-all hover:-translate-y-1 hover:border-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 md:aspect-[4/3]"
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity group-hover:opacity-100 ${m.accent}`}
                />
                <div className="relative flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15 backdrop-blur">
                    <m.icon className="size-5 text-white" />
                  </div>
                </div>
                <div className="relative">
                  <div className="text-xl font-bold text-white md:text-2xl">{m.title}</div>
                  <div className="mt-0.5 text-xs text-neutral-300 md:text-sm">{m.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
