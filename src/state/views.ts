import type { AppId, ViewId } from '../types';
import type { IconName } from '../components/ui/Icon';

export interface ViewDef {
  id: ViewId;
  label: string;
  icon: IconName;
}

export const APP_VIEWS: Record<Exclude<AppId, 'home'>, ViewDef[]> = {
  write: [
    { id: 'write-overview', label: 'Översikt', icon: 'dashboard' },
    { id: 'write', label: 'Skriv', icon: 'write' },
  ],
  plan: [
    { id: 'plan-overview', label: 'Översikt', icon: 'dashboard' },
    { id: 'scene', label: 'Scen', icon: 'scene' },
    { id: 'shots', label: 'Shotlistor', icon: 'shots' },
    { id: 'days', label: 'Inspelningsdagar', icon: 'calendar' },
    { id: 'casting', label: 'Casting', icon: 'portrait' },
    { id: 'gear', label: 'Utrustning', icon: 'kit' },
    { id: 'pipeline', label: 'Pipeline', icon: 'pipeline' },
  ],
  shoot: [{ id: 'shoot', label: 'Klapperbräda', icon: 'clapper' }],
};

export const APP_LABEL: Record<Exclude<AppId, 'home'>, string> = {
  write: 'WRITE',
  plan: 'PLAN',
  shoot: 'SHOOT',
};

export function appOfView(view: ViewId): Exclude<AppId, 'home'> {
  if (view === 'write' || view === 'write-overview') return 'write';
  if (view === 'shoot') return 'shoot';
  return 'plan';
}

export function viewLabel(view: ViewId): string {
  const app = appOfView(view);
  return APP_VIEWS[app].find((v) => v.id === view)?.label ?? view;
}
