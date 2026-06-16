// theme.ts   :)

export const theme = {
  colors: {

    background: '#0B0B0C', 

    surface: {
      primary: '#141416',   
      secondary: '#1A1A1E',  
      tertiary: '#222227',   
    },

    
    text: {
      primary: '#FFFFFF',   
      secondary: '#A1A1AA',  
      muted: '#61616A',     
    },

    accent: {
      primary: '#FFFFFF',   
      success: '#22C55E',    
      danger: '#EF4444',     
      border: 'rgba(255, 255, 255, 0.08)', 
    }
  },


  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },


  borderRadius: {
    sm: '6px',
    md: '12px',   
    lg: '20px',   
    xl: '28px',   
    full: '9999px',
  },

  fontSize: {
    xs: '12px',   
    sm: '14px',   
    md: '16px',   
    lg: '20px',   
    xl: '28px',   
  },


  shadows: {
    card: '0px 4px 20px rgba(0, 0, 0, 0.4)',
    glow: '0px 0px 15px rgba(255, 255, 255, 0.03)', 
  },

  transitions: {
    default: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
  }
} as const;

export type AppTheme = typeof theme;