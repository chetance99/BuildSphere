import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Flex, Box, VStack, HStack, Text, Button, Avatar } from "@chakra-ui/react";
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/");
      else setEmail(session.user.email ?? "");
      setCheckingAuth(false);
    });
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (checkingAuth) return <Box p={6}>Loading...</Box>;

  const initials = email ? email[0].toUpperCase() : "";

  const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    display: "block",
    width: "100%",
    padding: "8px 12px",
    borderRadius: "8px",
    fontWeight: isActive ? 600 : 400,
    color: isActive ? "#fff" : "#2d3748",
    background: isActive
      ? "linear-gradient(90deg, #0f4866 0%, #6d3aa7 100%)"
      : "transparent",
    borderLeft: isActive ? "4px solid #6d3aa7" : "4px solid transparent",
    textDecoration: "none",
    transition: "all 0.2s ease",
    cursor: "pointer",
  });

  return (
    <Flex height="100vh" overflow="hidden">
      {/* SIDEBAR */}
      <VStack
        bg="gray.100"
        w="200px"
        p={4}
        align="start"
        gap={1}
        borderRight="1px solid"
        borderColor="gray.200"
        flexShrink={0}
      >
        <Text fontWeight="bold" mb={2}>Sai Surya Construction</Text>
        <NavLink to="/dashboard" end style={navLinkStyle}>Dashboard</NavLink>
        <NavLink to="/worklist" style={navLinkStyle}>Work List</NavLink>
        <NavLink to="/resources" style={navLinkStyle}>Resources</NavLink>
      </VStack>

      {/* MAIN */}
      <Flex direction="column" flex="1" minW={0}>
        {/* TOP NAV - STICKY */}
        <HStack
          justify="space-between"
          px={6}
          minH="56px"
          borderBottom="1px solid rgba(0,0,0,0.06)"
          style={{ background: "linear-gradient(90deg, #0f4866 0%, #6d3aa7 100%)" }}
          position="sticky"
          top={0}
          zIndex={1000}
          flexShrink={0}
        >
          <Text fontWeight="600" color="white">Build Sphere</Text>

          <HStack gap={3}>
            <Text color="white">{email}</Text>
            <Avatar.Root size="sm">{initials}</Avatar.Root>
            <Button
              size="sm"
              variant="ghost"
              color="white"
              _hover={{ bg: "whiteAlpha.200" }}
              onClick={logout}
            >
              Logout
            </Button>
          </HStack>
        </HStack>

        {/* CONTENT AREA - ONLY THIS SCROLLS */}
        <Box
          flex="1"
          overflowY="auto"
          px={6}
          py={4}
          bg="gray.50"
        >
          <Outlet />
        </Box>
      </Flex>
    </Flex>

  );
};

export default DashboardLayout;
