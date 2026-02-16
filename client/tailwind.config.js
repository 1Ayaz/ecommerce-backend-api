/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    red: '#D10024',
                    dark: '#15161D',
                    muted: '#8D99AE',
                    bg: '#F4F6FB',
                    card: '#FFFFFF',
                    border: '#E4E7ED',
                    green: '#15803d',
                }
            },
            fontFamily: {
                sans: ['Poppins', 'sans-serif'],
            },
            boxShadow: {
                'float': '0 4px 12px rgba(209, 0, 36, 0.3)',
                'sheet': '0 -4px 20px rgba(0,0,0,0.1)',
            }
        }
    },
    plugins: [],
}
