export type EquipmentType = 'hotshot' | 'cargo_van' | 'straight_truck'

export interface FewshotMessage {
  role: 'user' | 'assistant'
  content: string
}

export const fewshot: Record<EquipmentType, FewshotMessage[]> = {
  hotshot: [
    {
      role: 'user',
      content:
        'Hotshot load: 300 miles for $675 flat paying, weight 15000 lbs, 2 stops, widgets, pickup in 3h.'
    },
    {
      role: 'assistant',
      content:
        '{"distanceMi":300,"offerFlat":675,"weightLbs":15000,"stops":2,"tarp":false,"jobsite":false,"itemType":"widgets","pickupAt":"now+3h"}'
    },
    {
      role: 'user',
      content:
        'Hotshot run 400mi $960 flat, 19000lbs, 1 stop, tarp required, pickup 2099-01-01.'
    },
    {
      role: 'assistant',
      content:
        '{"distanceMi":400,"offerFlat":960,"weightLbs":19000,"stops":1,"tarp":true,"jobsite":false,"itemType":"widgets","pickupAt":"2099-01-01T00:00:00Z"}'
    }
  ],
  cargo_van: [
    {
      role: 'user',
      content:
        'Cargo van delivery 120 miles $300 flat, 2 stops, weekend after hours inside residential service, pickup 2099-01-01.'
    },
    {
      role: 'assistant',
      content:
        '{"distanceMi":120,"offerFlat":300,"stops":2,"weekend":true,"afterHours":true,"inside":true,"residential":true,"pickupAt":"2099-01-01T00:00:00Z"}'
    }
  ],
  straight_truck: [
    {
      role: 'user',
      content:
        'Straight truck rush 150mi $450 flat 3 stops liftgate inside residential pallet jack pickup in 3h.'
    },
    {
      role: 'assistant',
      content:
        '{"distanceMi":150,"offerFlat":450,"stops":3,"liftgate":true,"inside":true,"residential":true,"palletJack":true,"pickupAt":"now+3h"}'
    }
  ]
}

