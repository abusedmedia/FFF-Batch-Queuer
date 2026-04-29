import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Pagination,
  Select,
  Table,
  TextInput,
  Textarea,
  Text,
  Title,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { createJob, deleteJob, fetchCustomers, fetchJobs, updateJob } from "../api";
import type { Customer, Job } from "../types";

function getStatusColor(status: Job["status"]): string {
  switch (status) {
    case "pending":
      return "yellow";
    case "running":
      return "blue";
    case "done":
      return "green";
    case "failed":
      return "red";
  }
}

export function JobsPage() {
  const DEFAULT_PAGE_SIZE = 50;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [modalCustomerId, setModalCustomerId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchCustomers(),
      fetchJobs({
        customerId: selectedCustomerId ?? undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
    ])
      .then(([customerRows, jobsResult]) => {
        setCustomers(customerRows);
        setJobs(jobsResult.jobs);
        setTotalJobs(jobsResult.total);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedCustomerId, page, pageSize, reloadToken]);

  const totalPages = Math.max(1, Math.ceil(totalJobs / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
    if (saving || deleting) return;
    setModalOpened(false);
    setEditingJob(null);
  }

  async function onDeleteJob(): Promise<void> {
    if (!editingJob) return;
    if (!window.confirm(`Delete job "${editingJob.name}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setSaveError(null);
    try {
      await deleteJob(editingJob.id);
      setModalOpened(false);
      setEditingJob(null);
      setReloadToken((value) => value + 1);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to delete job");
    } finally {
      setDeleting(false);
    }
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
        if (!selectedCustomerId || selectedCustomerId === result.job.customerId) {
          setPage(1);
          setReloadToken((value) => value + 1);
        }
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

        setEditingJob((prev) => (prev ? { ...prev, ...result.job } : prev));
        setReloadToken((value) => value + 1);
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
      <Group justify="space-between" mb="md" align="flex-end" wrap="wrap">
        <Title order={3}>Jobs</Title>
        <Group wrap="wrap" justify="flex-end">
          <Select
            placeholder="Filter by customer"
            clearable
            data={customerOptions}
            value={selectedCustomerId}
            onChange={(value) => {
              setSelectedCustomerId(value);
              setPage(1);
            }}
            w={{ base: "100%", sm: 280 }}
            maw={360}
          />
          <Group gap="xs" wrap="nowrap">
            <ActionIcon
              variant="default"
              size="lg"
              aria-label="Reload jobs"
              onClick={() => setReloadToken((value) => value + 1)}
              disabled={loading}
            >
              <IconRefresh size={18} stroke={1.5} />
            </ActionIcon>
            <Button onClick={openCreateModal} miw={120}>
              New Job
            </Button>
          </Group>
        </Group>
      </Group>
      {loading && <Loader />}
      {error && <Alert color="red">{error}</Alert>}
      {!loading && !error && jobs.length === 0 && (
        <Text c="dimmed">No jobs found.</Text>
      )}
      {!loading && !error && jobs.length > 0 && (
        <>
          <Table.ScrollContainer minWidth={760}>
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
                    <Table.Td>
                      <Badge color={getStatusColor(job.status)} variant="light">
                        {job.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{job.attempts}</Table.Td>
                    <Table.Td>{job.errorAttempts}</Table.Td>
                    <Table.Td>
                      <Button variant="light" onClick={() => openEditModal(job)}>
                        Edit
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          <Group justify="space-between" mt="md" wrap="wrap">
            <Text size="sm" c="dimmed">
              Showing {jobs.length} of {totalJobs} jobs
            </Text>
            <Group wrap="wrap" justify="flex-end">
              <Select
                data={["25", "50", "100", "200"]}
                value={String(pageSize)}
                onChange={(value) => {
                  const parsed = Number(value ?? DEFAULT_PAGE_SIZE);
                  setPageSize(Number.isFinite(parsed) ? parsed : DEFAULT_PAGE_SIZE);
                  setPage(1);
                }}
                w={96}
              />
              <Pagination value={page} onChange={setPage} total={totalPages} />
            </Group>
          </Group>
        </>
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
            disabled={saving || modalMode === "edit"}
            readOnly={modalMode === "edit"}
          />
          <TextInput
            label="url"
            value={modalUrl}
            onChange={(event) => setModalUrl(event.currentTarget.value)}
            disabled={saving || deleting}
          />
        </Group>
        <Group mt="sm" grow align="start">
          <Select
            label="method"
            data={["GET", "POST", "PUT", "PATCH", "DELETE"]}
            value={modalMethod}
            onChange={(value) => setModalMethod(value ?? "POST")}
            disabled={saving || deleting}
          />
          <NumberInput
            label="max_attempts"
            min={1}
            value={modalErrorAttemptLimit}
            onChange={(value) =>
              setModalErrorAttemptLimit(typeof value === "number" ? value : 1)
            }
            disabled={saving || deleting}
          />
        </Group>
        <Group mt="sm" grow align="start">
          <NumberInput
            label="success_limit"
            value={modalSuccessLimit}
            onChange={(value) =>
              setModalSuccessLimit(typeof value === "number" ? value : 1)
            }
            disabled={saving || deleting}
          />
          <NumberInput
            label="success_retry_delay_seconds"
            min={1}
            value={modalSuccessRetryDelaySeconds}
            onChange={(value) =>
              setModalSuccessRetryDelaySeconds(typeof value === "number" ? value : 30)
            }
            disabled={saving || deleting}
          />
        </Group>
        <Textarea
          mt="sm"
          label="payload"
          minRows={4}
          autosize
          value={modalPayload}
          onChange={(event) => setModalPayload(event.currentTarget.value)}
          disabled={saving || deleting}
        />
        <Textarea
          mt="sm"
          label="headers"
          minRows={4}
          autosize
          value={modalHeaders}
          onChange={(event) => setModalHeaders(event.currentTarget.value)}
          disabled={saving || deleting}
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
          {modalMode === "edit" && (
            <Button
              color="red"
              variant="light"
              onClick={() => void onDeleteJob()}
              loading={deleting}
              disabled={saving}
              mr="auto"
            >
              Delete job
            </Button>
          )}
          <Button variant="default" onClick={closeModal} disabled={saving || deleting}>
            Cancel
          </Button>
          <Button
            onClick={() => void onSaveModal()}
            loading={saving}
            disabled={
              deleting ||
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
