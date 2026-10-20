// Optional per-HOA features (keys match backend/config/features.js).
export const FEATURE_DISABLED_MESSAGE = 'Таны СӨХ-д энэ үйлчилгээ байхгүй байна'

// True when the API refused a request because the HOA switched the feature off
export const isFeatureDisabledError = (err) => err?.status === 403 && err?.data?.code === 'FEATURE_DISABLED'

// Greyed-out look for a control whose feature is off (muted colours keep
// the label readable, unlike lowering opacity).
export const disabledFeatureStyle = (colors) => ({
    backgroundColor: colors.surfaceAlt,
    color: colors.textMuted,
    border: `1px solid ${colors.border}`,
    boxShadow: 'none',
    cursor: 'not-allowed',
})
