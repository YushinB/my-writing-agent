# Quick Reference Guide - ProsePolish Refactored

## 🚀 Common Patterns Cheat Sheet

### Redux Patterns

#### 1. Accessing State

```typescript
// Import typed hook
import { useAppSelector } from '@/store';

// Use in component
const user = useAppSelector(state => state.auth.user);
const theme = useAppSelector(state => state.settings.theme);
const inputText = useAppSelector(state => state.editor.inputText);
```

#### 2. Dispatching Actions

```typescript
// Import typed hook and actions
import { useAppDispatch } from '@/store';
import { loginSuccess, logout } from '@/store/slices/authSlice';

// Use in component
const dispatch = useAppDispatch();

// Dispatch simple action
dispatch(logout());

// Dispatch with payload
dispatch(loginSuccess({ email: 'user@example.com' }));
```

#### 3. Async Operations

```typescript
// Import async thunk
import { analyzeText } from '@/store/slices/analysisSlice';

// Dispatch async action
dispatch(analyzeText({
  text: inputText,
  model: 'gemini-2.5-flash',
  style: 'formal'
}));

// Access loading state
const { isAnalyzing, error } = useAppSelector(state => state.analysis);
```

---

### Styled-Components Patterns

#### 1. Basic Styled Component

```typescript
import styled from 'styled-components';

const Button = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }
`;
```

#### 2. Dynamic Props

```typescript
interface ButtonProps {
  $variant?: 'primary' | 'secondary';
  $fullWidth?: boolean;
}

const Button = styled.button<ButtonProps>`
  background-color: ${({ theme, $variant }) => 
    $variant === 'secondary' ? theme.colors.textSecondary : theme.colors.primary
  };
  width: ${({ $fullWidth }) => $fullWidth ? '100%' : 'auto'};
`;

// Usage
<Button $variant="secondary" $fullWidth />
```

#### 3. Extending Styles

```typescript
const Button = styled.button`
  padding: ${({ theme }) => theme.spacing.md};
`;

const PrimaryButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.primary};
`;

const SecondaryButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.textSecondary};
`;
```

#### 4. Accessing Theme in Component

```typescript
import { useTheme } from 'styled-components';

const MyComponent = () => {
  const theme = useTheme();
  
  return <div style={{ color: theme.colors.primary }}>Text</div>;
};
```

---

### Component Patterns

#### 1. Feature Component with Redux

```typescript
import React from 'react';
import styled from 'styled-components';
import { useAppSelector, useAppDispatch } from '@/store';
import { updateData } from '@/store/slices/featureSlice';

const MyFeature: React.FC = () => {
  const dispatch = useAppDispatch();
  const data = useAppSelector(state => state.feature.data);
  
  const handleUpdate = (newData: string) => {
    dispatch(updateData(newData));
  };
  
  return (
    <Container>
      <Title>My Feature</Title>
      <Content>{data}</Content>
    </Container>
  );
};

const Container = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h2`
  color: ${({ theme }) => theme.colors.text};
`;

const Content = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export default MyFeature;
```

#### 2. Form Component

```typescript
const LoginForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginSuccess({ email }));
  };
  
  return (
    <Form onSubmit={handleSubmit}>
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <Button type="submit">Sign In</Button>
    </Form>
  );
};

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Input = styled.input`
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.base};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;
```

---

### Creating New Redux Slice

#### Template

```typescript
// store/slices/newFeatureSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

interface NewFeatureState {
  data: string[];
  loading: boolean;
  error: string | null;
}

const initialState: NewFeatureState = {
  data: [],
  loading: false,
  error: null,
};

// Async thunk example
export const fetchData = createAsyncThunk(
  'newFeature/fetchData',
  async (id: string) => {
    const response = await api.getData(id);
    return response;
  }
);

const newFeatureSlice = createSlice({
  name: 'newFeature',
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<string[]>) => {
      state.data = action.payload;
    },
    clearData: (state) => {
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch data';
      });
  },
});

export const { setData, clearData } = newFeatureSlice.actions;
export default newFeatureSlice.reducer;
```

#### Adding to Store

```typescript
// store/index.ts
import newFeatureReducer from './slices/newFeatureSlice';

export const store = configureStore({
  reducer: {
    // ... other reducers
    newFeature: newFeatureReducer,
  },
});
```

---

### Theme Customization

#### 1. Adding New Color

```typescript
// styles/theme.ts
export const lightTheme: DefaultTheme = {
  // ...existing theme
  colors: {
    // ...existing colors
    success: '#10b981',
    successLight: '#d1fae5',
    danger: '#ef4444',
    dangerLight: '#fee2e2',
  },
};
```

#### 2. Using New Color

