module.exports = {
  content: ["./src/site/**/*.html", "./src/templates/**/*.html", "./src/site/js/**/*.js"],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        primary: {
          50: "var(--primary-50)",
          100: "var(--primary-100)",
          200: "var(--primary-200)",
          300: "var(--primary-300)",
          400: "var(--primary-400)",
          500: "var(--primary-500)",
          600: "var(--primary-600)",
          700: "var(--primary-700)",
          800: "var(--primary-800)",
          900: "var(--primary-900)"
        },
        secondary: {
          50: "var(--secondary-50)",
          100: "var(--secondary-100)",
          200: "var(--secondary-200)",
          300: "var(--secondary-300)",
          400: "var(--secondary-400)",
          500: "var(--secondary-500)",
          600: "var(--secondary-600)",
          700: "var(--secondary-700)",
          800: "var(--secondary-800)",
          900: "var(--secondary-900)"
        },
        neutral: {
          50: "var(--neutral-50)",
          100: "var(--neutral-100)",
          200: "var(--neutral-200)",
          300: "var(--neutral-300)",
          400: "var(--neutral-400)",
          500: "var(--neutral-500)",
          600: "var(--neutral-600)",
          700: "var(--neutral-700)",
          800: "var(--neutral-800)",
          900: "var(--neutral-900)"
        },
        accent: "#c44a6b"
      },
      borderRadius: {
        12: "12px"
      },
      boxShadow: {
        "soft": "0 10px 30px rgba(15, 23, 42, 0.08)",
        "soft-lg": "0 14px 40px rgba(15, 23, 42, 0.10)",
        "soft-2xl": "0 26px 70px rgba(15, 23, 42, 0.14)"
      }
    }
  }
};
