import {
  Box,
  Table,
  Text,
  Flex,
  Button,
  IconButton,
} from "@chakra-ui/react";
import { Pencil, Plus, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

/* -------------------- Types -------------------- */
type Resource = {
  id: string;
  name: string;
  types?: string | null;
  units?: string | null;
};

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

/* -------------------- Component -------------------- */
const ResourcesList = () => {
  const [data, setData] = useState<Resource[]>([]);
  const [toast, setToast] = useState<ToastState>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResources();
  }, []);

  /* -------------------- Toast Helper -------------------- */
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* -------------------- Fetch -------------------- */
  const fetchResources = async () => {
    const { data, error } = await supabase
      .from("resources")
      .select("id, name, types, units")
      .order("name");

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setData(data || []);
  };

  /* -------------------- Delete -------------------- */
  const handleDelete = async (item: Resource) => {
    const ok = window.confirm(
      `Delete "${item.name}"? This action cannot be undone.`
    );
    if (!ok) return;

    // 🔍 Check reference
    const { data: used, error: checkError } = await supabase
      .from("work_resources")
      .select("id")
      .eq("resource_name", item.name)
      .limit(1);

    if (checkError) {
      showToast(checkError.message, "error");
      return;
    }

    if (used && used.length > 0) {
      showToast(
        "This resource is already used and cannot be deleted.",
        "error"
      );
      return;
    }

    // ✅ Safe delete
    const { error } = await supabase
      .from("resources")
      .delete()
      .eq("id", item.id);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    showToast("Resource deleted successfully", "success");
    fetchResources();
  };

  /* -------------------- UI -------------------- */
  return (
    <Box bg="white" rounded="md" shadow="sm" p={4} position="relative">
      {/* 🔔 Custom Toast */}
      {toast && (
        <Box
          position="fixed"
          bottom="24px"
          left="50%"
          transform="translateX(-50%)"
          bg={toast.type === "error" ? "red.500" : "green.500"}
          color="white"
          px={4}
          py={2}
          rounded="md"
          shadow="lg"
          zIndex={9999}
        >
          {toast.message}
        </Box>
      )}

      {/* Header */}
      <Flex align="center" justify="space-between" mb={4}>
        <Text fontSize="lg" fontWeight="bold">
          Resources
        </Text>

        <Button
          size="sm"
          onClick={() => navigate("/resources/new")}
          display="flex"
          alignItems="center"
          gap={2}
        >
          <Plus size={16} />
          Create
        </Button>
      </Flex>

      {/* Table */}
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Resource Name</Table.ColumnHeader>
            <Table.ColumnHeader>Types</Table.ColumnHeader>
            <Table.ColumnHeader>Units</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {data.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={4}>
                <Text textAlign="center" color="gray.500">
                  No resources found
                </Text>
              </Table.Cell>
            </Table.Row>
          )}

          {data.map((item) => (
            <Table.Row key={item.id}>
              <Table.Cell>{item.name}</Table.Cell>
              <Table.Cell>{item.types || "-"}</Table.Cell>
              <Table.Cell>{item.units || "-"}</Table.Cell>
              <Table.Cell>
                <IconButton
                  aria-label="Edit"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    navigate(`/resources/${item.id}`, {
                      state: { resource: item },
                    })
                  }
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
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
};

export default ResourcesList;
