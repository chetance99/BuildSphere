import {
  Box,
  Table,
  IconButton,
  Text,
  Flex,
  Button,
  Dialog,
  Spinner
} from "@chakra-ui/react";
import { Pencil, Plus, Trash, Eye, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

/* -------------------- Types -------------------- */
type WorkItem = {
  id: string;
  work_name: string;
  tender_id: number | null;
  cost: number | null;
  applied_difference: number | null;
  final_amount: number | null;
  work_date: string | null;
  validity: number | null;
};

type WorkResource = {
  resource_name: string | null;
  resource_type: string | null;
  resource_unit: string | null;
  quantity_used: number;
};

type AggregatedResource = {
  resource_name: string;
  resource_type: string;
  resource_unit: string;
  quantity: number;
};

/* -------------------- Utils -------------------- */
const truncate = (text?: string, max = 22) =>
  text && text.length > max ? `${text.slice(0, max)}...` : text;

const formatLakhs = (value?: number | null) =>
  value != null ? `₹${(value / 100000).toFixed(2)} L` : "-";

/* -------------------- Component -------------------- */
const WorkList = () => {
  const [data, setData] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  /* Preview states */
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<AggregatedResource[]>([]);
  const [previewTitle, setPreviewTitle] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkItems();
  }, []);

  const fetchWorkItems = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("work_items")
      .select("*")
      .order("work_date", { ascending: false });

    if (!error) setData(data || []);
    setLoading(false);
  };

  const handleEdit = (item: WorkItem) => {
    navigate(`/workdetails/${item.id}`);
  };

  const handleDelete = async (item: WorkItem) => {
    const ok = window.confirm(
      `Delete "${item.work_name}"? This action cannot be undone.`
    );
    if (!ok) return;

    const { error } = await supabase
      .from("work_items")
      .delete()
      .eq("id", item.id);

    if (!error) fetchWorkItems();
  };

  /* -------------------- PREVIEW LOGIC -------------------- */
  const handlePreview = async (item: WorkItem) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewTitle(item.work_name);

    const { data, error } = await supabase
      .from("work_resources")
      .select(
        "resource_name, resource_type, resource_unit, quantity_used"
      )
      .eq("work_item_id", item.id);

    if (!error && data) {
      const map = new Map<string, AggregatedResource>();

      data.forEach((r: WorkResource) => {
        const key = `${r.resource_name}|${r.resource_type}|${r.resource_unit}`;

        if (!map.has(key)) {
          map.set(key, {
            resource_name: r.resource_name || "-",
            resource_type: r.resource_type || "-",
            resource_unit: r.resource_unit || "-",
            quantity: Number(r.quantity_used),
          });
        } else {
          map.get(key)!.quantity += Number(r.quantity_used);
        }
      });

      setPreviewData(Array.from(map.values()));
    }

    setPreviewLoading(false);
  };

  /* -------------------- DOWNLOAD CSV -------------------- */
  const handleDownloadCSV = async () => {
    const rows: string[] = [];
    rows.push(
      "Work Name,Tender ID,Cost (L),Final Amount (L),Resource,Type,Unit,Quantity"
    );

    for (const work of data) {
      const { data: resources } = await supabase
        .from("work_resources")
        .select(
          "resource_name, resource_type, resource_unit, quantity_used"
        )
        .eq("work_item_id", work.id);

      const map = new Map<string, AggregatedResource>();

      resources?.forEach((r: WorkResource) => {
        const key = `${r.resource_name}|${r.resource_type}|${r.resource_unit}`;

        if (!map.has(key)) {
          map.set(key, {
            resource_name: r.resource_name || "-",
            resource_type: r.resource_type || "-",
            resource_unit: r.resource_unit || "-",
            quantity: Number(r.quantity_used),
          });
        } else {
          map.get(key)!.quantity += Number(r.quantity_used);
        }
      });

      if (map.size === 0) {
        rows.push(
          `"${work.work_name}",${work.tender_id ?? "-"},${
            work.cost ? (work.cost / 100000).toFixed(2) : "-"
          },${
            work.final_amount
              ? (work.final_amount / 100000).toFixed(2)
              : "-"
          },-,-,-,-`
        );
      } else {
        let first = true;
        map.forEach((r) => {
          if (first) {
            rows.push(
              `"${work.work_name}",${work.tender_id ?? "-"},${
                work.cost ? (work.cost / 100000).toFixed(2) : "-"
              },${
                work.final_amount
                  ? (work.final_amount / 100000).toFixed(2)
                  : "-"
              },"${r.resource_name}","${r.resource_type}","${r.resource_unit}",${r.quantity}`
            );
            first = false;
          } else {
            rows.push(
              `,,,,"${r.resource_name}","${r.resource_type}","${r.resource_unit}",${r.quantity}`
            );
          }
        });
      }
    }

    const blob = new Blob([rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "work-resources-report.csv";
    link.click();
  };

  return (
    <Box bg="white" rounded="md" shadow="sm" p={4}>
      {/* HEADER */}
      <Flex align="center" justify="space-between" mb={4}>
        <Text fontSize="lg" fontWeight="bold">
          Work List
        </Text>

        <Flex gap={2}>
          <Button size="sm" onClick={handleDownloadCSV}>
            <Download size={16} />
            Download Report
          </Button>

          <Button size="sm" onClick={() => navigate("/workdetails/new")}>
            <Plus size={16} />
            Create
          </Button>
        </Flex>
      </Flex>

      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Work Name</Table.ColumnHeader>
            <Table.ColumnHeader>Tender ID</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Cost (L)</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">
              Excess/Less
            </Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">
              Final Amount (L)
            </Table.ColumnHeader>
            <Table.ColumnHeader>Validity</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {loading ? (
            <Table.Row>
              <Table.Cell colSpan={8}>Loading...</Table.Cell>
            </Table.Row>
          ) : data.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={8}>No work items found</Table.Cell>
            </Table.Row>
          ) : (
            data.map((item) => (
              <Table.Row key={item.id}>
                <Table.Cell title={item.work_name}>
                  {truncate(item.work_name)}
                </Table.Cell>
                <Table.Cell>{item.tender_id ?? "-"}</Table.Cell>
                <Table.Cell textAlign="end">
                  {formatLakhs(item.cost)}
                </Table.Cell>
                <Table.Cell textAlign="end">
                  {item.applied_difference
                    ? `${item.applied_difference}%`
                    : "-"}
                </Table.Cell>
                <Table.Cell textAlign="end">
                  {formatLakhs(item.final_amount)}
                </Table.Cell>
                <Table.Cell>{item.validity ?? "-"}</Table.Cell>
                <Table.Cell>
                  <IconButton
                    aria-label="Preview"
                    size="sm"
                    variant="ghost"
                    onClick={() => handlePreview(item)}
                  >
                    <Eye size={16} />
                  </IconButton>

                  <IconButton
                    aria-label="Edit"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(item)}
                  >
                    <Pencil size={16} />
                  </IconButton>

                  <IconButton
                    aria-label="Delete"
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash size={16} />
                  </IconButton>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table.Root>

      {/* -------------------- PREVIEW DIALOG -------------------- */}
      <Dialog.Root
        open={previewOpen}
        onOpenChange={(e) => setPreviewOpen(e.open)}
        size="xl"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Resources Preview</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Text fontWeight="bold" mb={3}>
                {previewTitle}
              </Text>

              {previewLoading ? (
                <Spinner />
              ) : previewData.length === 0 ? (
                <Text>No resources found</Text>
              ) : (
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Resource</Table.ColumnHeader>
                      <Table.ColumnHeader>Type</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="end">
                        Total Quantity
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>Unit</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {previewData.map((r, i) => (
                      <Table.Row key={i}>
                        <Table.Cell>{r.resource_name}</Table.Cell>
                        <Table.Cell>{r.resource_type}</Table.Cell>
                        <Table.Cell textAlign="end">
                          {r.quantity}
                        </Table.Cell>
                        <Table.Cell>{r.resource_unit}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              <Button onClick={() => setPreviewOpen(false)}>Close</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
};

export default WorkList;
