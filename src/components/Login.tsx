import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useHistory } from 'react-router-dom';
import Cookies from 'js-cookie';

import { useAuth } from '../other/auth';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import Popup from './Popup/Popup';

type PopupState = { title: string; description: string } | null;

interface LoginProps {
  url?: string;
}

// Vite uses import.meta.env.VITE_* — keep REACT_APP_* as a legacy fallback
// by reading import.meta.env loosely.
const env = import.meta.env as Record<string, string | undefined>;
const envDns = env.VITE_XTREAM_DNS ?? env.REACT_APP_XTREAM_DNS;
const envUser = env.VITE_XTREAM_USERNAME ?? env.REACT_APP_XTREAM_USERNAME;
const envPass = env.VITE_XTREAM_PASSWORD ?? env.REACT_APP_XTREAM_PASSWORD;
const envAutoLogin = Boolean(envDns && envUser && envPass);

export default function Login({ url }: LoginProps) {
  const [dns, setDns] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [popup, setPopup] = useState<PopupState>(null);
  const [m3u8, setM3u8] = useState(
    (window as any).m3u8warning === true && !Cookies.get('m3u8_play')
  );
  const [loading, setLoading] = useState(false);

  const history = useHistory();
  const auth = useAuth() as any;
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (auth.isAuth()) {
      history.push(url || '/');
    } else {
      auth.authLogin(() => history.push(url || '/'));
    }
  }, [auth, history, url]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    auth.signin(
      dns,
      username,
      password,
      () => {
        window.location.href = '/';
      },
      (title: string, description: string) => {
        setLoading(false);
        setPopup({ title, description });
      }
    );
  };

  const onKey = (e: KeyboardEvent<HTMLFormElement>) => {
    const active = document.activeElement as HTMLElement | null;
    if (!active) return;
    if (e.keyCode === 40) {
      const next = active.nextElementSibling as HTMLElement | null;
      next?.focus();
    } else if (e.keyCode === 38) {
      const prev = active.previousElementSibling as HTMLElement | null;
      prev?.focus();
    }
  };

  if (envAutoLogin) return null;

  return (
    <div className="fixed inset-0 z-10 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at top, rgba(20,20,20,0.45) 0%, rgba(0,0,0,0.95) 70%), linear-gradient(180deg, #1a0a0f 0%, #0a0a0a 100%)",
        }}
      />

      <div
        className={`relative flex h-full w-full items-center justify-center px-4 transition-[filter] duration-300 ${
          popup || m3u8 ? 'blur-sm' : ''
        }`}
      >
        <Card className="w-full max-w-md border-neutral-800/80 bg-black/75">
          <CardHeader className="items-center gap-4 text-center">
            <img src="/img/streamify-logo.svg" alt="Streamify" className="h-10" />
            <CardTitle className="sr-only">Sign in to Streamify</CardTitle>
            <CardDescription className="text-neutral-300">
              Enter your Xtream credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={submit} onKeyDown={onKey}>
              {!(window as any).dns && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="dns">Provider URL</Label>
                  <Input
                    id="dns"
                    ref={firstInputRef}
                    type="text"
                    spellCheck={false}
                    placeholder="http://domain.com:80"
                    value={dns}
                    onChange={(e) => setDns(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  ref={(window as any).dns ? firstInputRef : undefined}
                  type="text"
                  spellCheck={false}
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus={Boolean((window as any).dns)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  spellCheck={false}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" disabled={loading} className="mt-2">
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {popup && (
        <Popup
          type="error"
          unsecure
          title={popup.title}
          description={popup.description}
          icon="fas fa-user-times"
          onclick={() => {
            setPopup(null);
            firstInputRef.current?.focus();
          }}
        />
      )}
      {m3u8 && (
        <Popup
          type="info"
          unsecure
          error={false}
          title="Information"
          description="Use your Xtream provider's username and password.<br/>This player can play live channels in M3U8 format.<br/>The conversion will be done automatically if streams are in Xtreamcodes format (this won't affect your playlist)."
          icon="fas fa-info-circle"
          onclick={() => {
            Cookies.set('m3u8_play', '1', { expires: 365 });
            setM3u8(false);
          }}
        />
      )}
    </div>
  );
}
