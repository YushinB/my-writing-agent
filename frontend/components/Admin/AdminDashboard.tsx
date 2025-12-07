import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAppDispatch } from '../../store';
import { setCurrentView } from '../../store/slices/authSlice';
import * as adminService from '../../services/admin';

type TabType = 'users' | 'system' | 'audit';

interface ModalState {
  isOpen: boolean;
  type: 'suspend' | 'enable' | 'role' | 'create' | 'delete' | null;
  userId: string | null;
  userEmail: string | null;
  currentRole?: 'user' | 'admin';
  reason?: string;
}

interface CreateUserForm {
  email: string;
  name: string;
  password: string;
  role: 'ADMIN' | 'USER';
}

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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const StatCard = styled(Card)`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  margin: ${({ theme }) => theme.spacing.sm} 0;
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 600;
`;

const TabBar = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  background-color: ${({ $active, theme }) => $active ? theme.colors.background : 'transparent'};
  border: none;
  border-bottom: 2px solid ${({ $active, theme }) => $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textSecondary};
  font-weight: ${({ $active }) => $active ? '600' : '400'};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SearchInput = styled.input`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Select = styled.select`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Table = styled.table`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
`;

const Th = styled.th`
  padding: ${({ theme }) => theme.spacing.md};
  text-align: left;
  background-color: ${({ theme }) => theme.colors.background};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Td = styled.td`
  padding: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const RoleBadge = styled.span<{ role: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${({ role }) => role === 'admin' ? '#dbeafe' : '#f3f4f6'};
  color: ${({ role }) => role === 'admin' ? '#1e40af' : '#374151'};
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${({ status }) => status === 'active' ? '#d1fae5' : '#fee2e2'};
  color: ${({ status }) => status === 'active' ? '#065f46' : '#991b1b'};
`;

const ActionButton = styled.button<{ danger?: boolean }>`
  padding: 4px 12px;
  margin-right: 8px;
  background-color: ${({ danger }) => danger ? '#fee2e2' : '#e5e7eb'};
  color: ${({ danger }) => danger ? '#991b1b' : '#374151'};
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${({ danger }) => danger ? '#fecaca' : '#d1d5db'};
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const PaginationButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;

  &:disabled {
    background-color: ${({ theme }) => theme.colors.border};
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const StatusIndicator = styled.div<{ color: string }>`
  display: inline-block;
  padding: 8px 16px;
  border-radius: 8px;
  background-color: ${({ color }) => color}22;
  color: ${({ color }) => color};
  font-weight: 600;
  margin: 8px 0;
`;

const SystemInfo = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  
  div {
    margin: 4px 0;
  }
`;

const ActionBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background-color: #e0e7ff;
  color: #3730a3;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ErrorMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background-color: #fee2e2;
  color: #991b1b;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: 500px;
  width: 90%;
`;

const ModalTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ModalBody = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ModalButton = styled.button<{ primary?: boolean; danger?: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background-color: ${({ primary, danger, theme }) => 
    danger ? '#ef4444' : 
    primary ? theme.colors.primary : 
    theme.colors.border};
  color: ${({ primary, danger }) => (primary || danger) ? 'white' : 'inherit'};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: 500;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const UserToolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const FormLabel = styled.label`
  display: block;
  font-weight: 500;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text};
`;

const AdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<adminService.UserListItem[]>([]);
  const [systemStatus, setSystemStatus] = useState<adminService.SystemStatus | null>(null);
  const [auditLogs, setAuditLogs] = useState<adminService.AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ADMIN' | 'USER' | ''>('');
  const [suspendedFilter, setSuspendedFilter] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: null,
    userId: null,
    userEmail: null,
  });

  const [createUserForm, setCreateUserForm] = useState<CreateUserForm>({
    email: '',
    name: '',
    password: '',
    role: 'USER',
  });

  useEffect(() => {
    loadData();
  }, [activeTab, searchTerm, roleFilter, suspendedFilter, currentPage]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'users') {
        const response = await adminService.getUserList({
          page: currentPage,
          limit: 10,
          search: searchTerm || undefined,
          role: roleFilter || undefined,
          suspended: suspendedFilter,
        });
        setUsers(response.users);
        setTotalPages(response.pagination.totalPages);
      } else if (activeTab === 'system') {
        const status = await adminService.getSystemStatus();
        setSystemStatus(status);
      } else if (activeTab === 'audit') {
        const response = await adminService.getAuditLogs(currentPage, 20);
        setAuditLogs(response.logs);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (err: any) {
      console.error('Admin API error:', err);
      const errorMessage = err.response?.data?.error?.message 
        || err.response?.data?.message 
        || err.message 
        || 'Failed to load data';
      const hint = err.response?.status === 404 ? ' Make sure the backend server is running at http://localhost:3000.' : '';
      setError(`${errorMessage}.${hint}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEditor = () => {
    dispatch(setCurrentView('writing'));
  };

  const openModal = (type: 'suspend' | 'enable' | 'role' | 'create' | 'delete', userId?: string, userEmail?: string, currentRole?: 'user' | 'admin') => {
    if (type === 'create') {
      setCreateUserForm({ email: '', name: '', password: '', role: 'USER' });
    }
    setModal({ isOpen: true, type, userId: userId || null, userEmail: userEmail || null, currentRole, reason: '' });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: null, userId: null, userEmail: null });
  };

  const handleUserAction = async () => {
    setLoading(true);
    setError(null);
    try {
      if (modal.type === 'create') {
        // Validate create user form
        if (!createUserForm.email || !createUserForm.name || !createUserForm.password) {
          setError('All fields are required');
          setLoading(false);
          return;
        }
        if (createUserForm.password.length < 8) {
          setError('Password must be at least 8 characters long');
          setLoading(false);
          return;
        }
        await adminService.createUser(createUserForm);
      } else if (modal.type === 'delete' && modal.userId) {
        await adminService.deleteUser(modal.userId);
      } else if (modal.type === 'suspend' && modal.userId) {
        await adminService.suspendUser(modal.userId, modal.reason);
      } else if (modal.type === 'enable' && modal.userId) {
        await adminService.enableUser(modal.userId);
      } else if (modal.type === 'role' && modal.userId && modal.currentRole) {
        const newRole = modal.currentRole === 'admin' ? 'USER' : 'ADMIN';
        await adminService.changeUserRole(modal.userId, newRole);
      }
      closeModal();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'degraded': return '#f59e0b';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <Container>
      <Header>
        <Title>Admin Dashboard</Title>
        <Button onClick={handleBackToEditor}>Back to Editor</Button>
      </Header>

      <TabBar>
        <Tab $active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setCurrentPage(1); }}>
          Users
        </Tab>
        <Tab $active={activeTab === 'system'} onClick={() => setActiveTab('system')}>
          System Status
        </Tab>
        <Tab $active={activeTab === 'audit'} onClick={() => { setActiveTab('audit'); setCurrentPage(1); }}>
          Audit Logs
        </Tab>
      </TabBar>

      <Content>
        {error && <ErrorMessage>{error}</ErrorMessage>}

        {activeTab === 'users' && (
          <>
            <UserToolbar>
              <Button onClick={() => openModal('create')}>Add User</Button>
            </UserToolbar>
            <FilterBar>
              <SearchInput
                type="text"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
              <Select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value as any); setCurrentPage(1); }}>
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="USER">User</option>
              </Select>
              <Select value={suspendedFilter === undefined ? '' : String(suspendedFilter)} onChange={(e) => { 
                setSuspendedFilter(e.target.value === '' ? undefined : e.target.value === 'true');
                setCurrentPage(1);
              }}>
                <option value="">All Status</option>
                <option value="false">Active</option>
                <option value="true">Suspended</option>
              </Select>
            </FilterBar>

            {loading ? (
              <LoadingMessage>Loading...</LoadingMessage>
            ) : (
              <>
                <Table>
                  <thead>
                    <tr>
                      <Th>Email</Th>
                      <Th>Name</Th>
                      <Th>Role</Th>
                      <Th>Status</Th>
                      <Th>Created</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <Td>{user.email}</Td>
                        <Td>{user.name || '-'}</Td>
                        <Td>
                          <RoleBadge role={user.role}>{user.role}</RoleBadge>
                        </Td>
                        <Td>
                          {user.suspended ? (
                            <StatusBadge status="suspended">Suspended</StatusBadge>
                          ) : (
                            <StatusBadge status="active">Active</StatusBadge>
                          )}
                        </Td>
                        <Td>{formatDate(user.createdAt)}</Td>
                        <Td>
                          <ActionButton
                            onClick={() => openModal('role', user.id, user.email, user.role)}
                          >
                            {user.role === 'admin' ? 'Demote' : 'Promote'}
                          </ActionButton>
                          {user.suspended ? (
                            <ActionButton
                              onClick={() => openModal('enable', user.id, user.email)}
                            >
                              Enable
                            </ActionButton>
                          ) : (
                            <ActionButton
                              danger
                              onClick={() => openModal('suspend', user.id, user.email)}
                            >
                              Suspend
                            </ActionButton>
                          )}
                          <ActionButton
                            danger
                            onClick={() => openModal('delete', user.id, user.email)}
                          >
                            Delete
                          </ActionButton>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <Pagination>
                  <PaginationButton
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </PaginationButton>
                  <PageInfo>Page {currentPage} of {totalPages}</PageInfo>
                  <PaginationButton
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </PaginationButton>
                </Pagination>
              </>
            )}
          </>
        )}

        {activeTab === 'system' && systemStatus && !loading && (
          <>
            <Card>
              <CardTitle>Overall Status</CardTitle>
              <StatusIndicator color={getStatusColor(systemStatus.status)}>
                {systemStatus.status.toUpperCase()}
              </StatusIndicator>
              <SystemInfo>
                <div><strong>Version:</strong> {systemStatus.version}</div>
                <div><strong>Uptime:</strong> {Math.floor(systemStatus.uptime / 3600)}h {Math.floor((systemStatus.uptime % 3600) / 60)}m</div>
              </SystemInfo>
            </Card>

            <Grid>
              <StatCard>
                <StatLabel>Database</StatLabel>
                <StatusIndicator color={systemStatus.database.connected ? '#10b981' : '#ef4444'}>
                  {systemStatus.database.connected ? 'Connected' : 'Disconnected'}
                </StatusIndicator>
                {systemStatus.database.responseTime && (
                  <div style={{ marginTop: '8px', fontSize: '14px' }}>
                    Response: {systemStatus.database.responseTime}ms
                  </div>
                )}
              </StatCard>

              <StatCard>
                <StatLabel>Redis</StatLabel>
                <StatusIndicator color={systemStatus.redis.connected ? '#10b981' : '#ef4444'}>
                  {systemStatus.redis.connected ? 'Connected' : 'Disconnected'}
                </StatusIndicator>
                {systemStatus.redis.responseTime && (
                  <div style={{ marginTop: '8px', fontSize: '14px' }}>
                    Response: {systemStatus.redis.responseTime}ms
                  </div>
                )}
              </StatCard>
            </Grid>

            <Grid>
              <StatCard>
                <StatLabel>Total Users</StatLabel>
                <StatValue>{systemStatus.stats.totalUsers}</StatValue>
              </StatCard>
              <StatCard>
                <StatLabel>Active Users (30d)</StatLabel>
                <StatValue>{systemStatus.stats.activeUsers}</StatValue>
              </StatCard>
              <StatCard>
                <StatLabel>Suspended Users</StatLabel>
                <StatValue>{systemStatus.stats.suspendedUsers}</StatValue>
              </StatCard>
              <StatCard>
                <StatLabel>Total API Calls</StatLabel>
                <StatValue>{systemStatus.stats.totalApiCalls}</StatValue>
              </StatCard>
            </Grid>
          </>
        )}

        {activeTab === 'audit' && (
          <>
            {loading ? (
              <LoadingMessage>Loading...</LoadingMessage>
            ) : (
              <>
                <Table>
                  <thead>
                    <tr>
                      <Th>Time</Th>
                      <Th>Actor</Th>
                      <Th>Action</Th>
                      <Th>Target</Th>
                      <Th>Details</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <Td>{formatDate(log.createdAt)}</Td>
                        <Td>{log.actorEmail}</Td>
                        <Td><ActionBadge>{log.action}</ActionBadge></Td>
                        <Td>{log.targetEmail || '-'}</Td>
                        <Td>
                          {log.details ? JSON.stringify(log.details) : '-'}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <Pagination>
                  <PaginationButton
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </PaginationButton>
                  <PageInfo>Page {currentPage} of {totalPages}</PageInfo>
                  <PaginationButton
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </PaginationButton>
                </Pagination>
              </>
            )}
          </>
        )}
      </Content>

      {modal.isOpen && (
        <Modal>
          <ModalContent>
            <ModalTitle>
              {modal.type === 'suspend' && 'Suspend User'}
              {modal.type === 'enable' && 'Enable User'}
              {modal.type === 'role' && 'Change User Role'}
              {modal.type === 'create' && 'Create New User'}
              {modal.type === 'delete' && 'Delete User'}
            </ModalTitle>
            <ModalBody>
              {modal.type === 'create' ? (
                <>
                  <FormGroup>
                    <FormLabel>Email *</FormLabel>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      value={createUserForm.email}
                      onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                    />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>Name *</FormLabel>
                    <Input
                      type="text"
                      placeholder="Full Name"
                      value={createUserForm.name}
                      onChange={(e) => setCreateUserForm({ ...createUserForm, name: e.target.value })}
                    />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>Password * (min 8 characters)</FormLabel>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={createUserForm.password}
                      onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                    />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>Role *</FormLabel>
                    <Select 
                      value={createUserForm.role}
                      onChange={(e) => setCreateUserForm({ ...createUserForm, role: e.target.value as 'ADMIN' | 'USER' })}
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </Select>
                  </FormGroup>
                </>
              ) : modal.type === 'delete' ? (
                <>
                  <p>User: <strong>{modal.userEmail}</strong></p>
                  <p style={{ color: '#ef4444' }}>⚠️ Are you sure you want to delete this user? This action cannot be undone.</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>All associated data (saved words, settings, etc.) will be permanently deleted.</p>
                </>
              ) : (
                <>
                  <p>User: <strong>{modal.userEmail}</strong></p>
                  {modal.type === 'suspend' && (
                    <>
                      <p>Are you sure you want to suspend this user?</p>
                      <Input
                        type="text"
                        placeholder="Reason (optional)"
                        value={modal.reason || ''}
                        onChange={(e) => setModal({ ...modal, reason: e.target.value })}
                      />
                    </>
                  )}
                  {modal.type === 'enable' && (
                    <p>Are you sure you want to enable this user?</p>
                  )}
                  {modal.type === 'role' && (
                    <p>Change role from <strong>{modal.currentRole}</strong> to <strong>{modal.currentRole === 'admin' ? 'user' : 'admin'}</strong>?</p>
                  )}
                </>
              )}
            </ModalBody>
            <ModalActions>
              <ModalButton onClick={closeModal}>Cancel</ModalButton>
              <ModalButton 
                primary={modal.type !== 'delete'} 
                danger={modal.type === 'delete'}
                onClick={handleUserAction} 
                disabled={loading}
              >
                {loading ? 'Processing...' : (modal.type === 'create' ? 'Create User' : 'Confirm')}
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default AdminDashboard;
