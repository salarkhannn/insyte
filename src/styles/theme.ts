export const colors = {
    neutral: {
        50: "#FAFAFA",
        100: "#F5F5F5",
        200: "#E5E5E5",
        300: "#D4D4D4",
        400: "#A3A3A3",
        500: "#737373",
        600: "#525252",
        700: "#404040",
        800: "#262626",
        900: "#171717",
    },
    primary: {
        base: "#2563EB",
        hover: "#1D4ED8",
        muted: "#DBEAFE",
    },
    semantic: {
        success: "#16A34A",
        warning: "#CA8A04",
        error: "#DC2626",
    },
    chart: [
        "#2563EB",
        "#0891B2",
        "#7C3AED",
        "#DB2777",
        "#EA580C",
        "#16A34A",
        "#CA8A04",
    ],
} as const;

export const spacing = {
    toolbar: 40,
    statusbar: 22,
    sidebar: 220,
    panel: 12,
    section: 8,
    control: 4,
} as const;

export const typography = {
    family: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
    size: {
        xs: "11px",
        sm: "12px",
        base: "13px",
        md: "14px",
        lg: "16px",
    },
    weight: {
        normal: 400,
        medium: 500,
        semibold: 600,
    },
} as const;

export const radius = {
    sm: 2,
    md: 3,
} as const;