import api from './client';
import type { SystemUser } from '../types';

export interface CreateSystemUserRequest {
    email: string;
    name: string;
}

export interface CreateSystemUserResponse {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    api_key: string;
    message: string;
}

export interface ResetApiKeyResponse {
    api_key: string;
    message: string;
}

export const getSystemUsers = async (): Promise<SystemUser[]> => {
    const { data } = await api.get('/users/system');
    return data;
};

export const createSystemUser = async (
    userData: CreateSystemUserRequest
): Promise<CreateSystemUserResponse> => {
    const { data } = await api.post('/users/system', userData);
    return data;
};

export const resetUserApiKey = async (userId: number): Promise<ResetApiKeyResponse> => {
    const { data } = await api.post(`/users/system/${userId}/reset-key`);
    return data;
};

export const enableUser = async (userId: number): Promise<void> => {
    await api.post(`/users/system/${userId}/enable`);
};

export const disableUser = async (userId: number): Promise<void> => {
    await api.post(`/users/system/${userId}/disable`);
};

export const deleteUser = async (userId: number): Promise<void> => {
    await api.delete(`/users/system/${userId}`);
};
