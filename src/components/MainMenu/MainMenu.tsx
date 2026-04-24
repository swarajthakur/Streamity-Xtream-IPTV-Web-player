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
      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-end overflow-hidden">
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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-neutral-950 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20 pt-32 md:px-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-neutral-300 backdrop-blur">
            <span className="size-1.5 rounded-full bg-brand" /> Streamify
          </div>
          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-white md:text-7xl">
            Everything you watch.
            <br />
            <span className="bg-gradient-to-r from-red-500 via-rose-400 to-orange-300 bg-clip-text text-transparent">
              One player.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-neutral-300 md:text-xl">
            Live TV, movies, and series — all pulled from your Xtream playlist, rendered the way
            modern streaming should look.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => history.push('/live/')}>
              <Play className="fill-current" /> Start Watching Live
            </Button>
            <Button size="lg" variant="outline" onClick={() => history.push('/movie/')}>
              Browse Movies
            </Button>
          </div>
        </div>
      </section>

      {/* Mode cards */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 md:px-10">
        <h2 className="mb-6 text-xl font-semibold tracking-tight text-neutral-100">
          Jump back in
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {modes.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => history.push(m.to)}
              className="group relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-left transition-all hover:-translate-y-1 hover:border-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity group-hover:opacity-100 ${m.accent}`}
              />
              <div className="relative flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15 backdrop-blur">
                  <m.icon className="size-6 text-white" />
                </div>
              </div>
              <div className="relative">
                <div className="text-2xl font-bold text-white md:text-3xl">{m.title}</div>
                <div className="mt-1 text-sm text-neutral-300">{m.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
