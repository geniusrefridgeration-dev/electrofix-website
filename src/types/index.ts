export type Language = 'english' | 'hindi' | 'hinglish'

export interface Problem {
  _id: string
  name: string
  nameHindi?: string
  nameHinglish?: string
  price?: number | null
  isPriceFixed: boolean
  isActive: boolean
}

export interface Category {
  _id: string
  name: string
  nameHindi?: string
  nameHinglish?: string
  image?: string
  isActive: boolean
  problems: Problem[]
}

export interface Service {
  _id: string
  name: string
  nameHindi?: string
  nameHinglish?: string
  description?: string
  descriptionHindi?: string
  descriptionHinglish?: string
  image?: string
  hasCategories: boolean
  isActive: boolean
  categories: Category[]
  problems: Problem[]
}

export interface Address {
  street: string
  city: string
  state: string
  pincode: string
  fullAddress?: string
}

export interface Location {
  type: 'Point'
  coordinates: [number, number]
}

export interface Customer {
  id: string
  name: string
  mobile: string
  email?: string
  address: Address
  location?: Location
  preferredLanguage: Language
}

export interface BookingService {
  serviceId: string
  serviceName: string
  categoryId?: string | null
  categoryName?: string | null
  problemId: string
  problemName: string
  problemPrice?: number | null
  isPriceFixed: boolean
}

export interface Booking {
  _id: string
  bookingId: string
  status: 'pending' | 'accepted' | 'rejected' | 'dispatched' | 'completed' | 'cancelled'
  service: BookingService
  homeVisitCharge: number
  distanceKm: number
  rejectionReason?: string
  totalAmount?: number | null
  scheduledDate?: string | null
  adminNotes?: string | null
  cancelledBy?: 'customer' | 'admin' | null
  cancelReason?: string | null
  cancelledAt?: string | null
  rating?: number | null
  review?: string | null
  ratedAt?: string | null
  createdAt: string
  acceptedAt?: string
  dispatchedAt?: string
  completedAt?: string
  rejectedAt?: string
}

export interface HomeVisitSlab {
  minKm: number
  maxKm: number
  charge: number
  label: string
}

export interface HomeVisitConfig {
  slabs: HomeVisitSlab[]
  defaultCharge: number
}

export interface BookingFlow {
  service: Service | null
  category: Category | null
  problem: Problem | null
}
