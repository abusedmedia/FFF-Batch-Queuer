import {
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Select,
  Table,
  TextInput,
  Textarea,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { createJob, fetchCustomers, fetchJobs, updateJob } from "../api";
import type { Customer, Job } from "../types";

export function JobsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [modalCustomerId, setModalCustomerId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [modalName, setModalName] = useState("");
  const [modalUrl, setModalUrl] = useState("");
  const [modalMethod, setModalMethod] = useState<string>("POST");
  const [modalPayload, setModalPayload] = useState("");
  const [modalHeaders, setModalHeaders] = useState("");
  const [modalErrorAttemptLimit, setModalErrorAttemptLimit] = useState<number>(1);
  const [modalSuccessLimit, setModalSuccessLimit] = useState<number>(1);
  const [modalSuccessRetryDelaySeconds, setModalSuccessRetryDelaySeconds] =
    useState<number>(30);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchCustomers(), fetchJobs(selectedCustomerId ?? undefined)])
      .then(([customerRows, jobRows]) => {
        setCustomers(customerRows);
        setJobs(jobRows);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedCustomerId]);

  const customerOptions = useMemo(
    () =>
      customers.map((customer) => ({
        value: customer.id,
        label: customer.name,
      })),
    [customers],
  );

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  function openEditModal(job: Job): void {
    setModalOpened(true);
    setModalMode("edit");
    setEditingJob(job);
    setModalCustomerId(job.customerId);
    setSaveError(null);
    setModalName(job.name);
    setModalUrl(job.url);
    setModalMethod(job.method);
    setModalPayload(job.payload == null ? "" : JSON.stringify(job.payload, null, 2));
    setModalHeaders(job.headers == null ? "" : JSON.stringify(job.headers, null, 2));
    setModalErrorAttemptLimit(job.errorAttemptLimit);
    setModalSuccessLimit(job.successLimit);
    setModalSuccessRetryDelaySeconds(job.successRetryDelaySeconds);
  }

  function openCreateModal(): void {
    setModalOpened(true);
    setModalMode("create");
    setEditingJob(null);
    setModalCustomerId(selectedCustomerId ?? customerOptions[0]?.value ?? null);
    setSaveError(null);
    setModalName("");
    setModalUrl("");
    setModalMethod("POST");
    setModalPayload("");
    setModalHeaders("");
    setModalErrorAttemptLimit(1000);
    setModalSuccessLimit(1);
    setModalSuccessRetryDelaySeconds(30);
  }

  function closeModal(): void {
    if (saving) return;
    setModalOpened(false);
    setEditingJob(null);
  }

  async function onSaveModal(): Promise<void> {
    setSaving(true);
    setSaveError(null);

    try {
      const parsedPayload =
        modalPayload.trim().length === 0 ? null : JSON.parse(modalPayload);
      const parsedHeaders =
        modalHeaders.trim().length === 0
          ? null
          : (JSON.parse(modalHeaders) as Record<string, string>);

      const method = modalMethod as "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      if (modalMode === "create") {
        if (!modalCustomerId) {
          throw new Error("Customer is required");
        }
        const result = await createJob({
          customerId: modalCustomerId,
          name: modalName.trim(),
          url: modalUrl.trim(),
          method,
          payload: parsedPayload,
          headers: parsedHeaders,
          errorAttemptLimit: modalErrorAttemptLimit,
          successLimit: modalSuccessLimit,
          successRetryDelaySeconds: modalSuccessRetryDelaySeconds,
        });

        setJobs((rows) => {
          if (selectedCustomerId && result.job.customerId !== selectedCustomerId) {
            return rows;
          }
          return [result.job, ...rows];
        });
        closeModal();
      } else {
        if (!editingJob) return;
        const result = await updateJob(editingJob.id, {
          name: modalName.trim(),
          url: modalUrl.trim(),
          method,
          payload: parsedPayload,
          headers: parsedHeaders,
          errorAttemptLimit: modalErrorAttemptLimit,
          successLimit: modalSuccessLimit,
          successRetryDelaySeconds: modalSuccessRetryDelaySeconds,
        });

        setJobs((rows) =>
          rows.map((row) => (row.id === result.job.id ? { ...row, ...result.job } : row)),
        );
        setEditingJob((prev) => (prev ? { ...prev, ...result.job } : prev));
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : modalMode === "create"
            ? "Failed to create job"
            : "Failed to update job";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={3}>Jobs</Title>
        <Group>
          <Select
            placeholder="Filter by customer"
            clearable
            data={customerOptions}
            value={selectedCustomerId}
            onChange={setSelectedCustomerId}
            w={280}
          />
          <Button onClick={openCreateModal}>New Job</Button>
        </Group>
      </Group>
      {loading && <Loader />}
      {error && <Alert color="red">{error}</Alert>}
      {!loading && !error && jobs.length === 0 && (
        <Text c="dimmed">No jobs found.</Text>
      )}
      {!loading && !error && jobs.length > 0 && (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Customer</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Attempts</Table.Th>
              <Table.Th>Error Attempts</Table.Th>
              <Table.Th>Edit</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {jobs.map((job) => (
              <Table.Tr key={job.id}>
                <Table.Td>{job.name}</Table.Td>
                <Table.Td>{job.customerName}</Table.Td>
                <Table.Td>{job.status}</Table.Td>
                <Table.Td>{job.attempts}</Table.Td>
                <Table.Td>{job.errorAttempts}</Table.Td>
                <Table.Td>
                  <Button variant="light" size="xs" onClick={() => openEditModal(job)}>
                    Edit
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={modalMode === "create" ? "New job" : "Edit job"}
        centered
        size="lg"
      >
        {modalMode === "create" && (
          <Select
            mb="sm"
            label="customer"
            placeholder="Select customer"
            data={customerOptions}
            value={modalCustomerId}
            onChange={setModalCustomerId}
            disabled={saving}
            searchable
          />
        )}
        <Group grow align="start">
          <TextInput
            label="name"
            value={modalName}
            onChange={(event) => setModalName(event.currentTarget.value)}
            disabled={saving}
          />
          <TextInput
            label="url"
            value={modalUrl}
            onChange={(event) => setModalUrl(event.currentTarget.value)}
            disabled={saving}
          />
        </Group>
        <Group mt="sm" grow align="start">
          <Select
            label="method"
            data={["GET", "POST", "PUT", "PATCH", "DELETE"]}
            value={modalMethod}
            onChange={(value) => setModalMethod(value ?? "POST")}
            disabled={saving}
          />
          <NumberInput
            label="max_attempts"
            min={1}
            value={modalErrorAttemptLimit}
            onChange={(value) =>
              setModalErrorAttemptLimit(typeof value === "number" ? value : 1)
            }
            disabled={saving}
          />
        </Group>
        <Group mt="sm" grow align="start">
          <NumberInput
            label="success_limit"
            value={modalSuccessLimit}
            onChange={(value) =>
              setModalSuccessLimit(typeof value === "number" ? value : 1)
            }
            disabled={saving}
          />
          <NumberInput
            label="success_retry_delay_seconds"
            min={1}
            value={modalSuccessRetryDelaySeconds}
            onChange={(value) =>
              setModalSuccessRetryDelaySeconds(typeof value === "number" ? value : 30)
            }
            disabled={saving}
          />
        </Group>
        <Textarea
          mt="sm"
          label="payload"
          minRows={4}
          autosize
          value={modalPayload}
          onChange={(event) => setModalPayload(event.currentTarget.value)}
          disabled={saving}
        />
        <Textarea
          mt="sm"
          label="headers"
          minRows={4}
          autosize
          value={modalHeaders}
          onChange={(event) => setModalHeaders(event.currentTarget.value)}
          disabled={saving}
        />
        {saveError && (
          <Alert mt="sm" color="red">
            {saveError}
          </Alert>
        )}
        {modalMode === "edit" && editingJob && (
          <Alert mt="sm" color="gray" title="Read-only info">
            <Text size="sm">id: {editingJob.id}</Text>
            <Text size="sm">customer: {editingJob.customerName}</Text>
            <Text size="sm">status: {editingJob.status}</Text>
            <Text size="sm">attempts: {editingJob.attempts}</Text>
            <Text size="sm">error_attempt_limit: {editingJob.errorAttemptLimit}</Text>
            <Text size="sm">success_count: {editingJob.successCount}</Text>
            <Text size="sm">created_at: {formatDate(editingJob.createdAt)}</Text>
            <Text size="sm">updated_at: {formatDate(editingJob.updatedAt)}</Text>
            <Text size="sm">
              completed_at:{" "}
              {editingJob.completedAt ? formatDate(editingJob.completedAt) : "-"}
            </Text>
            <Text size="sm">last_status: {editingJob.lastStatus ?? "-"}</Text>
            <Text size="sm">last_error: {editingJob.lastError ?? "-"}</Text>
          </Alert>
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeModal} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={() => void onSaveModal()}
            loading={saving}
            disabled={
              modalName.trim().length === 0 ||
              modalUrl.trim().length === 0 ||
              (modalMode === "create" && !modalCustomerId)
            }
          >
            {modalMode === "create" ? "Create" : "Save"}
          </Button>
        </Group>
      </Modal>
    </>
  );
}
