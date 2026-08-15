import { NavLink } from 'react-router-dom';

const navItems = [
  {
    label: '홈',
    path: '/home',
    Icon: HomeIcon,
  },
  {
    label: '아바타',
    path: '/avatar',
    Icon: AvatarIcon,
  },
  {
    label: '스캔',
    path: '/upload',
    Icon: ScanIcon,
    primary: true,
  },
  {
    label: '피팅룸',
    path: '/fitting',
    Icon: FittingIcon,
  },
  {
    label: 'MY',
    path: '/my',
    Icon: MyIcon,
  },
];

const BottomNav = () => {
  return (
    <nav
      className="fixed left-1/2 z-50 w-[calc(100%-24px)] max-w-[360px] -translate-x-1/2"
      style={{
        bottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
      aria-label="메인 네비게이션"
    >
      <div className="flex h-[68px] items-center rounded-[26px] border border-white/10 bg-[#171717]/95 px-2 shadow-[0_12px_35px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        {navItems.map(({ label, path, Icon, primary }) => (
          <NavLink
            key={path}
            to={path}
            className="relative flex h-full min-w-0 flex-1 items-center justify-center"
          >
            {({ isActive }) =>
              primary ? (
                <div className="absolute -top-5 flex flex-col items-center">
                  <div
                    className={[
                      'grid h-14 w-14 place-items-center rounded-full border-[5px] border-[#171717] shadow-lg transition',
                      isActive
                        ? 'bg-gold text-[#111]'
                        : 'bg-[#f2f0eb] text-[#111]',
                    ].join(' ')}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <span
                    className={[
                      'mt-0.5 text-[10px] font-medium',
                      isActive ? 'text-gold' : 'text-white/55',
                    ].join(' ')}
                  >
                    {label}
                  </span>
                </div>
              ) : (
                <div
                  className={[
                    'flex flex-col items-center justify-center gap-1 transition',
                    isActive ? 'text-gold' : 'text-white/55',
                  ].join(' ')}
                >
                  <Icon className="h-[21px] w-[21px]" />

                  <span
                    className={[
                      'text-[10px]',
                      isActive ? 'font-semibold' : 'font-normal',
                    ].join(' ')}
                  >
                    {label}
                  </span>
                </div>
              )
            }
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M3.5 10.5 12 3.5l8.5 7v9a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1v-9Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AvatarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M5.5 20.5c.65-3.65 2.85-5.6 6.5-5.6s5.85 1.95 6.5 5.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ScanIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M7 7.5 8.3 5h7.4L17 7.5h1.5A2.5 2.5 0 0 1 21 10v7.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5V10a2.5 2.5 0 0 1 2.5-2.5H7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="13"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function FittingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="m8 4 4 3 4-3 4 4-3 3v9H7v-9L4 8l4-4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M6 20c.6-3.5 2.6-5.5 6-5.5s5.4 2 6 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}