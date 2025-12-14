// Sweet types for API requests/responses

export interface CreateSweetDto {
  name: string;
  category: string;
  price: number;
  quantity: number;
}

export interface UpdateSweetDto {
  name?: string;
  category?: string;
  price?: number;
  quantity?: number;
}

export interface SweetResponse {
  _id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchSweetsQuery {
  name?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface PurchaseDto {
  quantity: number;
}

export interface RestockDto {
  quantity: number;
}
