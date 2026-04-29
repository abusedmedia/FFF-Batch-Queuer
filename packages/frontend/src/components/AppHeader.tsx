import { Group, Text, Title } from "@mantine/core";

export function AppHeader() {
  return (
    <Group justify="space-between" px="md" h="100%">
      <Title order={4}>Batch Queuer Observability</Title>
      <Text c="dimmed" size="sm">
        Admin Console
      </Text>
    </Group>
  );
}
