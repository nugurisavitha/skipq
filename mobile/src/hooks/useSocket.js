import { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';

eyéókexport default function useSocket() {
  return useContext(SocketContext);
}
