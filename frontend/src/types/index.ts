export interface User {
    id: number;
    email: string;
    name: string;
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
    assignee?: User;
    category?: Category;
    priority?: Priority;
    assignee_id?: number;
    category_id?: number;
    priority_id?: number;
    created_at?: string;
}
