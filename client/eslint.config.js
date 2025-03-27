import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  // Base configuration for all files
  { 
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: { 
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  
  // JavaScript recommendations
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: { js },
    rules: {
      ...js.configs.recommended.rules
    }
  },
  
  // TypeScript configurations
  ...tseslint.configs.recommended,
  
  // React configurations
  {
    files: ["**/*.{jsx,tsx}"],
    ...pluginReact.configs.flat.recommended,
    rules: {
      // Relaxed rules to avoid breaking functionality
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off" // For modern React with automatic JSX runtime
    }
  },
  
  // React Hooks
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      "react-hooks": reactHooksPlugin
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn"
    }
  },
  
  // Override specifically for vite.config.js
  {
    files: ["vite.config.js"],
    rules: {
      "@typescript-eslint/no-var-requires": "off"
    }
  }
];