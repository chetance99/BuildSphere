import {
  Box,
  Flex,
  Input,
  Button,
  Stack,
  SimpleGrid,
  HStack,
  Spinner,
  Tabs,
  Table,
  NativeSelect,
  IconButton,
  Field,
} from "@chakra-ui/react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Trash2 } from "lucide-react";

type ResourceRow = {
  name: any;
  id?: string;
  type: string;
  unit: string;
  quantity: string;
  created?: string | null;
};

export default function WorkDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const isNew = id === "new";

  /* -------------------- State -------------------- */
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [workName, setWorkName] = useState("");
  const [tenderId, setTenderId] = useState<number | null>(null);
  const [cost, setCost] = useState<number | null>(null);
  const [appliedDifference, setAppliedDifference] = useState<number | null>(
    null
  );
  const [workDate, setWorkDate] = useState("");
  const [validity, setValidity] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* -------------------- Resource State -------------------- */
  const [resourcesMaster, setResourcesMaster] = useState<any[]>([]);
  const [resourceRows, setResourceRows] = useState<ResourceRow[]>([]);

  /* -------------------- Prefill Work (Edit Mode) -------------------- */
  useEffect(() => {
    if (isNew) return;

    const stateItem = location.state?.workItem;
    if (stateItem) {
      fillForm(stateItem);
      fetchWorkResources(stateItem.id);
    } else {
      fetchWorkItem();
    }
  }, [isNew, id]);

  const fetchWorkResources = async (workItemId: string) => {
    const { data, error } = await supabase
      .from("work_resources")
      .select(
        "id, resource_type, resource_unit, quantity_used, resource_name, created_at"
      )
      .eq("work_item_id", workItemId);

    if (error) {
      console.error(error);
      return;
    }

    setResourceRows(
      (data || []).map((r) => ({
        id: r.id,
        type: r.resource_type ?? "",
        unit: r.resource_unit ?? "",
        name: r.resource_name ?? "",
        quantity: r.quantity_used?.toString() ?? "",
        created: r.created_at ?? null,
      }))
    );
  };

  const fillForm = (w: any) => {
    setWorkName(w.work_name ?? "");
    setTenderId(w.tender_id);
    setCost(w.cost);
    setAppliedDifference(w.applied_difference);
    setWorkDate(w.work_date ?? "");
    setValidity(w.validity);
  };

  const fetchWorkItem = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("work_items")
      .select("*")
      .eq("id", id)
      .single();
    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    fillForm(data);
    fetchWorkResources(data.id);
  };

  /* -------------------- Fetch Resources Master -------------------- */
  useEffect(() => {
    if (isNew) return;

    const fetchResources = async () => {
      const { data } = await supabase
        .from("resources")
        .select("id, name, types, units");

      setResourcesMaster(data || []);
    };

    fetchResources();
  }, [isNew]);

  /* -------------------- Resource Helpers -------------------- */
  const addResourceRow = () => {
    setResourceRows([
      ...resourceRows,
      { type: "", unit: "", quantity: "", name: "" },
    ]);
  };

  const updateResourceRow = (
    index: number,
    key: keyof ResourceRow,
    value: string
  ) => {
    const updated = [...resourceRows];
    updated[index][key] = value;

    if (key === "name") {
      updated[index].type = "";
      updated[index].unit = "";
    }

    setResourceRows(updated);
  };

  const removeResourceRow = (index: number) => {
    setResourceRows(resourceRows.filter((_, i) => i !== index));
  };

  /* -------------------- Derived -------------------- */
  const finalAmount =
    cost != null && appliedDifference != null
      ? +(cost + (cost * appliedDifference) / 100)
      : "";

  const formatDate = (d?: string | null) => {
    if (!d) return "-";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "-";
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  /* -------------------- Save -------------------- */
  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    if (!workName.trim()) {
      newErrors.workName = "Work Name is required";
    }
    if (tenderId === null) {
      newErrors.tenderId = "Tender ID is required";
    }
    if (cost === null) {
      newErrors.cost = "Cost is required";
    }
    if (appliedDifference === null) {
      newErrors.appliedDifference = "Applied Difference is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    // 1️⃣ Save work item
    const payload = {
      work_name: workName,
      tender_id: tenderId,
      cost,
      applied_difference: appliedDifference,
      final_amount: finalAmount || null,
      work_date: workDate || null,
      validity,
    };

    let workId = id;

    let error;
    if (isNew) {
      const res = await supabase
        .from("work_items")
        .insert(payload)
        .select("id")
        .single();

      error = res.error;
      workId = res.data?.id;
    } else {
      ({ error } = await supabase
        .from("work_items")
        .update(payload)
        .eq("id", id));
    }

    if (error || !workId) {
      setSaving(false);
      alert(error?.message || "Work save failed");
      return;
    }

    // 2️⃣ Delete existing resources (edit mode)
    await supabase.from("work_resources").delete().eq("work_item_id", workId);

    // 3️⃣ Insert each resource row
    for (const row of resourceRows) {
      if (!row.quantity) continue;

      const { error: resErr } = await supabase.from("work_resources").insert({
        work_item_id: workId,
        resource_type: row.type,
        resource_unit: row.unit,
        resource_name: row.name,
        quantity_used: Number(row.quantity),
      });

      if (resErr) {
        setSaving(false);
        alert(resErr.message);
        return;
      }
    }

    setSaving(false);
    navigate("/worklist");
  };

  return (
    <Flex direction="column" h="100%">
      {(saving || loading) && (
        <Flex
          position="fixed"
          inset="0"
          bg="rgba(255,255,255,0.8)"
          zIndex="9999"
          align="center"
          justify="center"
        >
          <Spinner size="xl" />
        </Flex>
      )}

      <Box flex="1" overflowY="auto" px={6} py={4}>
        <Tabs.Root defaultValue="work">
          <Tabs.List mb={6}>
            <Tabs.Trigger value="work">Work Details</Tabs.Trigger>
            {!isNew && (
              <Tabs.Trigger value="resources">Resource Details</Tabs.Trigger>
            )}
          </Tabs.List>

          {/* ---------------- WORK DETAILS ---------------- */}
          <Tabs.Content value="work">
            <Stack gap={5}>
              <Field.Root invalid={!!errors.workName}>
                <Field.Label>
                  Work Name <span style={{ color: "red" }}>*</span>
                </Field.Label>
                <Input
                  value={workName}
                  onChange={(e) => {
                    setWorkName(e.target.value);
                    if (errors.workName) {
                      setErrors((prev) => ({ ...prev, workName: "" }));
                    }
                  }}
                />
                <Field.ErrorText>{errors.workName}</Field.ErrorText>
              </Field.Root>

              <Field.Root invalid={!!errors.tenderId}>
                <Field.Label>
                  Tender ID <span style={{ color: "red" }}>*</span>
                </Field.Label>
                <Input
                  type="number"
                  value={tenderId ?? ""}
                  onChange={(e) => {
                    setTenderId(
                      e.target.value ? Number(e.target.value) : null
                    );
                    if (errors.tenderId) {
                      setErrors((prev) => ({ ...prev, tenderId: "" }));
                    }
                  }}
                />
                <Field.ErrorText>{errors.tenderId}</Field.ErrorText>
              </Field.Root>

              <SimpleGrid columns={3} gap={4}>
                <Field.Root invalid={!!errors.cost}>
                  <Field.Label>
                    Cost <span style={{ color: "red" }}>*</span>
                  </Field.Label>
                  <Input
                    type="number"
                    value={cost ?? ""}
                    onChange={(e) => {
                      setCost(e.target.value ? Number(e.target.value) : null);
                      if (errors.cost) {
                        setErrors((prev) => ({ ...prev, cost: "" }));
                      }
                    }}
                  />
                  <Field.ErrorText>{errors.cost}</Field.ErrorText>
                </Field.Root>

                <Field.Root invalid={!!errors.appliedDifference}>
                  <Field.Label>
                    Applied Difference (%) <span style={{ color: "red" }}>*</span>
                  </Field.Label>
                  <Input
                    type="number"
                    value={appliedDifference ?? ""}
                    onChange={(e) => {
                      setAppliedDifference(
                        e.target.value ? Number(e.target.value) : null
                      );
                      if (errors.appliedDifference) {
                        setErrors((prev) => ({
                          ...prev,
                          appliedDifference: "",
                        }));
                      }
                    }}
                  />
                  <Field.ErrorText>
                    {errors.appliedDifference}
                  </Field.ErrorText>
                </Field.Root>

                <Field.Root>
                  <Field.Label>Final Amount</Field.Label>
                  <Input value={finalAmount} readOnly />
                </Field.Root>
              </SimpleGrid>

              <SimpleGrid columns={2} gap={4}>
                <Field.Root>
                  <Field.Label>Date of Work Order</Field.Label>
                  <Input
                    type="date"
                    value={workDate}
                    onChange={(e) => setWorkDate(e.target.value)}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>Validity (Months)</Field.Label>
                  <Input
                    type="number"
                    value={validity ?? ""}
                    onChange={(e) =>
                      setValidity(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                  />
                </Field.Root>
              </SimpleGrid>
            </Stack>
          </Tabs.Content>

          {/* ---------------- RESOURCE DETAILS ---------------- */}
          {!isNew && (
            <Tabs.Content value="resources">
              <Stack gap={4}>
                <HStack justify="flex-end">
                  <Button size="sm" onClick={addResourceRow}>
                    Add Resource
                  </Button>
                </HStack>

                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Resource</Table.ColumnHeader>
                      <Table.ColumnHeader>Type</Table.ColumnHeader>
                      <Table.ColumnHeader>Quantity</Table.ColumnHeader>
                      <Table.ColumnHeader>Unit</Table.ColumnHeader>
                      <Table.ColumnHeader>Created</Table.ColumnHeader>
                      <Table.ColumnHeader />
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {resourceRows.length === 0 ? (
                      <Table.Row>
                        <Table.Cell
                          colSpan={5}
                          textAlign="center"
                          color="gray.500"
                        >
                          No items to display
                        </Table.Cell>
                      </Table.Row>
                    ) : (
                      resourceRows.map((row, index) => {
                        const resource = resourcesMaster.find(
                          (r) => r.name === row.name
                        );

                        const types =
                          resource?.types
                            ?.split(",")
                            .map((t: string) => t.trim()) || [];
                        const units =
                          resource?.units
                            ?.split(",")
                            .map((u: string) => u.trim()) || [];

                        return (
                          <Table.Row key={index}>
                            <Table.Cell>
                              <NativeSelect.Root>
                                <NativeSelect.Field
                                  value={row.name}
                                  onChange={(e) =>
                                    updateResourceRow(
                                      index,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="" disabled hidden>
                                    Select
                                  </option>
                                  {resourcesMaster.map((r) => (
                                    <option key={r.name} value={r.name}>
                                      {r.name}
                                    </option>
                                  ))}
                                </NativeSelect.Field>
                              </NativeSelect.Root>
                            </Table.Cell>

                            <Table.Cell>
                              <NativeSelect.Root disabled={!resource}>
                                <NativeSelect.Field
                                  value={row.type}
                                  onChange={(e) =>
                                    updateResourceRow(
                                      index,
                                      "type",
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="" disabled hidden>
                                    Select
                                  </option>
                                  {types.map((t: string) => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </NativeSelect.Field>
                              </NativeSelect.Root>
                            </Table.Cell>

                            <Table.Cell>
                              <Input
                                type="number"
                                value={row.quantity}
                                onChange={(e) =>
                                  updateResourceRow(
                                    index,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                              />
                            </Table.Cell>

                            <Table.Cell>
                              <NativeSelect.Root disabled={!resource}>
                                <NativeSelect.Field
                                  value={row.unit}
                                  onChange={(e) =>
                                    updateResourceRow(
                                      index,
                                      "unit",
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="" disabled hidden>
                                    Select
                                  </option>
                                  {units.map((u: string) => (
                                    <option key={u} value={u}>
                                      {u}
                                    </option>
                                  ))}
                                </NativeSelect.Field>
                              </NativeSelect.Root>
                            </Table.Cell>

                            <Table.Cell>{formatDate(row.created)}</Table.Cell>

                            <Table.Cell>
                              <IconButton
                                aria-label="Delete"
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => removeResourceRow(index)}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })
                    )}
                  </Table.Body>
                </Table.Root>
              </Stack>
            </Tabs.Content>
          )}
        </Tabs.Root>
      </Box>

      <Box
        position="sticky"
        bottom="0"
        bg="white"
        borderTop="1px solid"
        borderColor="gray.200"
        px={6}
        py={3}
      >
        <HStack justify="flex-end">
          <Button variant="outline" onClick={() => navigate("/worklist")}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSave} disabled={saving}>
            Save
          </Button>
        </HStack>
      </Box>
    </Flex>
  );
}
