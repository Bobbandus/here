import { useApp } from '../../state/AppState';
import { APP_VIEWS } from '../../state/views';
import { Icon } from '../ui/Icon';

const tooltip =
  'glass micro pointer-events-none absolute left-full top-1/2 z-40 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-[6px] px-2.5 py-1.5 text-text opacity-0 transition-opacity duration-150 sm:block group-hover:opacity-100 group-focus-visible:opacity-100';

export function Sidebar() {
  const { state, dispatch } = useApp();
  if (state.app === 'home') return null;
  const items = APP_VIEWS[state.app];

  return (
    <nav aria-label="Vyer" className="flex w-[52px] shrink-0 flex-col items-center border-r border-line bg-surface sm:w-[72px]">
      <button
        type="button"
        aria-label="Till startsidan"
        onClick={() => dispatch({ type: 'SET_APP', app: 'home' })}
        className="group relative flex h-16 w-full items-center justify-center border-b border-line transition-colors duration-150 hover:bg-raised focus-visible:outline-offset-[-2px]"
      >
        <span className="font-black text-[20px] leading-none tracking-[-0.03em]">
          A<span className="text-accent">+</span>
        </span>
        <span role="tooltip" className={tooltip}>
          Startsida
        </span>
      </button>
      <ul className="flex w-full flex-col gap-1 pt-3">
        {items.map((item) => {
          const active = state.view === item.id;
          return (
            <li key={item.id} className="relative">
              <button
                type="button"
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                onClick={() => dispatch({ type: 'SET_VIEW', view: item.id })}
                className={`group relative flex h-14 w-full items-center justify-center transition-colors duration-150 focus-visible:outline-offset-[-2px] ${
                  active ? 'text-accent' : 'text-muted hover:bg-raised hover:text-text'
                }`}
              >
                {active && <span aria-hidden="true" className="absolute inset-y-2.5 left-0 w-[2px] bg-accent" />}
                <Icon name={item.icon} size={20} />
                <span role="tooltip" className={tooltip}>
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
