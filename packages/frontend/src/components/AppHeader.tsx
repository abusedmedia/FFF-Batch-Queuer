import { Burger, Group, Text, Title } from "@mantine/core";

type AppHeaderProps = {
  mobileNavbarOpened: boolean;
  onToggleMobileNavbar: () => void;
};

export function AppHeader({
  mobileNavbarOpened,
  onToggleMobileNavbar,
}: AppHeaderProps) {
  return (
    <Group justify="space-between" px="md" h="100%" wrap="nowrap">
      <Group gap="sm" wrap="nowrap">
        <Burger
          opened={mobileNavbarOpened}
          onClick={onToggleMobileNavbar}
          hiddenFrom="sm"
          size="sm"
          aria-label="Toggle navigation"
        />
        <Title order={4}>Batch Queuer Observability</Title>
      </Group>
      <Text c="dimmed" size="sm">
        Admin Console
      </Text>
    </Group>
  );
}
