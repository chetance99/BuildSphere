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

/* -------------------- Component -------------------- */
const ResourcesList = () => {
  const [data, setData] = useState<Resource[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    const { data, error } = await supabase
      .from("resources")
      .select("id, name, types, units")
      .order("name");

    if (!error && data) setData(data);
  };

  const handleDelete = async (item: Resource) => {
    const ok = window.confirm(`Delete "${item.name}"? This action cannot be undone.`);
    if (!ok) return;

    const { error } = await supabase.from("resources").delete().eq("id", item.id);
    if (error) {
      console.error("Delete failed:", error);
      return;
    }

    // Refresh list
    fetchResources();
  };

  return (
    <Box bg="white" rounded="md" shadow="sm" p={4}>
      {/* HEADER */}
      <Flex align="center" justify="space-between" mb={4}>
        <Text fontSize="lg" fontWeight="bold">
          Resources
        </Text>
        <Button size="sm" onClick={() => navigate("/resources/new")}>
          <Plus size={16} />
          Create
        </Button>
      </Flex>

      {/* TABLE */}
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
          {data.map((item) => (
            <Table.Row key={item.id}>
              <Table.Cell>{item.name}</Table.Cell>
              <Table.Cell>{item.types ? item.types : "-"}</Table.Cell>
              <Table.Cell>{item.units ? item.units : "-"}</Table.Cell>
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
