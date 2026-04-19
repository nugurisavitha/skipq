import { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';

eyéókexport default function useNotifications() {
  return useContext(NotificationContext);
}
