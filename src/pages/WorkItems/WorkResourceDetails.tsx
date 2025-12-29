import {
  Box,
  Flex,
  Heading,
  Button,
  HStack
} from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export default function WorkResourceDetails() {
  const navigate = useNavigate();
  const location = useLocation();

  const { workId } = (location.state as any) || {};
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    // TODO: add save logic later

    setTimeout(() => {
      setSaving(false);
      navigate(`/workdetails/${workId}`);
    }, 800);
  };

  return (
    <Flex direction="column" h="100%">
      {/* PAGE CONTENT */}
      <Box flex="1" overflow="auto" px={6} py={4}>
        <Heading size="md" mb={4}>
          Add Resource for Work
        </Heading>

        {/* PLACEHOLDER CONTENT */}
        <Box
          bg="gray.50"
          border="1px dashed"
          borderColor="gray.300"
          p={6}
          rounded="md"
          minH="200px"
        >
          Work resource form will be added here
        </Box>
      </Box>

      {/* STICKY ACTION BAR */}
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
          <Button
            variant="outline"
            onClick={() => navigate(`/workdetails/${workId}`)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </HStack>
      </Box>
    </Flex>
  );
}
