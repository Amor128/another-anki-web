import { Flex, Heading } from '@radix-ui/themes';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Link } from 'react-router';

export function Header() {
  return (
    <Flex
      align="center"
      justify="between"
      p="4"
      style={{
        borderBottom: '1px solid var(--gray-4)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      <Link to="/" style={{ textDecoration: 'none' }}>
        <Heading size="6" style={{ cursor: 'pointer' }}>
          Anki Web
        </Heading>
      </Link>
      <Flex gap="2" align="center">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </Flex>
    </Flex>
  );
}
