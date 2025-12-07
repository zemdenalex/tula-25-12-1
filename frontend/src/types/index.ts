export interface ProductData {
  id?: number;
  type?: string;
  name: string;
  min_cost?: number;
  is_health?: boolean;
  is_alcohol?: boolean;
  is_smoking?: boolean;
}

export interface EquipmentData {
  name?: string;
  count?: number;
  type?: number;
}

export interface AdsData {
  id?: number;
  type?: string;
  name: string;
  is_health?: boolean;
}

export interface ReviewData {
  id?: number;
  id_user?: number;
  user_name?: string;
  id_place?: number;
  text?: string;
  rating?: number;
  review_photos: string[];
  like: number;
  dislike: number;
}

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
  rating?: number;
  review_rank?: number;
  sport_type?: string;
  distance_to_center?: number;
  is_moderated?: boolean;
  products: ProductData[];
  equipment: EquipmentData[];
  ads: AdsData[];
  reviews: ReviewData[];
}

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

export interface User {
  user_id: number;
  name?: string;
  email?: string;
  phone?: string;
  photo?: string;
  rating?: number;
}

export interface UserCreateData {
  name: string;
  email: string;
  password: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface UserReviewData {
  message: string;
  user_id: number;
  place_id: number;
  rating: number;
  photos?: string[];
}

export interface ReviewRankData {
  user_id: number;
  review_id: number;
  like?: boolean;
  dislike?: boolean;
}

export interface PlaceTypes {
  place_type: { id: number; type: string }[];
  product_type: { id: number; type: string }[];
  ads_type: { id: number; type: string }[];
  equipment_type: { id: number; type: string }[];
  sport_type: { id: number; type: string }[];
}

export interface SearchFilters {
  place_type?: number;
  is_alcohol?: boolean;
  is_health?: boolean;
  is_nosmoking?: boolean;
  is_smoke?: boolean;
  max_distance?: number;
  is_moderated?: boolean;
}

export interface UserPreferences {
  placeTypes: number[];
  characteristics: {
    is_health?: boolean;
    is_nosmoking?: boolean;
    is_alcohol?: boolean;
    is_smoke?: boolean;
  };
  maxDistance: number;
}

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
export type AppPage = 'home' | 'map' | 'leaderboard' | 'community' | 'profile' | 'chat' | 'user-profile';
