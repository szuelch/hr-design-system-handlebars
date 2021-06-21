import "../src/assets/css/index.css";
import "../src/assets/css/tailwind.css";
import { themes } from "@storybook/theming";
import hrDesignsystemDark from "./HRDesignsystemDark";
import hrDesignsystemLight from "./HRDesignsystemLight";

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  docs: {
    theme: hrDesignsystemLight,
  },
  // Storybook a11y addon configuration
  a11y: {
    // the target DOM element
    element: "#root",
    // sets the execution mode for the addon
    manual: false,
  },
};
