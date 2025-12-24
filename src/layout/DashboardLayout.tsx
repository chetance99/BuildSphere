import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Flex,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Avatar,
} from "@chakra-ui/react";
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/");
      } else {
        setEmail(session.user.email ?? "");
      }
      setCheckingAuth(false);
    });
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (checkingAuth) return <Box p={6}>Loading...</Box>;

  const initials = email ? email[0].toUpperCase() : "";

  return (
    <Flex minH="100vh">
      {/* SIDEBAR */}
      <VStack
        bg="gray.100"
        w={collapsed ? "64px" : "200px"}
        p={4}
        align="start"
        transition="width 0.2s ease"
      >
        {!collapsed && (
          <Text fontWeight="bold" mb={4}>
            MyApp
          </Text>
        )}

        <VStack align="start" gap={3} w="full">
          <NavLink to="/dashboard">
            <HStack>
              <Box>🏠</Box>
              {!collapsed && <Text>Dashboard</Text>}
            </HStack>
          </NavLink>

          <NavLink to="/dashboard/work-list">
            <HStack>
              <Box>📋</Box>
              {!collapsed && <Text>Work List</Text>}
            </HStack>
          </NavLink>
        </VStack>
      </VStack>

      {/* MAIN */}
      <Box flex="1">
        {/* TOP NAV */}
        <HStack
          justify="space-between"
          p={3}
          px={6}
          minH="56px"
          borderBottom="1px solid rgba(0,0,0,0.06)"
          style={{
            background:
              "linear-gradient(90deg, #0f4866 0%, #6d3aa7 100%)",
          }}
          color="white"
        >
          <HStack>
            <Button
              size="sm"
              variant="ghost"
              color="white"
              onClick={() => setCollapsed(!collapsed)}
            >
              ☰
            </Button>
            <Text>Dashboard</Text>
          </HStack>

          <HStack>
            <Text>{email}</Text>
            <Avatar.Root size="sm">
              <Avatar.Fallback>{initials}</Avatar.Fallback>
            </Avatar.Root>
            <Button size="sm" variant="ghost" onClick={logout} color="white">
              Logout
            </Button>
          </HStack>
        </HStack>

        {/* CONTENT */}
        <Box p={6}>
          <Outlet />
        </Box>
      </Box>
    </Flex>
  );
};

export default DashboardLayout;
