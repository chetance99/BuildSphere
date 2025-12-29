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
  const [isReferenced, setIsReferenced] = useState(false);

  // Track original length to detect new additions
  const [initialTypesCount, setInitialTypesCount] = useState(0);
  const [initialUnitsCount, setInitialUnitsCount] = useState(0);

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

    const loadedTypes = data.types ? data.types.split(",") : [""];
    const loadedUnits = data.units ? data.units.split(",") : [""];

    setResourceName(data.name);
    setTypes(loadedTypes);
    setUnits(loadedUnits);
    setInitialTypesCount(loadedTypes.length);
    setInitialUnitsCount(loadedUnits.length);

    // 🔍 Check reference in work_resources
    const { data: used } = await supabase
      .from("work_resources")
      .select("id")
      .eq("resource_name", data.name)
      .limit(1);

    if (used && used.length > 0) {
      setIsReferenced(true);
    }
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

        {/* ⚠️ WARNING */}
        {isReferenced && (
          <Box
            bg="yellow.100"
            border="1px solid"
            borderColor="yellow.300"
            rounded="md"
            p={3}
            mb={6}
          >
            <Text fontSize="sm" color="yellow.800">
              This resource is already referenced in work items.
              <br />
              You can only add new Types or Units. Existing values cannot be
              edited.
            </Text>
          </Box>
        )}

        {/* Resource Name */}
        <Stack gap={2} mb={6}>
          <Text fontWeight="600">Resource Name</Text>
          <Input
            value={resourceName}
            readOnly={isReferenced}
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
              readOnly={isReferenced && index < initialTypesCount}
              onChange={(e) =>
                updateArrayValue(types, index, e.target.value, setTypes)
              }
            />
          ))}
        </SimpleGrid>

        <Button mt={3} size="sm" onClick={() => setTypes([...types, ""])}>
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
              readOnly={isReferenced && index < initialUnitsCount}
              onChange={(e) =>
                updateArrayValue(units, index, e.target.value, setUnits)
              }
            />
          ))}
        </SimpleGrid>

        <Button mt={3} size="sm" onClick={() => setUnits([...units, ""])}>
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
