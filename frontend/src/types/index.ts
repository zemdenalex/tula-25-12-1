// Product data
export interface ProductData {
  id?: number;
  type?: string;
  name: string;
  min_cost?: number;
  is_health?: boolean;
  is_alcohol?: boolean;
  is_smoking?: boolean;
}

// Equipment data
export interface EquipmentData {
  name?: string;
  count?: number;
  type?: number;
}

// Ads data
export interface AdsData {
  id?: number;
  type?: string;
  name: string;
  is_health?: boolean;
}

// Review with photos, likes, dislikes
export interface ReviewData {
  id?: number;
  id_user?: number;
  user_name?: string;
  id_place?: number;
  text?: string;
  review_photos: string[];
  like: number;
  dislike: number;
}

// Place with dual ratings
export interface Place {
  id?: number;
  name?: string;
  info?: string;
  coord1: number;
  coord2: number;
  type?: string;
  food_type?: string;
  is_alcohol?: boolean;
  is_health?: boolean;
  is_insurance?: boolean;
  is_nosmoking?: boolean;
  is_smoke?: boolean;
  rating?: number; // Health rating (0-100)
  review_rank?: number; // User review rating (1-5 average)
  sport_type?: string;
  distance_to_center?: number;
  is_moderated?: boolean;
  products: ProductData[];
  equipment: EquipmentData[];
  ads: AdsData[];
  reviews: ReviewData[];
}

// Place create/update data
export interface PlaceCreateData {
  name?: string;
  info?: string;
  coord1?: number;
  coord2?: number;
  type?: number;
  food_type?: number;
  is_alcohol?: boolean;
  is_health?: boolean;
  is_insurance?: boolean;
  is_nosmoking?: boolean;
  is_smoke?: boolean;
  rating?: number;
  sport_type?: number;
  products?: ProductData[];
  equipment?: EquipmentData[];
  ads?: AdsData[];
}

// User
export interface User {
  user_id: number;
  name?: string;
  email?: string;
  phone?: string;
  photo?: string;
  rating?: number;
}

// Auth
export interface UserCreateData {
  name: string;
  email: string;
  password: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}

// Review create (updated with rating and photos)
export interface UserReviewData {
  message: string;
  user_id: number;
  place_id: number;
  rating: number; // 1-5
  photos?: string[];
}

// Review rank (like/dislike)
export interface ReviewRankData {
  user_id: number;
  review_id: number;
  like?: boolean;
  dislike?: boolean;
}

// Place types
export interface PlaceTypes {
  place_type: { id: number; type: string }[];
  product_type: { id: number; type: string }[];
  ads_type: { id: number; type: string }[];
  equipment_type: { id: number; type: string }[];
  sport_type: { id: number; type: string }[];
}

// Search filters
export interface SearchFilters {
  place_type?: number;
  is_alcohol?: boolean;
  is_health?: boolean;
  is_nosmoking?: boolean;
  is_smoke?: boolean;
  max_distance?: number;
  is_moderated?: boolean;
}

// Admin types
export interface AdminCreateData {
  id_invite: number;
  name: string;
  email: string;
  password: string;
}

export interface AdminLoginData {
  email: string;
  pwd: string;
}

export interface AdminUpdateUserData {
  id_user: number;
  rating: number;
}

export interface AdminVerifyPlaceData {
  id_place: number;
  verify: boolean;
}

export interface AdminDeleteReviewData {
  id_review: number;
  rating?: number;
}

export type ViewMode = 'map' | 'list';
