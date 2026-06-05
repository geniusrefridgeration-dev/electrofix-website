'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, X, Crosshair, Search, Loader } from 'lucide-react'

export interface AddressComponents {
  street:      string
  city:        string
  state:       string
  pincode:     string
  fullAddress: string
}

interface Props {
  onSelect:           (lat: number, lng: number, address?: AddressComponents) => void
  onDeselect?:        () => void
  initialLat?:        number
  initialLng?:        number
  syncAddressFields?: { street: string; city: string; state: string; pincode: string }
}

// ── Globals (avoid TS errors — Google Maps loaded via <script>) ──────────────
declare global {
  interface Window {
    google: any
    [key: string]: any
  }
}

// ── Load Google Maps JS API once ─────────────────────────────────────────────
let _gmPromise: Promise<void> | null = null
function loadGoogleMaps(apiKey: string): Promise<void> {
  if (_gmPromise) return _gmPromise
  if (typeof window !== 'undefined' && window.google?.maps?.places) {
    return (_gmPromise = Promise.resolve())
  }
  _gmPromise = new Promise((resolve, reject) => {
    const cbName = `__gm_cb_${Date.now()}`
    window[cbName] = () => { resolve(); delete window[cbName] }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${cbName}&language=en&region=IN`
    script.async = true
    script.defer = true
    script.onerror = () => { _gmPromise = null; reject() }
    document.head.appendChild(script)
  })
  return _gmPromise
}

// ── Parse geocoder result → structured address ───────────────────────────────
function parseResult(result: any): AddressComponents {
  const get = (type: string): string =>
    result.address_components?.find((c: any) => c.types?.includes(type))?.long_name || ''
  return {
    street:      [get('street_number'), get('route'), get('sublocality_level_2'), get('sublocality_level_1')].filter(Boolean).join(', ') || get('neighborhood'),
    city:        get('locality') || get('administrative_area_level_3') || get('administrative_area_level_2'),
    state:       get('administrative_area_level_1'),
    pincode:     get('postal_code'),
    fullAddress: result.formatted_address || '',
  }
}

// ── Custom marker SVG ─────────────────────────────────────────────────────────
const PIN_SVG = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
    <defs><filter id="ds"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,.28)"/></filter></defs>
    <path d="M18 0C8.059 0 0 8.059 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.059 27.941 0 18 0z" fill="#E53935" filter="url(#ds)"/>
    <circle cx="18" cy="18" r="9" fill="white" opacity=".92"/>
    <circle cx="18" cy="18" r="5" fill="#E53935"/>
  </svg>`
)}`

export default function LocationPicker({
  onSelect, onDeselect,
  initialLat = 23.2599, initialLng = 77.4126,
  syncAddressFields,
}: Props) {
  const mapDivRef   = useRef<HTMLDivElement>(null)
  const searchRef   = useRef<HTMLInputElement>(null)
  const mapRef      = useRef<any>(null)
  const markerRef   = useRef<any>(null)
  const geocoderRef = useRef<any>(null)
  const mountedRef  = useRef(false)
  const syncTimer   = useRef<ReturnType<typeof setTimeout>>()

  const [placed,   setPlaced]   = useState(false)
  const [address,  setAddress]  = useState('')
  const [locating, setLocating] = useState(false)
  const [syncing,  setSyncing]  = useState(false)
  const [noKey,    setNoKey]    = useState(false)
  const [loadErr,  setLoadErr]  = useState(false)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  // ── Reverse geocode ───────────────────────────────────────────────────────
  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!geocoderRef.current) return
    geocoderRef.current.geocode({ location: { lat, lng } }, (results: any, status: string) => {
      if (status === 'OK' && results?.[0]) {
        const addr = parseResult(results[0])
        setAddress(addr.fullAddress)
        if (searchRef.current) searchRef.current.value = addr.fullAddress
        onSelect(lat, lng, addr)
      } else {
        const fb = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        setAddress(fb)
        onSelect(lat, lng)
      }
    })
  }, [onSelect])

  // ── Create / move marker ──────────────────────────────────────────────────
  const placeMarkerAt = useCallback((lat: number, lng: number, pan = true) => {
    if (!mapRef.current) return
    const g = window.google
    const pos = { lat, lng }

    if (markerRef.current) {
      markerRef.current.setPosition(pos)
    } else {
      const marker = new g.maps.Marker({
        position: pos,
        map: mapRef.current,
        draggable: true,
        animation: g.maps.Animation.DROP,
        icon: {
          url: PIN_SVG,
          scaledSize: new g.maps.Size(36, 44),
          anchor:     new g.maps.Point(18, 44),
        },
      })
      marker.addListener('dragend', () => {
        const p = marker.getPosition()
        reverseGeocode(p.lat(), p.lng())
      })
      markerRef.current = marker
    }

    if (pan) {
      mapRef.current.panTo(pos)
      if (mapRef.current.getZoom() < 15) mapRef.current.setZoom(16)
    }
    setPlaced(true)
    reverseGeocode(lat, lng)
  }, [reverseGeocode])

  // ── Init Google Map ───────────────────────────────────────────────────────
  useEffect(() => {
    if (mountedRef.current) return
    if (!apiKey) { setNoKey(true); return }
    mountedRef.current = true
    let dead = false

    loadGoogleMaps(apiKey)
      .then(() => {
        if (dead || !mapDivRef.current) return
        const g = window.google

        const map = new g.maps.Map(mapDivRef.current, {
          center: { lat: initialLat, lng: initialLng },
          zoom:   13,
          mapTypeControl:    false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControlOptions: { position: g.maps.ControlPosition.RIGHT_BOTTOM },
          styles: [
            { featureType: 'poi',     elementType: 'labels', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          ],
        })
        mapRef.current      = map
        geocoderRef.current = new g.maps.Geocoder()

        // Click on map → place marker
        map.addListener('click', (e: any) => {
          if (e.latLng) placeMarkerAt(e.latLng.lat(), e.latLng.lng())
        })

        // Places Autocomplete on search input
        if (searchRef.current) {
          const ac = new g.maps.places.Autocomplete(searchRef.current, {
            componentRestrictions: { country: 'IN' },
            fields: ['geometry', 'formatted_address', 'address_components'],
          })
          ac.addListener('place_changed', () => {
            const place = ac.getPlace()
            if (!place?.geometry?.location) return
            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()

            // Always pan + zoom to result
            map.panTo({ lat, lng })
            map.setZoom(17)

            // Move or create marker
            if (markerRef.current) {
              markerRef.current.setPosition({ lat, lng })
            } else {
              const m = new g.maps.Marker({
                position: { lat, lng }, map,
                draggable: true,
                animation: g.maps.Animation.DROP,
                icon: { url: PIN_SVG, scaledSize: new g.maps.Size(36, 44), anchor: new g.maps.Point(18, 44) },
              })
              m.addListener('dragend', () => { const p = m.getPosition(); reverseGeocode(p.lat(), p.lng()) })
              markerRef.current = m
            }
            setPlaced(true)

            // Fill address from place data or reverse geocode
            if (place.formatted_address && place.address_components) {
              const addr = parseResult(place)
              setAddress(addr.fullAddress)
              if (searchRef.current) searchRef.current.value = addr.fullAddress
              onSelect(lat, lng, addr)
            } else {
              reverseGeocode(lat, lng)
            }
          })
        }
      })
      .catch(() => { if (!dead) setLoadErr(true) })

    return () => { dead = true; mountedRef.current = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey])

  // ── Sync: address fields typed → move map (debounced) ────────────────────
  useEffect(() => {
    if (!syncAddressFields || !geocoderRef.current) return
    const { street, city, state, pincode } = syncAddressFields
    const parts = [street, city, state, pincode].filter(s => s && s.trim().length > 1)
    if (parts.length < 2) return

    clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => {
      setSyncing(true)
      geocoderRef.current.geocode(
        { address: parts.join(', ') + ', India' },
        (results: any, status: string) => {
          setSyncing(false)
          if (status === 'OK' && results?.[0]?.geometry?.location) {
            const lat = results[0].geometry.location.lat()
            const lng = results[0].geometry.location.lng()
            mapRef.current?.setCenter({ lat, lng })
            mapRef.current?.setZoom(17)
            if (markerRef.current) {
              markerRef.current.setPosition({ lat, lng })
            } else if (mapRef.current) {
              // Create marker silently (no reverse geocode — user typed address)
              const g = window.google
              const m = new g.maps.Marker({
                position: { lat, lng }, map: mapRef.current, draggable: true,
                icon: { url: PIN_SVG, scaledSize: new g.maps.Size(36, 44), anchor: new g.maps.Point(18, 44) },
              })
              m.addListener('dragend', () => { const p = m.getPosition(); reverseGeocode(p.lat(), p.lng()) })
              markerRef.current = m
            }
            setPlaced(true)
            onSelect(lat, lng)
          }
        }
      )
    }, 900)

    return () => clearTimeout(syncTimer.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    syncAddressFields?.street,
    syncAddressFields?.city,
    syncAddressFields?.state,
    syncAddressFields?.pincode,
  ])

  const handleLocateMe = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setLocating(false); placeMarkerAt(coords.latitude, coords.longitude) },
      ()            => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleDeselect = () => {
    markerRef.current?.setMap(null)
    markerRef.current = null
    if (searchRef.current) searchRef.current.value = ''
    setPlaced(false)
    setAddress('')
    onDeselect?.()
  }

  // ── Error / missing key ───────────────────────────────────────────────────
  if (noKey || loadErr) return (
    <div className="w-full flex flex-col items-center justify-center bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-6 text-center" style={{ minHeight: '260px' }}>
      <MapPin size={28} className="text-amber-500 mb-2" />
      <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
        {noKey ? 'Google Maps API Key Missing' : 'Map failed to load'}
      </p>
      {noKey && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
          Add <code className="bg-amber-100 dark:bg-amber-800/40 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to .env.local
        </p>
      )}
      {loadErr && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
          Check API key, billing enabled, and Maps JS API + Places API + Geocoding API enabled in Google Cloud Console
        </p>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-2 w-full">

      {/* Search — Google Places Autocomplete */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] z-10 pointer-events-none" />
        {syncing && <Loader size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 animate-spin z-10" />}
        <input
          ref={searchRef}
          type="text"
          placeholder="Search location (e.g. Vijay Nagar, Indore)..."
          autoComplete="off"
          className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-primary-400 transition-all"
        />
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-[var(--border)]" style={{ height: '250px' }}>
        <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

        {/* My Location */}
        <button type="button" onClick={handleLocateMe} disabled={locating}
          className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-md px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
        >
          {locating
            ? <span className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            : <Crosshair size={12} className="text-primary-500" />}
          {locating ? 'Locating...' : 'My Location'}
        </button>

        {!placed && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 bg-black/65 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
            📍 Click on map or search above
          </div>
        )}
      </div>

      {/* Address confirmation */}
      {placed && address && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-3 py-2">
          <MapPin size={13} className="text-green-500 flex-shrink-0" />
          <p className="text-xs text-green-700 dark:text-green-300 flex-1 truncate min-w-0">{address}</p>
          <button type="button" onClick={handleDeselect}
            className="w-5 h-5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 flex items-center justify-center transition-colors flex-shrink-0">
            <X size={11} />
          </button>
        </div>
      )}
    </div>
  )
}
