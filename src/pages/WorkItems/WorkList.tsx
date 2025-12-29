import {
  Box,
  Table,
  IconButton,
  Text,
  Flex,
  Button
} from "@chakra-ui/react";
import { Pencil, Plus, Trash } from "lucide-react";
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

/* -------------------- Utils -------------------- */
const truncate = (text?: string, max = 22) =>
  text && text.length > max ? `${text.slice(0, max)}...` : text;

const formatLakhs = (value?: number | null) =>
  value != null ? `₹${(value / 100000).toFixed(2)} L` : "-";

/* -------------------- Component -------------------- */
const WorkList = () => {
  const [data, setData] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
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

    if (error) {
      console.error("Error fetching work items:", error);
    } else {
      setData(data || []);
    }

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

  return (
    <Box bg="white" rounded="md" shadow="sm" p={4}>
      {/* HEADER */}
      <Flex align="center" justify="space-between" mb={4}>
        <Text fontSize="lg" fontWeight="bold">
          Work List
        </Text>

        <Button size="sm" onClick={() => navigate("/workdetails/new")}>
          <Plus size={16} />
          Create
        </Button>
      </Flex>

      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Work Name</Table.ColumnHeader>
            <Table.ColumnHeader>Tender ID</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Cost (L)</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Excess/Less</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Final Amount (L)</Table.ColumnHeader>
            <Table.ColumnHeader>Work Date</Table.ColumnHeader>
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
                <Table.Cell title={item.work_name}>{truncate(item.work_name)}</Table.Cell>
                <Table.Cell>{item.tender_id ?? "-"}</Table.Cell>
                <Table.Cell textAlign="end">{formatLakhs(item.cost)}</Table.Cell>
                <Table.Cell textAlign="end">
                  {item.applied_difference ? `${item.applied_difference.toLocaleString()}%` : "-"}
                </Table.Cell>
                <Table.Cell textAlign="end">{formatLakhs(item.final_amount)}</Table.Cell>
                <Table.Cell>{item.work_date ? new Date(item.work_date).toLocaleDateString() : "-"}</Table.Cell>
                <Table.Cell>{item.validity ?? "-"}</Table.Cell>
                <Table.Cell>
                  <IconButton aria-label="Edit" size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                    <Pencil size={16} />
                  </IconButton>

                  <IconButton aria-label="Delete" size="sm" variant="ghost" colorScheme="red" onClick={() => handleDelete(item)}>
                    <Trash size={16} />
                  </IconButton>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table.Root>
    </Box>
  );
};

export default WorkList;
