'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarCheck, Wrench, MapPin, Clock, CheckCircle, XCircle, Truck, ArrowRight, RefreshCw } from 'lucide-react'
import { useStore, useT } from '@/store'
import api from '@/lib/api'
import type { Booking } from '@/types'
import { format } from 'date-fns'
import clsx from 'clsx'
import Navbar from '@/components/layout/Navbar'
import Providers from '@/components/Providers'

const statusIcons = {
  pending:    { Icon: Clock,        color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
  accepted:   { Icon: CheckCircle,  color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
  rejected:   { Icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20' },
  dispatched: { Icon: Truck,        color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  completed:  { Icon: CheckCircle,  color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20' },
  cancelled:  { Icon: XCircle,      color: 'text-gray-400',   bg: 'bg-gray-50 dark:bg-gray-900/20' },
}

export default function BookingsPage() {
  const router = useRouter()
  const { customer } = useStore()
  const t = useT()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selected,     setSelected]     = useState<Booking | null>(null)
  const [cancelling,   setCancelling]   = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [ratingData,   setRatingData]   = useState<{ bookingId: string; stars: number; review: string } | null>(null)
  const [submittingRating, setSubmittingRating] = useState(false)

  useEffect(() => {
    if (!customer) { router.replace('/login'); return }
    fetchBookings()
  }, [customer])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = await api.get('/customer/bookings')
      setBookings(res.data.bookings)
    } finally { setLoading(false) }
  }

  const handleCancel = async (bookingId: string) => {
  console.log("Cancel booking:", bookingId)
}

const handleRate = async () => {
  console.log("Rate booking")
}

  const getStatusLabel = (status: Booking['status']) => {
    const labels = t('status' as any)
    if (typeof labels === 'object') return (labels as any)[status] || status
    return status
  }

  return (
    <Providers>
      <div className="min-h-screen bg-[var(--bg)] flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-display font-bold text-[var(--text)]">{t('myBookings')}</h1>
            <button onClick={fetchBookings} className="p-2 rounded-xl hover:bg-[var(--border)] text-[var(--text-muted)] transition-colors" aria-label="Refresh">
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-5 space-y-3">
                  <div className="skeleton h-4 w-32" />
                  <div className="skeleton h-3 w-48" />
                  <div className="skeleton h-3 w-24" />
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="card flex flex-col items-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center mb-4">
                <CalendarCheck size={30} className="text-primary-400" />
              </div>
              <p className="font-display font-bold text-[var(--text)] text-lg">{t('noBookings')}</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">{t('noBookingsMsg')}</p>
              <button onClick={() => router.push('/home')} className="btn-primary mt-5 px-6">
                {t('bookNowBtn')} <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking, i) => {
                const statusCfg = statusIcons[booking.status]
                const { Icon } = statusCfg
                return (
                  <button key={booking._id}
                    onClick={() => setSelected(selected?._id === booking._id ? null : booking)}
                    className="w-full card p-5 text-left hover:border-primary-200 hover:shadow-md transition-all animate-fade-up"
                    style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', statusCfg.bg)}>
                        <Icon size={18} className={statusCfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-primary-500">{booking.bookingId}</span>
                          <span className={`badge badge-${booking.status}`}>{booking.status}</span>
                        </div>
                        <p className="font-semibold text-sm text-[var(--text)] mt-1">{booking.service?.serviceName}</p>
                        <p className="text-xs text-[var(--text-muted)]">{booking.service?.problemName}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          {format(new Date(booking.createdAt), 'dd MMM yyyy, hh:mm a')}
                        </p>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {selected?._id === booking._id && (
                      <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-2 animate-fade-in">
                        {booking.service?.categoryName && (
                          <div className="flex justify-between text-xs">
                            <span className="text-[var(--text-muted)]">Category</span>
                            <span className="font-medium text-[var(--text)]">{booking.service.categoryName}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs">
                          <span className="text-[var(--text-muted)]">Repair Cost</span>
                          <span className="font-medium text-[var(--text)]">
                            {booking.service?.isPriceFixed && booking.service?.problemPrice
                              ? `₹${booking.service.problemPrice}`
                              : t('priceAfterInspection')}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[var(--text-muted)]">{t('homeVisitCharge')}</span>
                          <span className="font-medium text-[var(--text)]">₹{booking.homeVisitCharge} ({booking.distanceKm} km)</span>
                        </div>
                        {booking.rejectionReason && (
                          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 mt-2">
                            <p className="text-xs font-semibold text-red-600 dark:text-red-400">Rejection Reason</p>
                            <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">{booking.rejectionReason}</p>
                          </div>
                        )}

                        {/* Total amount */}
                        {(booking as any).totalAmount && (
                          <div className="flex justify-between text-xs font-bold border-t border-[var(--border)] pt-2 mt-1">
                            <span className="text-[var(--text)]">Total Amount</span>
                            <span className="text-primary-500">₹{(booking as any).totalAmount}</span>
                          </div>
                        )}

                        {/* Scheduled date */}
                        {(booking as any).scheduledDate && (
                          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2.5 mt-1">
                            <span className="text-blue-500 text-sm">📅</span>
                            <div>
                              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Scheduled</p>
                              <p className="text-xs text-blue-600">{new Date((booking as any).scheduledDate).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                            </div>
                          </div>
                        )}

                        {/* Cancel button */}
                        {['pending','accepted'].includes(booking.status) && (
                          <div className="pt-1" onClick={e => e.stopPropagation()}>
                            {cancelling === booking._id ? (
                              <div className="space-y-2 mt-1">
                                <input className="input text-sm w-full" placeholder="Cancellation reason..." value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
                                <div className="flex gap-2">
                                  <button onClick={() => setCancelling(null)} className="btn-outline flex-1 text-xs py-1.5">Back</button>
                                  <button onClick={() => handleCancel(booking._id)} className="flex-1 text-xs py-1.5 rounded-xl bg-red-500 text-white font-semibold">Confirm Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => { setCancelling(booking._id); setCancelReason('') }} className="text-xs text-red-500 font-semibold hover:underline mt-1">✕ Cancel Booking</button>
                            )}
                          </div>
                        )}

                        {/* Rate booking */}
                        {booking.status === 'completed' && !(booking as any).rating && (
                          <div className="pt-1" onClick={e => e.stopPropagation()}>
                            {ratingData?.bookingId === booking._id ? (
                              <div className="space-y-2 mt-1">
                                <p className="text-xs font-semibold text-[var(--text-muted)]">Rate your experience</p>
                                <div className="flex gap-1">
                                  {[1,2,3,4,5].map(s => (
                                    <button key={s} onClick={() => setRatingData(r => r ? {...r, stars: s} : { bookingId: booking._id, stars: s, review: '' })}
                                      className={`text-2xl transition-transform hover:scale-110 ${s <= (ratingData?.stars||0) ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
                                  ))}
                                </div>
                                <input className="input text-sm w-full" placeholder="Review (optional)..." value={ratingData?.review||''} onChange={e => setRatingData(r => r ? {...r, review: e.target.value} : null)} />
                                <div className="flex gap-2">
                                  <button onClick={() => setRatingData(null)} className="btn-outline flex-1 text-xs py-1.5">Cancel</button>
                                  <button onClick={handleRate} disabled={submittingRating || !ratingData?.stars} className="btn-primary flex-1 text-xs py-1.5">
                                    {submittingRating ? '...' : 'Submit ⭐'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => setRatingData({ bookingId: booking._id, stars: 0, review: '' })} className="text-xs text-yellow-500 font-semibold hover:underline mt-1">⭐ Rate this service</button>
                            )}
                          </div>
                        )}

                        {/* Show existing rating */}
                        {booking.status === 'completed' && (booking as any).rating && (
                          <div className="flex items-center gap-1 mt-1">
                            {[1,2,3,4,5].map(s => <span key={s} className={`text-sm ${s <= (booking as any).rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>)}
                            <span className="text-xs text-[var(--text-muted)] ml-1">Your rating</span>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </Providers>
  )
}
