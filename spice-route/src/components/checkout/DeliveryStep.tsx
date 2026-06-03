'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { MapPin, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ShippingOptions } from '@/components/checkout/ShippingOptions'

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(8, 'Valid phone required'),
  streetLine1: z.string().min(3, 'Required'),
  streetLine2: z.string().optional(),
  city: z.string().min(1, 'Required'),
  postalCode: z.string().min(3, 'Required'),
  countryCode: z.string().min(2).max(2),
  deliveryType: z.enum(['home_delivery', 'click_and_collect']),
  slotId: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const COUNTRIES = [
  { code: 'NL', name: 'Netherlands' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgium' },
]

interface Slot {
  id: string
  label: string
  date: string
  isExpress: boolean
}

const DEMO_SLOTS: Slot[] = [
  { id: 'slot-1', label: 'Morning (8:00 – 10:00)', date: 'Tomorrow', isExpress: false },
  { id: 'slot-2', label: 'Afternoon (12:00 – 14:00)', date: 'Tomorrow', isExpress: false },
  { id: 'slot-3', label: 'Evening (18:00 – 20:00)', date: 'Tomorrow', isExpress: false },
  { id: 'slot-4', label: 'Express (Same Day by 16:00)', date: 'Today', isExpress: true },
]

interface Props {
  user: any
  onComplete: (data: FormData & { isExpress: boolean; slotLabel?: string }) => void
}

export function DeliveryStep({ user, onComplete }: Props) {
  const [slots, setSlots] = useState<Slot[]>(DEMO_SLOTS)

  useEffect(() => {
    const supabase = createClient()
    const today = new Date().toISOString().slice(0, 10)
    supabase
      .from('delivery_slots')
      .select('id, slot_label, date, is_express')
      .gte('date', today)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(20)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setSlots(
            data.map((s: any) => ({
              id: s.id,
              label: s.slot_label,
              date: s.date,
              isExpress: !!s.is_express,
            }))
          )
        }
      })
  }, [])

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: user?.email ?? '',
      countryCode: 'NL',
      deliveryType: 'home_delivery',
    },
  })

  const deliveryType = watch('deliveryType')
  const country = watch('countryCode')

  function submit(data: FormData) {
    const selected = slots.find((s) => s.id === data.slotId)
    onComplete({ ...data, isExpress: selected?.isExpress ?? false, slotLabel: selected?.label })
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      {/* Delivery type */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-saffron-500" />
          Delivery Method
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'home_delivery', label: '🚚 Home Delivery' },
            { value: 'click_and_collect', label: '🏪 Click & Collect' },
          ].map((opt) => (
            <label key={opt.value} className={`border-2 rounded-xl p-4 cursor-pointer transition ${
              deliveryType === opt.value ? 'border-saffron-500 bg-saffron-50' : 'border-border hover:border-saffron-300'
            }`}>
              <input type="radio" value={opt.value} {...register('deliveryType')} className="sr-only" />
              <span className="font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Contact info */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">First Name</label>
            <input {...register('firstName')} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
            {errors.firstName && <p className="text-destructive text-xs mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Last Name</label>
            <input {...register('lastName')} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
            {errors.lastName && <p className="text-destructive text-xs mt-1">{errors.lastName.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" {...register('email')} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input type="tel" {...register('phone')} placeholder="+31..." className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
            {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
          </div>
        </div>
      </div>

      {/* Address */}
      {deliveryType === 'home_delivery' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Street Address</label>
              <input {...register('streetLine1')} placeholder="Hoofdstraat 1" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
              {errors.streetLine1 && <p className="text-destructive text-xs mt-1">{errors.streetLine1.message}</p>}
            </div>
            <input {...register('streetLine2')} placeholder="Apartment, flat, etc." className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">City</label>
                <input {...register('city')} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
                {errors.city && <p className="text-destructive text-xs mt-1">{errors.city.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Postal Code</label>
                <input {...register('postalCode')} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
                {errors.postalCode && <p className="text-destructive text-xs mt-1">{errors.postalCode.message}</p>}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Country</label>
              <select {...register('countryCode')} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
              <ShippingOptions country={country} />
            </div>
          </div>
        </div>
      )}

      {/* Delivery slot */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-saffron-500" />
          Delivery Slot
        </h2>
        <div className="space-y-2">
          {slots.map((slot) => (
            <label key={slot.id} className="flex items-center gap-3 border rounded-xl p-3 cursor-pointer hover:border-saffron-300 transition">
              <input type="radio" value={slot.id} {...register('slotId')} className="text-saffron-500" />
              <div className="flex-1">
                <span className="font-medium text-sm">{slot.label}</span>
                {slot.isExpress && (
                  <span className="ml-2 text-xs bg-saffron-100 text-saffron-700 px-2 py-0.5 rounded-full font-medium">
                    Express +€5
                  </span>
                )}
              </div>
              <span className="text-sm text-muted-foreground">{slot.date}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-medium">Delivery Instructions (optional)</label>
        <textarea
          {...register('notes')}
          rows={2}
          placeholder="Leave at the door, ring bell, etc."
          className="mt-1 w-full border rounded-lg px-3 py-2 text-sm resize-none"
        />
      </div>

      <Button type="submit" size="lg" className="w-full">
        Continue to Payment →
      </Button>
    </form>
  )
}
