import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import allReducer from './reducer/index';
import './index.css';

const store = createStore(
  allReducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && (window.__REDUX_DEVTOOLS_EXTENSION__() as never)
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const container = document.getElementById('root');
if (!container) throw new Error('#root not found');

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <App />
      </Provider>
    </QueryClientProvider>
  </StrictMode>
);
