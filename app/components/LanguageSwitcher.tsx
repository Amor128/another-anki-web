import { useTranslation } from 'react-i18next';
import { Select, Flex, Text } from '@radix-ui/themes';
import { GlobeIcon } from '@radix-ui/react-icons';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../i18n/config';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <Flex align="center" gap="2">
      <GlobeIcon width="18" height="18" />
      <Select.Root value={i18n.language} onValueChange={handleLanguageChange}>
        <Select.Trigger />
        <Select.Content>
          <Select.Group>
            {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
              <Select.Item key={code} value={code}>
                {name}
              </Select.Item>
            ))}
          </Select.Group>
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}
