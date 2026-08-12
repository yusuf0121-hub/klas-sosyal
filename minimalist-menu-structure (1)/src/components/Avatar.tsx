import { initials, avatarColor } from '@/lib/utils';

type Props = {
  name: string;
  id: string;
  url?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-24 h-24 text-3xl',
};

export default function Avatar({ name, id, url, size = 'md' }: Props) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${SIZES[size]} rounded-full object-cover ring-2 ring-white shadow-sm`}
      />
    );
  }
  return (
    <div
      className={`${SIZES[size]} ${avatarColor(id)} rounded-full flex items-center justify-center font-bold text-white ring-2 ring-white shadow-sm`}
    >
      {initials(name)}
    </div>
  );
}
