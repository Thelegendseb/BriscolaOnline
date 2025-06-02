import React from 'react';
import styled, { keyframes } from 'styled-components';

// ===== TYPE DEFINITIONS =====
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

export interface NotificationState {
  message: string;
  visible: boolean;
  timestamp: number;
  type?: NotificationType;
}

interface NotificationProps {
  notification: NotificationState;
  colors: {
    surface: string;
    text: string;
    accent: string;
    success: string;
    error: string;
    textSecondary: string;
  };
  position?: 'top' | 'bottom' | 'center';
  duration?: number;
}

// ===== COMPONENT =====
export const Notification: React.FC<NotificationProps> = ({ 
  notification, 
  colors,
  position = 'top',
  duration = 3000
}) => (
  <NotificationContainer 
    $visible={notification.visible}
    $colors={colors}
    $type={notification.type || NotificationType.INFO}
    $position={position}
    $duration={duration}
  >
    <NotificationIcon $type={notification.type || NotificationType.INFO}>
      {getNotificationIcon(notification.type || NotificationType.INFO)}
    </NotificationIcon>
    <NotificationMessage>{notification.message}</NotificationMessage>
  </NotificationContainer>
);

// ===== UTILITY FUNCTIONS =====
const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.SUCCESS:
      return '✓';
    case NotificationType.ERROR:
      return '✕';
    case NotificationType.WARNING:
      return '⚠';
    case NotificationType.INFO:
    default:
      return 'ℹ';
  }
};

const getNotificationColor = (type: NotificationType, colors: NotificationProps['colors']): string => {
  switch (type) {
    case NotificationType.SUCCESS:
      return colors.success;
    case NotificationType.ERROR:
      return colors.error;
    case NotificationType.WARNING:
      return '#FFA500'; // Orange
    case NotificationType.INFO:
    default:
      return colors.accent;
  }
};

// ===== HOOK FOR NOTIFICATION MANAGEMENT =====
export const useNotification = () => {
  const [notification, setNotification] = React.useState<NotificationState>({
    message: '',
    visible: false,
    timestamp: 0
  });

  const showNotification = React.useCallback((
    message: string, 
    type: NotificationType = NotificationType.INFO,
    duration: number = 3000
  ) => {
    setNotification({
      message,
      visible: true,
      timestamp: Date.now(),
      type
    });
    
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, duration);
  }, []);

  const hideNotification = React.useCallback(() => {
    setNotification(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    notification,
    showNotification,
    hideNotification
  };
};

// ===== ANIMATIONS =====
const fadeInOut = keyframes`
  0% { opacity: 0; transform: translateY(-20px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-20px); }
`;

const slideInFromTop = keyframes`
  0% { opacity: 0; transform: translateY(-100%); }
  100% { opacity: 1; transform: translateY(0); }
`;

const slideInFromBottom = keyframes`
  0% { opacity: 0; transform: translateY(100%); }
  100% { opacity: 1; transform: translateY(0); }
`;

// ===== STYLED COMPONENTS =====
const NotificationContainer = styled.div<{ 
  $visible: boolean;
  $colors: NotificationProps['colors'];
  $type: NotificationType;
  $position: 'top' | 'bottom' | 'center';
  $duration: number;
}>`
  display: ${props => props.$visible ? 'flex' : 'none'};
  align-items: center;
  gap: 0.75rem;
  background-color: ${props => props.$colors.surface};
  color: ${props => props.$colors.text};
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  animation: ${props => {
    if (!props.$visible) return 'none';
    if (props.$position === 'top') return slideInFromTop;
    if (props.$position === 'bottom') return slideInFromBottom;
    return fadeInOut;
  }} ${props => props.$duration}ms ease-in-out;
  z-index: 9999; /* Increased z-index to ensure it's on top */
  max-width: 400px;
  min-width: 200px;
  border: 2px solid ${props => getNotificationColor(props.$type, props.$colors)};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  position: fixed; /* Make sure it's always positioned fixed */
  
  ${props => {
    switch (props.$position) {
      case 'top':
        return `
          top: 1rem;
          left: 50%;
          transform: translateX(-50%);
        `;
      case 'bottom':
        return `
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
        `;
      case 'center':
      default:
        return `
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        `;
    }
  }}

  @media (max-width: 768px) {
    max-width: calc(100vw - 2rem);
    left: 1rem;
    right: 1rem;
    transform: none;
  }
`;

const NotificationIcon = styled.span<{ $type: NotificationType }>`
  font-size: 1.2rem;
  font-weight: bold;
  min-width: 1.2rem;
  text-align: center;
`;

const NotificationMessage = styled.span`
  flex: 1;
  font-weight: 500;
  line-height: 1.4;
`;