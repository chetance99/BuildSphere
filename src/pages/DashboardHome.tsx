import { Box, Heading, Text, SimpleGrid, Flex } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const DashboardHome = () => {
  const [totalResources, setTotalResources] = useState(0);
  const [totalWorks, setTotalWorks] = useState(0);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    // Total Resources
    const { count: resourceCount } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true });

    // Total Works
    const { count: workCount } = await supabase
      .from("work_items")
      .select("*", { count: "exact", head: true });

    setTotalResources(resourceCount || 0);
    setTotalWorks(workCount || 0);
  };

  return (
    <Box>
      <Heading mb={2}>Dashboard</Heading>
      <Text color="gray.600" mb={6}>
        Overview of your system
      </Text>

      {/* ===== Tiles ===== */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        {/* Total Resources */}
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          rounded="md"
          p={6}
        >
          <Flex direction="column">
            <Text fontSize="sm" color="gray.500">
              Total Resources
            </Text>
            <Text fontSize="3xl" fontWeight="bold" mt={2}>
              {totalResources}
            </Text>
          </Flex>
        </Box>

        {/* Total Works */}
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          rounded="md"
          p={6}
        >
          <Flex direction="column">
            <Text fontSize="sm" color="gray.500">
              Total Works
            </Text>
            <Text fontSize="3xl" fontWeight="bold" mt={2}>
              {totalWorks}
            </Text>
          </Flex>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default DashboardHome;
