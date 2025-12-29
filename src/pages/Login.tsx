import {
  Box,
  Button,
  Heading,
  Input,
  Stack,
  Card,
} from "@chakra-ui/react";
import bgImage from "../images/background-bg.jpg";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    navigate("/dashboard");
    setLoading(false);
  };

  return (
    <Box
      minH="100vh"
      backgroundImage={`linear-gradient(90deg, rgba(15,72,102,0.45) 0%, rgba(109,58,167,0.45) 100%), url(${bgImage})`}
      backgroundSize="cover"
      backgroundPosition="center"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Card.Root
        w="400px"
        bg="whiteAlpha.900"
        backdropFilter="blur(6px)"
        boxShadow="2xl"
      >
        <Card.Body>
          <form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Heading textAlign="center">Login</Heading>

              <Input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button type="submit" loading={loading}>
                Login
              </Button>
            </Stack>
          </form>
        </Card.Body>
      </Card.Root>
    </Box>
  );
};

export default Login;
