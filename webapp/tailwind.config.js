/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
    
    },
    colors:{
      'black-text':"#333333",
      'original-black':"#000000",
      'original-white':'#ffffff',
      'blue-text':'#2100D0',
      'subtext-one':'#2B2B2B',
      'subtext-two':'#555555',
      'purple-text':'#4A28FF',
      'subtext-three':'#777777',
      'card-heading':"#454545",
      'footer-text':'#979797'
     },
     fontFamily: {
        "Sequel-Sans-Black":["Sequel-Sans-Black"]
    },
    screens: {
      '2xl': '1800px',
      // => @media (max-width: 1535px) { ... }

      'xl': '1200px',
      // => @media (max-width: 1279px) { ... }

      'lg': '1023px',
      // => @media (max-width: 1023px) { ... }

      'md': '767px',
      // => @media (max-width: 767px) { ... }

      'sm': '0px',
      // => @media (max-width: 639px) { ... }
    },
    maxWidth:{
      //for containing the elements at larger devices
      'center-width':'1170px'
    },
    width:{
      'section-width':"70%"
    },
    backgroundColor:{
      'white-background':"#ffffff"
    }
  },
  plugins: [],
};
