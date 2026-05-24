import { Burger, Button, Group, Text, Title } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type AppHeaderProps = {
  mobileNavbarOpened: boolean;
  onToggleMobileNavbar: () => void;
};

export function AppHeader({
  mobileNavbarOpened,
  onToggleMobileNavbar,
}: AppHeaderProps) {
  const { authRequired, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

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
        <Title order={4}>FFF Batch Queuer</Title>
      </Group>
      <Group gap="sm" wrap="nowrap">
        <Text c="dimmed" size="sm" visibleFrom="sm">
          Admin Console
        </Text>
        {authRequired ? (
          <Button variant="subtle" size="compact-sm" onClick={handleLogout}>
            Sign out
          </Button>
        ) : null}
      </Group>
    </Group>
  );
}
