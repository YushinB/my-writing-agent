import React from 'react';
import styled from 'styled-components';
import { useAppDispatch } from '../../store';
import { setCurrentView } from '../../store/slices/authSlice';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Header = styled.header`
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
`;

const Button = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: 500;
  transition: background-color ${({ theme }) => theme.transitions.base};
  border: none;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

const Content = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.xl};
  overflow-y: auto;
`;

const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const CardTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const CardContent = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const StatCard = styled(Card)`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  margin: ${({ theme }) => theme.spacing.md} 0;
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const AdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();

  const handleBackToEditor = () => {
    dispatch(setCurrentView('writing'));
  };

  return (
    <Container>
      <Header>
        <Title>Admin Dashboard</Title>
        <Button onClick={handleBackToEditor}>Back to Editor</Button>
      </Header>
      <Content>
        <Grid>
          <StatCard>
            <StatLabel>Total Users</StatLabel>
            <StatValue>1,234</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>Active Sessions</StatLabel>
            <StatValue>56</StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>API Calls Today</StatLabel>
            <StatValue>8,901</StatValue>
          </StatCard>
        </Grid>

        <Card>
          <CardTitle>System Status</CardTitle>
          <CardContent>
            <p>✅ All systems operational</p>
            <p>✅ AI models responding normally</p>
            <p>✅ Database connection stable</p>
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Recent Activity</CardTitle>
          <CardContent>
            <p>This section would display recent user activity, system logs, and analytics.</p>
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Configuration</CardTitle>
          <CardContent>
            <p>Admin settings and configuration options would be available here.</p>
          </CardContent>
        </Card>
      </Content>
    </Container>
  );
};

export default AdminDashboard;
