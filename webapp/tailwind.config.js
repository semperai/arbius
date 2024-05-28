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
        "Sequel-Sans-Light-Body":["Sequel-Sans-Light-Body"],
        "Sequel-Sans-Medium-Head":["Sequel-Sans-Medium-Head"]
    },
    backgroundImage: theme => ({
      'democratic-gradient':"linear-gradient(142.65deg, rgba(146, 189, 255, 0.02) -27.23%, rgba(81, 54, 255, 0.1) 31.69%, rgba(255, 255, 255, 0.159364) 60.92%, rgba(212, 179, 255, 0.2) 101.25%)"
   }),
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
      'section-width':"80%"
    },
    backgroundColor:{
      'white-background':"#ffffff",
      'tick-bacground':'#DFECFF',
      "black":"#000000",
      'purple-background':"#4A28FF"
    }
  },
  plugins: [],
};
