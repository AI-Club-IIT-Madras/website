export default {
  theme: {
    screens: { sm: "540px", md: "810px", lg: "1200px", xl: "1536px" },
    extend: {
      colors: {
        canvas: "#000000",
        surface: "#080808",
        panel: "#101010",
        ink: "#ffffff",
        muted: "#a3a3a3",
        line: "#ffffff1f",
      },
      fontFamily: {
        display: ["Instrument Sans", "sans-serif"],
        body: ["Open Sans", "sans-serif"],
        ui: ["Inter", "sans-serif"],
      },
      fontSize: {
        hero: ["5rem", { lineHeight: "1.05", letterSpacing: "-0.045em" }],
        section: ["4.5rem", { lineHeight: "1.1", letterSpacing: "-0.04em" }],
        card: ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.025em" }],
      },
      spacing: {
        section: "6rem",
        "section-mobile": "3.5rem",
        "source-gap": "55px",
      },
      borderRadius: { card: "20px", control: "10px" },
      maxWidth: { content: "1440px" },
      transitionDuration: { gentle: "240ms" },
    },
  },
};
