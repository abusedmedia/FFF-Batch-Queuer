import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Outlet } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { ContextualSidebar } from "./ContextualSidebar";

export function AdminLayout() {
  const [mobileNavbarOpened, { toggle: toggleMobileNavbar, close: closeMobileNavbar }] =
    useDisclosure(false);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 240,
        breakpoint: "sm",
        collapsed: { mobile: !mobileNavbarOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <AppHeader
          mobileNavbarOpened={mobileNavbarOpened}
          onToggleMobileNavbar={toggleMobileNavbar}
        />
      </AppShell.Header>
      <AppShell.Navbar>
        <ContextualSidebar onNavigate={closeMobileNavbar} />
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
