import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const Navigation = () => {
  const pathname = window.location.pathname;

  const navigationItems = [
    {
      name: 'Security',
      href: '/settings/security',
      icon: ShieldCheckIcon,
      current: pathname === '/settings/security',
    },
  ];

  return (
    <div>
      {/* Render your navigation items here */}
    </div>
  );
};

export default Navigation; 