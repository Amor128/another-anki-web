import { IconButton } from '@radix-ui/themes';
import { MixerVerticalIcon } from '@radix-ui/react-icons';
import { useThemePanel } from '../root';

export function ThemeSwitcher() {
  const { isOpen, setIsOpen } = useThemePanel();

  return (
    <IconButton
      variant="ghost"
      onClick={() => setIsOpen(!isOpen)}
      title={isOpen ? 'Hide theme panel' : 'Show theme panel'}
      style={{
        cursor: 'pointer',
      }}
    >
      <MixerVerticalIcon width="18" height="18" />
    </IconButton>
  );
}