```typescript
const SuccessMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.successLight};
  color: ${({ theme }) => theme.colors.success};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.base};
`;
```

---

### Common Hooks

#### 1. useEffect with Redux

```typescript
const MyComponent = () => {
  const data = useAppSelector(state => state.feature.data);
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    // Fetch data when component mounts
    dispatch(fetchData());
  }, [dispatch]);
  
  useEffect(() => {
    // React to data changes
    console.log('Data updated:', data);
  }, [data]);
};
```

#### 2. Custom Hook with Redux

```typescript
// hooks/useAuth.ts
import { useAppSelector, useAppDispatch } from '@/store';
import { logout } from '@/store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  
  const handleLogout = () => dispatch(logout());
  
  return {
    user,
    isAuthenticated,
    logout: handleLogout,
  };
};

// Usage in component
const MyComponent = () => {
  const { user, isAuthenticated, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated && <button onClick={logout}>Logout</button>}
    </div>
  );
};
```

---

### Layout Patterns

#### 1. Flex Layout

```typescript
const FlexContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
`;

const FlexRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`;
```

#### 2. Grid Layout

```typescript
const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
`;

const GridItem = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.md};
`;
```

#### 3. Responsive Layout

```typescript
const ResponsiveContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  
  @media (min-width: 768px) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
  
  @media (min-width: 1024px) {
    padding: ${({ theme }) => theme.spacing.xl};
    max-width: 1200px;
    margin: 0 auto;
  }
`;
```

---

### Animation Patterns

#### 1. Fade In

```typescript
const FadeIn = styled.div`
  animation: fadeIn 300ms ease;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;
```

#### 2. Slide In

```typescript
const SlideIn = styled.div`
  animation: slideIn 400ms ease;
  
  @keyframes slideIn {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;
```

#### 3. Loading Spinner

```typescript
const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
```

---

### Conditional Rendering Patterns

```typescript
const MyComponent = () => {
  const { loading, error, data } = useAppSelector(state => state.feature);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }
  
  if (!data || data.length === 0) {
    return <EmptyState>No data available</EmptyState>;
  }
  
  return <DataDisplay data={data} />;
};
```

---

### Type-Safe Event Handlers

```typescript
// Form event
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // Handle form submission
};

// Input change
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

// Button click
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // Handle click
};

// Generic handler
const handleEvent = () => {
  // No event object needed
};
```

---

### Environment Variables

```typescript
// webpack.config.js already handles this
// Access in code:

const apiKey = process.env.GEMINI_API_KEY;
const isDevelopment = process.env.NODE_ENV === 'development';
```

---

### Testing Utilities

```typescript
// Testing with Redux and Theme
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { configureStore } from '@reduxjs/toolkit';
import { lightTheme } from '@/styles/theme';

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      // Add your reducers
    },
    preloadedState: initialState,
  });
};

const renderWithProviders = (
  component: React.ReactElement,
  initialState = {}
) => {
  const store = createMockStore(initialState);
  
  return render(
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        {component}
      </ThemeProvider>
    </Provider>
  );
};

// Usage
test('component renders correctly', () => {
  const { getByText } = renderWithProviders(<MyComponent />);
  expect(getByText('Hello')).toBeInTheDocument();
});
```

---

## 🔗 Quick Links

- **Main Documentation:** `ARCHITECTURE.md`
- **Migration Guide:** `MIGRATION.md`
- **Implementation Summary:** `IMPLEMENTATION_SUMMARY.md`
- **Redux Toolkit Docs:** https://redux-toolkit.js.org/
- **Styled-Components Docs:** https://styled-components.com/

---

## 💡 Pro Tips

1. **Always use typed hooks:** `useAppDispatch()` and `useAppSelector()`
2. **Prefix transient props with $:** `$variant`, `$fullWidth`
3. **Use theme values:** Never hardcode colors or spacing
4. **Keep slices focused:** One slice per feature domain
5. **Colocate styles:** Keep styled components near their usage
6. **Use async thunks:** For all API calls and async operations
7. **Test with providers:** Always wrap components in Redux and Theme providers

---

## 🚨 Common Pitfalls to Avoid

1. ❌ **Don't mutate state directly**
   ```typescript
   // Wrong
   const state = useAppSelector(state => state.feature);
   state.value = 'new';
   
   // Right
   dispatch(setValue('new'));
   ```

2. ❌ **Don't use regular props for styled-components styling**
   ```typescript
   // Wrong
   <Button variant="primary" />  // React warns about non-standard prop
   
   // Right
   <Button $variant="primary" /> // Transient prop, not passed to DOM
   ```

3. ❌ **Don't hardcode values**
   ```typescript
   // Wrong
   const Button = styled.button`
     color: #2563eb;
     padding: 16px;
   `;
   
   // Right
   const Button = styled.button`
     color: ${({ theme }) => theme.colors.primary};
     padding: ${({ theme }) => theme.spacing.md};
   `;
   ```

4. ❌ **Don't forget error handling**
   ```typescript
   // Wrong
   dispatch(fetchData());
   
   // Right
   const { error } = useAppSelector(state => state.feature);
   useEffect(() => {
     if (error) {
       showErrorNotification(error);
     }
   }, [error]);
   ```

---

This quick reference should be your go-to guide for common patterns and best practices!
