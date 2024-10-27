import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Register from './components/Register';
import EditClient from './components/EditClient';
import DeleteClient from './components/DeleteClient';

const queryClient = new QueryClient();

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <div className="App">
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route path="/edit-client/:id" element={<EditClient />} />
            <Route path="/delete-client/:id" element={<DeleteClient />} />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </div>
  );
}

export default App;
