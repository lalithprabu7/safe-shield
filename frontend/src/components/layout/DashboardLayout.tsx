import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useToast } from '../common/Toast';

export default function DashboardLayout() {
  const { showToast } = useToast();

  useEffect(() => {
    const socket = io('http://localhost:3001');

    socket.on('connect', () => {
      console.log('Connected to DigitalShield AI Real-Time Gateway');
    });

    socket.on('voip_alert', (data) => {
      showToast('warning', 'Live Call Intercepted', data.message);
    });

    socket.on('sim_blocked', (data) => {
      showToast('success', 'SIM Auto-Blocked', `Phone ${data.phone} blocked. Reason: ${data.reason}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [showToast]);

  return (
    <div className="flex h-screen overflow-hidden bg-navy-900">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-64 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-6 max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
