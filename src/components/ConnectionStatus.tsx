/**
 * ConnectionStatus Component - WebSocket connection indicator
 * @version 1.0.0
 */

import { memo } from 'react';
import { ConnectionStatus as ConnectionStatusType } from '../types';
import { NEON_COLORS } from '../utils/constants';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
}

/**
 * ConnectionStatus component
 * Displays the current connection status with appropriate colors
 */
function ConnectionStatusComponent({ status }: ConnectionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'CONNECTED':
        return {
          color: NEON_COLORS.GREEN,
          text: 'Connected',
          pulse: false,
        };
      case 'CONNECTING':
        return {
          color: NEON_COLORS.YELLOW,
          text: 'Connecting...',
          pulse: true,
        };
      case 'RECONNECTING':
        return {
          color: NEON_COLORS.ORANGE,
          text: 'Reconnecting...',
          pulse: true,
        };
      case 'DISCONNECTED':
      default:
        return {
          color: '#ff3333',
          text: 'Disconnected',
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="connection-status flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-secondary)]">
      {/* Status indicator dot */}
      <div
        className={`w-2 h-2 rounded-full ${config.pulse ? 'animate-pulse' : ''}`}
        style={{
          backgroundColor: config.color,
          boxShadow: `0 0 10px ${config.color}`,
        }}
      />

      {/* Status text */}
      <span
        className="text-xs font-medium"
        style={{ color: config.color }}
      >
        {config.text}
      </span>
    </div>
  );
}

export const ConnectionStatus = memo(ConnectionStatusComponent);
