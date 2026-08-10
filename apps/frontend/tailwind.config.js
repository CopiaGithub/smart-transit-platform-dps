/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}", // Scan Angular templates and components
  ],
  safelist: [
    'bg-blue-500', 'hover:bg-blue-600',
    'bg-gray-500', 'hover:bg-gray-600',
    'bg-red-500', 'hover:bg-red-600'
  ],
 theme: {
    container: {
      center: true,
      padding: "2rem",
    },
    screens: {
      sm: "640px",
      md: "768px",
      lg: "960px",
      xl: "1200px",
    },
    extend: {
      colors: {
        primary: "#1E293B",
        //primary:"#2e2c2b",
        accent: {
          DEFAULT: "#4F46E5",
          hover: "#3730A3",
        },
      },
      boxShadow: {
        cu: "0 2px 4px #0c143a",
      },
      page: {
        center: true,
        align: "flex items-center justify-center h-screen",
      },
    },
    fontFamily:{
      sans:['Poppins','sans-serif'],
      heading:['Open Sans','sans-serif'],
      heading1:['Inter','sans-serif']
    }
  },

  plugins: [],
};
