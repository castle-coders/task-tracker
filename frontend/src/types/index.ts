export interface User {
    id: number;
    email: string;
    name: string;
    is_admin?: boolean;
}

export interface SystemUser {
    id: number;
    email: string;
    name: string;
    is_active: boolean;
    created_at: string;
}

export interface Category {
    id: number;
    name: string;
    color?: string; // Hex color
}

export interface Priority {
    id: number;
    name: string;
    level: number;
}

export interface Task {
    id: number;
    title: string;
    description?: string;
    due_date?: string;
    status: 'todo' | 'in_progress' | 'done';
    rank?: number;  // For drag-and-drop ordering (not displayed in UI)
    assignee?: User;
    category?: Category;
    priority?: Priority;
    assignee_id?: number;
    category_id?: number;
    priority_id?: number;
    created_at?: string;
}
