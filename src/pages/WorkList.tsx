import {
  Box,
  Heading,
  Button,
  VStack,
  HStack,
  Text,
} from "@chakra-ui/react";

const WorkList = () => {
  const items = ["Task 1", "Task 2", "Task 3"];

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">Work List</Heading>
        <Button colorScheme="teal">Create</Button>
      </HStack>

      <VStack align="start" gap={3}>
        {items.map((item, index) => (
          <Box
            key={index}
            p={4}
            w="full"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
          >
            <Text>{item}</Text>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default WorkList;
