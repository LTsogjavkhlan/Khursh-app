// Per-HOA optional features. A platform admin switches these on or off for
// each HOA; the resident app greys out anything that is off, and the API
// refuses the matching actions.
//
// To add a feature: add an entry here and to the `features` sub-schema in
// models/Hoa.js, then guard its routes with requireFeature('<key>').
export const FEATURES = [
    {
        key: 'gateOpen',
        label: 'Хаалт нээх товч',
        description: 'Оршин суугчид аппаас хаалт нээх товчтой.',
    },
    {
        key: 'vehicleRegistration',
        label: 'Машины дугаар бүртгэх',
        description: 'Оршин суугчид өөрсдийн машины улсын дугаарыг бүртгүүлнэ.',
    },
    {
        key: 'guestPass',
        label: 'Зочны машин',
        description: 'Оршин суугчид зочны машинд түр нэвтрэх эрх олгоно.',
    },
]

export const FEATURE_KEYS = FEATURES.map(f => f.key)

// Every feature is on unless explicitly switched off, so HOAs created before
// a feature existed keep their current behaviour.
export const resolveFeatures = (hoa) =>
    Object.fromEntries(FEATURE_KEYS.map(key => [key, hoa?.features?.[key] !== false]))
