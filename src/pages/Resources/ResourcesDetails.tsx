import {
  Box,
  Button,
  Heading,
  Input,
  Stack,
  HStack,
  Text,
  SimpleGrid,
  Flex,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, useParams } from "react-router-dom";

export default function ResourcesDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new" || !id;

  const [resourceName, setResourceName] = useState("");
  const [types, setTypes] = useState<string[]>([""]);
  const [units, setUnits] = useState<string[]>([""]);

  /* ---------------- Load existing resource ---------------- */
  useEffect(() => {
    if (!isNew) fetchResource();
  }, [id]);

  const fetchResource = async () => {
    const { data, error } = await supabase
      .from("resources")
      .select("name, types, units")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setResourceName(data.name);
    setTypes(data.types ? data.types.split(",") : [""]);
    setUnits(data.units ? data.units.split(",") : [""]);
  };

  /* ---------------- Save ---------------- */
  const handleSave = async () => {
    const payload: any = {
      name: resourceName.trim(),
      types: types.filter(Boolean).join(","),
      units: units.filter(Boolean).join(","),
    };

    if (!isNew) payload.id = id;

    const { error } = await supabase
      .from("resources")
      .upsert(payload, { onConflict: "name" });

    if (error) {
      alert(error.message);
      return;
    }

    navigate("/resources");
  };

  /* ---------------- Helpers ---------------- */
  const updateArrayValue = (
    arr: string[],
    index: number,
    value: string,
    setter: (v: string[]) => void
  ) => {
    const copy = [...arr];
    copy[index] = value;
    setter(copy);
  };

  return (
    <Flex direction="column" h="100%">
      {/* ===== SCROLLABLE CONTENT ===== */}
      <Box flex="1" overflowY="auto" px={6} py={4}>
        <Heading size="md" mb={6}>
          {isNew ? "Add Resource" : "Edit Resource"}
        </Heading>

        {/* Resource Name */}
        <Stack gap={2} mb={6}>
          <Text fontWeight="600">Resource Name</Text>
          <Input
            width="100%"
            value={resourceName}
            onChange={(e) => setResourceName(e.target.value)}
            placeholder="Cement / Steel"
          />
        </Stack>

        {/* Types */}
        <Heading size="sm" mb={2}>
          Types
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
          {types.map((type, index) => (
            <Input
              key={index}
              value={type}
              placeholder="PPC / OPC / 8mm"
              onChange={(e) =>
                updateArrayValue(types, index, e.target.value, setTypes)
              }
            />
          ))}
        </SimpleGrid>

        <Button
          mt={3}
          size="sm"
          onClick={() => setTypes([...types, ""])}
        >
          + Add Type
        </Button>

        {/* Units */}
        <Heading size="sm" mt={8} mb={2}>
          Units
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
          {units.map((unit, index) => (
            <Input
              key={index}
              value={unit}
              placeholder="Bag / Tonne"
              onChange={(e) =>
                updateArrayValue(units, index, e.target.value, setUnits)
              }
            />
          ))}
        </SimpleGrid>

        <Button
          mt={3}
          size="sm"
          onClick={() => setUnits([...units, ""])}
        >
          + Add Unit
        </Button>
      </Box>

      {/* ===== STICKY FOOTER ===== */}
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
          <Button variant="outline" onClick={() => navigate("/resources")}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSave}>
            Save
          </Button>
        </HStack>
      </Box>
    </Flex>
  );
}
