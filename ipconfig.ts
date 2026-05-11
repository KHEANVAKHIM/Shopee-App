import { Platform } from "react-native";
const SERVER_PORT = 3000;
const SERVER_IP = "192.168.1.24";
export const BASE_URL = `http://${SERVER_IP}:${SERVER_PORT}`;
export const initializeIP = async (): Promise<void> => {};
export const setServerIP = async (_ip: string): Promise<void> => {};
export const getBaseURL = (): string => BASE_URL;
