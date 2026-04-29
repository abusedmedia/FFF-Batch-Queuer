import { IconListDetails, IconUsers } from "@tabler/icons-react";
import { NavLink, Stack } from "@mantine/core";
import { Link, useLocation } from "react-router-dom";

const items = [
  { label: "Customers", to: "/customers", icon: IconUsers },
  { label: "Jobs", to: "/jobs", icon: IconListDetails },
];

export function ContextualSidebar() {
  const location = useLocation();
  return (
    <Stack p="sm" gap="xs">
      {items.map((item) => (
        <NavLink
          key={item.to}
          component={Link}
          to={item.to}
          label={item.label}
          active={location.pathname.startsWith(item.to)}
          leftSection={<item.icon size={16} />}
        />
      ))}
    </Stack>
  );
}
