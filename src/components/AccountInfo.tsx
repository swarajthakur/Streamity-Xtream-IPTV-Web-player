import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';

import { useDispatch, useSelector } from '@/store/legacy';
import { getInfo, logout } from '../other/user_info';
import { setH24 } from '../actions/h24';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';

interface Info {
  username: string;
  password: string;
  max_connections: string | number;
  expiry: Date;
  message?: string;
}

export default function AccountInfo() {
  const history = useHistory();
  const dispatch = useDispatch();
  const h24 = useSelector((s) => s.h24);
  const info = (getInfo() ?? {}) as Partial<Info>;

  useEffect(() => {
    document.getElementById('info-back')?.focus();
  }, []);

  const rows: Array<[string, React.ReactNode]> = [
    ['Username', info.username ?? '—'],
    ['Password', info.password ?? '—'],
    ['Max connections', info.max_connections ?? '—'],
    ['Expires', info.expiry ? info.expiry.toUTCString() : '—'],
  ];

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-neutral-950/95 pt-24">
      <div className="mx-auto w-full max-w-2xl px-4 pb-16">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-neutral-800">
              {rows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-3">
                  <dt className="text-sm text-neutral-400">{label}</dt>
                  <dd className="text-sm font-medium text-neutral-100">{value}</dd>
                </div>
              ))}
              {info.message && (
                <div className="py-3 text-sm text-neutral-300">{info.message}</div>
              )}
            </dl>

            <div className="mt-6 border-t border-neutral-800 pt-6">
              <Checkbox
                id="h24"
                checked={h24 === 'HH:MM'}
                onChange={() => dispatch(setH24(h24 !== 'HH:MM'))}
                label="Use 24-hour time format"
              />
            </div>

            <div className="mt-8 flex gap-3">
              <Button
                id="info-back"
                variant="secondary"
                className="flex-1"
                onClick={() => history.goBack()}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button variant="destructive" className="flex-1" onClick={() => logout()}>
                <LogOut className="size-4" />
                Log out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
