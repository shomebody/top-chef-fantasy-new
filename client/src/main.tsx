// client/src/main.tsx
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { LeagueProvider } from './context/LeagueContext';
import { BrowserRouter } from 'react-router-dom';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <BrowserRouter>
    <AuthProvider>
      <ThemeProvider>
        <SocketProvider>
          <LeagueProvider>
            <App />
          </LeagueProvider>
        </SocketProvider>
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
);