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
    fontSize:{
      "header-2xl": "70px",
      'header':"50px",
      'header-md':"40px",
      "para":"16px",
      'mobile-header':"45px"
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
      'footer-text':'#979797',
      'grey-text': '#c2c2c2',
      'copyright-text':'#39393980'
     },
     fontFamily: {
        "Sequel-Sans-Light-Body":["Sequel-Sans-Light-Body"],
        "Sequel-Sans-Medium-Head":["Sequel-Sans-Medium-Head"],
        "Geist-SemiBold":["Geist-SemiBold"],
        "Geist-Regular":["Geist-Regular"],
        "At-Hauss": ["AtHaussAero-Light"]
    },
    //  fontSize:{
    //   'header':"55px",
    //   "para":"20px"
    // },
    backgroundImage: theme => ({
      'democratic-gradient':"linear-gradient(142.65deg, rgba(146, 189, 255, 0.02) -27.23%, rgba(81, 54, 255, 0.1) 31.69%, rgba(255, 255, 255, 0.159364) 60.92%, rgba(212, 179, 255, 0.2) 101.25%)",
      'models-gradient': "linear-gradient(101.66deg, rgba(146, 189, 255, 0.02) -6.48%, rgba(81, 54, 255, 0.1) 45.24%, rgba(212, 179, 255, 0.2) 106.31%)",
      'background-gradient': "linear-gradient(90deg, #4A28FF 16.5%, #9ED6FF 100%)",
      'background-gradient-txt': "linear-gradient(90deg, #4A28FF 0.5%, #9ED6FF 50%)",
      'button-gradient': "linear-gradient(96.52deg, #9162F7 -25.28%, #FB567E 94%)",
      'button-gradient-txt': "linear-gradient(96.52deg, #9162F7 0.28%, #FB567E 44%)",
      "gradient-text":"linear-gradient(91.52deg, #4A28FF 0%, #92BDFF 115.35%)",
      "buy-hover":"linear-gradient(95.28deg, #4A28FF 17.25%, #92BDFF 123.27%)",
      "amica-gradient":"linear-gradient(101.66deg, rgba(146, 189, 255, 0.02) -6.48%, rgba(81, 54, 255, 0.1) 45.24%, rgba(212, 179, 255, 0.2) 106.31%)",
      "ai-gradient":"linear-gradient(37.19deg, rgba(146, 189, 255, 0.02) 19.15%, rgba(81, 54, 255, 0.1) 66.39%, rgba(253, 79, 89, 0.2) 122.15%)",
      "marketplace-gradient":"linear-gradient(162.01deg, rgba(146, 189, 255, 0.02) 9.35%, rgba(81, 54, 255, 0.1) 62.99%, rgba(255, 55, 235, 0.2) 126.32%)",
      "aius-stake":"linear-gradient(95.16deg, rgba(146, 189, 255, 0.02) -0.99%, rgba(81, 54, 255, 0.1) 46.28%, rgba(212, 179, 255, 0.2) 102.09%)"
   }),
    screens: {
      '2xl': '1800px',

      'xl': '1200px',

      'lg': '1023px',

      'md': '767px',
      
      'lm':"400px",

      'sm': '0px',
    },
    maxWidth:{
      //for containing the elements at larger devices
      'center-width':'2000px'
    },
   
    width:{
      'section-width':"80%",
      'mobile-section-width':"90%"
    },
    backgroundColor:{
      'white-background':"#ffffff",
      'tick-bacground':'#DFECFF',
      "black":"#000000",
      'purple-background':"#4A28FF",
      'hamburger-background': "#333333",
    }
  },
  plugins: [],
};
