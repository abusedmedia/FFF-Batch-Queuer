import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Group,
  Loader,
  Modal,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import {
  createCustomer,
  deleteCustomer,
  fetchCustomers,
  updateCustomer,
} from "../api";
import type { Customer } from "../types";

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function getCustomerStatusColor(isActive: boolean): string {
  return isActive ? "green" : "gray";
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [modalName, setModalName] = useState("");
  const [modalIsActive, setModalIsActive] = useState(true);
  const [modalRotateToken, setModalRotateToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [createOpened, setCreateOpened] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createIsActive, setCreateIsActive] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  function loadCustomers(): Promise<void> {
    setLoading(true);
    setError(null);
    return fetchCustomers()
      .then(setCustomers)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    void loadCustomers();
  }, []);

  function openEditModal(customer: Customer): void {
    setEditingCustomer(customer);
    setModalName(customer.name);
    setModalIsActive(customer.isActive);
    setModalRotateToken(false);
    setSaveError(null);
    setNewToken(null);
  }

  function closeEditModal(): void {
    if (saving || deleting) return;
    setEditingCustomer(null);
  }

  async function onSaveCustomer(): Promise<void> {
    if (!editingCustomer) return;
    setSaving(true);
    setSaveError(null);
    try {
      const result = await updateCustomer(editingCustomer.id, {
        name: modalName.trim(),
        isActive: modalIsActive,
        rotateToken: modalRotateToken,
      });
      setNewToken(result.newToken);
      setCustomers((rows) =>
        rows.map((row) => (row.id === result.customer.id ? result.customer : row)),
      );
      setEditingCustomer(result.customer);
      setModalRotateToken(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update customer";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteCustomer(): Promise<void> {
    if (!editingCustomer) return;
    const confirmed = window.confirm(
      "Delete this customer and all its jobs? This action cannot be undone.",
    );
    if (!confirmed) return;

    setDeleting(true);
    setSaveError(null);
    try {
      await deleteCustomer(editingCustomer.id);
      setCustomers((rows) =>
        rows.filter((row) => row.id !== editingCustomer.id),
      );
      setEditingCustomer(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete customer";
      setSaveError(message);
    } finally {
      setDeleting(false);
    }
  }

  function openCreateModal(): void {
    setCreateOpened(true);
    setCreateName("");
    setCreateIsActive(true);
    setCreateError(null);
    setCreatedToken(null);
  }

  function closeCreateModal(): void {
    if (creating) return;
    setCreateOpened(false);
  }

  async function onCreateCustomer(): Promise<void> {
    setCreating(true);
    setCreateError(null);
    try {
      const result = await createCustomer({
        name: createName.trim(),
        isActive: createIsActive,
      });
      setCustomers((rows) => [...rows, result.customer].sort((a, b) => a.name.localeCompare(b.name)));
      setCreatedToken(result.newToken);
      setCreateName("");
      setCreateIsActive(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create customer";
      setCreateError(message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <Group justify="space-between" mb="md" align="center" wrap="wrap">
        <Title order={3}>Customers</Title>
        <Button onClick={openCreateModal} miw={120}>
          New Customer
        </Button>
      </Group>
      {loading && <Loader />}
      {error && <Alert color="red">{error}</Alert>}
      {!loading && !error && customers.length === 0 && (
        <Text c="dimmed">No customers found.</Text>
      )}
      {!loading && !error && customers.length > 0 && (
        <Table.ScrollContainer minWidth={720}>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>ID</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {customers.map((customer) => (
                <Table.Tr key={customer.id}>
                  <Table.Td>{customer.name}</Table.Td>
                  <Table.Td>{customer.id}</Table.Td>
                  <Table.Td>
                    <Badge color={getCustomerStatusColor(customer.isActive)} variant="light">
                      {customer.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{formatDate(customer.createdAt)}</Table.Td>
                  <Table.Td>
                    <Button variant="light" onClick={() => openEditModal(customer)}>
                      Edit
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      <Modal
        opened={editingCustomer !== null}
        onClose={closeEditModal}
        title="Edit customer"
        centered
      >
        <Stack>
          {saveError && <Alert color="red">{saveError}</Alert>}
          <TextInput
            label="Customer name"
            value={modalName}
            onChange={(event) => setModalName(event.currentTarget.value)}
            disabled={saving || deleting}
          />
          <Switch
            label="Customer is active"
            checked={modalIsActive}
            onChange={(event) => setModalIsActive(event.currentTarget.checked)}
            disabled={saving || deleting}
          />
          <Checkbox
            label="Rotate token hash (generate a new token)"
            checked={modalRotateToken}
            onChange={(event) => setModalRotateToken(event.currentTarget.checked)}
            disabled={saving || deleting}
          />
          {newToken && (
            <Alert color="blue" title="New token generated">
              <Text size="sm" ff="monospace">
                {newToken}
              </Text>
            </Alert>
          )}
          <Group justify="space-between">
            <Button
              color="red"
              variant="light"
              onClick={() => void onDeleteCustomer()}
              loading={deleting}
              disabled={saving}
            >
              Delete customer
            </Button>
            <Group justify="flex-end">
              <Button variant="default" onClick={closeEditModal} disabled={saving || deleting}>
                Cancel
              </Button>
              <Button
                onClick={() => void onSaveCustomer()}
                loading={saving}
                disabled={modalName.trim().length === 0 || deleting}
              >
                Save
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={createOpened}
        onClose={closeCreateModal}
        title="New customer"
        centered
      >
        <Stack>
          {createError && <Alert color="red">{createError}</Alert>}
          {!createdToken && (
            <TextInput
              label="Customer name"
              value={createName}
              onChange={(event) => setCreateName(event.currentTarget.value)}
              disabled={creating}
            />
          )}
          {!createdToken && (
            <Switch
              label="Customer is active"
              checked={createIsActive}
              onChange={(event) => setCreateIsActive(event.currentTarget.checked)}
              disabled={creating}
            />
          )}
          {createdToken && (
            <Alert color="blue" title="Customer created">
              <Text size="sm" mb={4}>
                Save this token now. It will not be shown again.
              </Text>
              <Text size="sm" ff="monospace">
                {createdToken}
              </Text>
            </Alert>
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={closeCreateModal} disabled={creating}>
              {createdToken ? "Done" : "Close"}
            </Button>
            {!createdToken && (
              <Button
                onClick={() => void onCreateCustomer()}
                loading={creating}
                disabled={createName.trim().length === 0}
              >
                Create
              </Button>
            )}
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
