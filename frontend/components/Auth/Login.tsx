import React, { useState } from 'react';
import styled from 'styled-components';
import { Mail, Lock, PenLine, ArrowRight, User as UserIcon, ShieldCheck } from 'lucide-react';
import { useAppDispatch } from '../../store';
import { loginSuccess } from '../../store/slices/authSlice';

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      if (email && password) {
        dispatch(loginSuccess({ email }));
      } else {
        setError('Please enter a valid email and password');
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleAutoLogin = (role: 'user' | 'admin') => {
    const dummyEmail = role === 'admin' ? 'admin@prosepolish.com' : 'writer@prosepolish.com';
    setEmail(dummyEmail);
    setPassword('password123');
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      dispatch(loginSuccess({ email: dummyEmail }));
    }, 800);
  };

  return (
    <Container>
      <LoginBox>
        <Header>
          <IconWrapper>
            <PenLine size={32} />
          </IconWrapper>
          <Title>ProsePolish</Title>
          <Subtitle>Sign in to continue your writing journey</Subtitle>
        </Header>

        <FormCard>
          <QuickLoginSection>
            <QuickLoginLabel>Test Accounts</QuickLoginLabel>
            <QuickLoginGrid>
              <QuickLoginButton
                type="button"
                onClick={() => handleAutoLogin('user')}
                disabled={isLoading}
              >
                <QuickLoginIcon $color="#3b82f6">
                  <UserIcon size={20} />
                </QuickLoginIcon>
                <QuickLoginText>Writer Demo</QuickLoginText>
              </QuickLoginButton>

              <QuickLoginButton
                type="button"
                onClick={() => handleAutoLogin('admin')}
                disabled={isLoading}
              >
                <QuickLoginIcon $color="#a855f7">
                  <ShieldCheck size={20} />
                </QuickLoginIcon>
                <QuickLoginText>Admin Demo</QuickLoginText>
              </QuickLoginButton>
            </QuickLoginGrid>
          </QuickLoginSection>

          <Divider>
            <DividerLine />
            <DividerText>Or sign in with email</DividerText>
            <DividerLine />
          </Divider>

          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Email Address</Label>
              <InputWrapper>
                <InputIcon>
                  <Mail size={18} />
                </InputIcon>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </InputWrapper>
            </FormGroup>

            <FormGroup>
              <Label>Password</Label>
              <InputWrapper>
                <InputIcon>
                  <Lock size={18} />
                </InputIcon>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </InputWrapper>
            </FormGroup>

            {error && <ErrorMessage>{error}</ErrorMessage>}

            <SubmitButton type="submit" disabled={isLoading}>
              {isLoading ? (
                <Spinner />
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </SubmitButton>
          </Form>
        </FormCard>
      </LoginBox>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.md};
`;

const LoginBox = styled.div`
  width: 100%;
  max-width: 28rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const IconWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-family: ${({ theme }) => theme.fonts.serif};
  font-weight: bold;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const FormCard = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing['2xl']};
`;

const QuickLoginSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const QuickLoginLabel = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  text-align: center;
`;

const QuickLoginGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};
`;

const QuickLoginButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surface};
  transition: all ${({ theme }) => theme.transitions.base};
  gap: ${({ theme }) => theme.spacing.sm};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.surfaceHover};
    border-color: ${({ theme }) => theme.colors.borderHover};
    transform: scale(1.02);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const QuickLoginIcon = styled.div<{ $color: string }>`
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ $color }) => $color}20;
  color: ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  transition: transform ${({ theme }) => theme.transitions.base};

  ${QuickLoginButton}:hover & {
    transform: scale(1.1);
  }
`;

const QuickLoginText = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Divider = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin: ${({ theme }) => theme.spacing.lg} 0;
`;

const DividerLine = styled.div`
  flex: 1;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.border};
`;

const DividerText = styled.span`
  padding: 0 ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  background-color: ${({ theme }) => theme.colors.surface};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const InputWrapper = styled.div`
  position: relative;
`;

const InputIcon = styled.div`
  position: absolute;
  left: ${({ theme }) => theme.spacing.sm};
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textTertiary};
  pointer-events: none;
`;

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  padding-left: 2.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.surfaceHover};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.base};
  transition: all ${({ theme }) => theme.transitions.base};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textTertiary};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primaryLight}40;
  }
`;

const ErrorMessage = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.error};
  background-color: ${({ theme }) => theme.colors.errorLight};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
`;

const SubmitButton = styled.button`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  font-weight: 600;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  transition: all ${({ theme }) => theme.transitions.base};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primaryHover};
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.xl};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Spinner = styled.div`
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
`;

export default Login;
