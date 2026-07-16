// src/services/productService.ts
import API from './api';
import { Product, ProjectKit, KitItem, ChatMessage } from '../types';
import { Project } from '../components/ProjectIdeas';

// Define the paginated response structure
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const productService = {
  getAll: async (params: { 
    page?: number, 
    search?: string,
    pageSize?: number,
    budget?: number, 
    categories?: string[], 
    sort?: string 
  } = {}): Promise<PaginatedResponse<Product>> => {
    
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('page_size', params.pageSize.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.budget) queryParams.append('budget', params.budget.toString());
    if (params.categories && params.categories.length > 0) {
      queryParams.append('categories', params.categories.join(','));
    }
    if (params.sort) queryParams.append('sort', params.sort);
    
    const queryString = queryParams.toString();
    const endpoint = `/products/${queryString ? `?${queryString}` : ''}`;
    
    // Auth headers are now automatically injected by the API interceptor
    const response = await API.get<PaginatedResponse<Product>>(endpoint);
    return response.data; 
  }
};

export const projectIdeaService = {
  getAll: async (): Promise<Project[]> => {
    const response = await API.get<Project[]>('/ideas/');
    return response.data;
  },
  
  create: async (data: Partial<Project>): Promise<Project> => {
    const response = await API.post<Project>('/ideas/', data);
    return response.data;
  }
};

export const kitService = {
  getAll: async (): Promise<ProjectKit[]> => {
    const response = await API.get<ProjectKit[]>('/kits/');
    return response.data;
  },
  
  create: async (data: Partial<ProjectKit>): Promise<ProjectKit> => {
    const response = await API.post<ProjectKit>('/kits/', data);
    return response.data;
  },

  addItem: async (kitId: string, productId: string, quantity: number = 1): Promise<any> => {
    const response = await API.post(`/kits/${kitId}/add_item/`, { product_id: productId, quantity });
    return response.data;
  }
};

export const chatService = {
  // Fetch all past chat sessions for the sidebar
  getSessions: async (): Promise<any> => {
    const response = await API.get(`/chat/`);
    return response.data;
  },

  getHistory: async (sessionId: string): Promise<any> => {
    const response = await API.get(`/chat/?session_id=${sessionId}`);
    return response.data;
  },

  sendMessage: async (message: string, history: ChatMessage[] = [], aiConfig?: any, sessionId?: string | null): Promise<any> => {
    const response = await API.post('/chat/', { 
        message: message,
        history: history,
        ai_config: aiConfig,
        session_id: sessionId
    });
    return response.data;
  }
};