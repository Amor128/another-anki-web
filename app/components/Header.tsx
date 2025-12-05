import { Flex, Heading } from "@radix-ui/themes";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Link } from "react-router";

export function Header() {
  return (
    <Flex align="center" justify="between" p="4">
      <Link to="/" style={{ textDecoration: "none" }}>
        <Heading size="6" style={{ cursor: "pointer" }}>
          Another Anki Web
        </Heading>
      </Link>
      <Flex gap="2" align="center">
        <LanguageSwitcher />
      </Flex>
    </Flex>
  );
}
