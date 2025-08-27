

  // Crear iconos SVG para los marcadores
    export const createMarkerSvg = (type: 'domicilio' | 'negocio' | 'agencia' | 'usuarios') => {
        let svgContent = '';
        
        switch (type) {
            case 'domicilio':
                svgContent = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <!-- Base de la casa -->
                    <rect x="6" y="14" width="20" height="12" rx="1" fill="#FFF8E1" stroke="#6D4C41" stroke-width="1"/>
                    
                    <!-- Techo -->
                    <path d="M4 14L16 4l12 10H4z" fill="url(#roofGrad)" stroke="#B71C1C" stroke-width="1"/>
                    
                    <!-- Puerta -->
                    <rect x="14" y="18" width="4" height="8" rx="0.5" fill="#8D6E63" stroke="#5D4037" stroke-width="0.8"/>
                    <circle cx="17" cy="22" r="0.6" fill="#FFD600"/>
                    
                    <!-- Ventanas -->
                    <rect x="8" y="17" width="4" height="4" fill="#81D4FA" stroke="#0288D1" stroke-width="0.6"/>
                    <rect x="20" y="17" width="4" height="4" fill="#81D4FA" stroke="#0288D1" stroke-width="0.6"/>
                    
                    <!-- Gradientes -->
                    <defs>
                        <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#E53935;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#B71C1C;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                </svg>`;
                break;
                
            case 'negocio':
                svgContent = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <!-- Edificio verde -->
                    <path d="M16 5L4 12v15h24V12L16 5z" fill="#4CAF50" stroke="#2E7D32" stroke-width="1"/>
                    <path d="M4 12h24v3H4z" fill="#66BB6A" stroke="#2E7D32" stroke-width="0.8"/>
                    <!-- Ventanas verdes más claras -->
                    <line x1="8" y1="16" x2="8" y2="26" stroke="#A5D6A7" stroke-width="2"/>
                    <line x1="12" y1="16" x2="12" y2="26" stroke="#A5D6A7" stroke-width="2"/>
                    <line x1="16" y1="16" x2="16" y2="26" stroke="#A5D6A7" stroke-width="2"/>
                    <line x1="20" y1="16" x2="20" y2="26" stroke="#A5D6A7" stroke-width="2"/>
                    <line x1="24" y1="16" x2="24" y2="26" stroke="#A5D6A7" stroke-width="2"/>
                </svg>`;
                break;
                
            case 'agencia':
                svgContent = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <!-- Edificio amarillo con detalles azules -->
                    <path d="M16 5L4 12v15h24V12L16 5z" fill="#FFD600" stroke="#FFAB00" stroke-width="1"/>
                    <path d="M4 12h24v3H4z" fill="#2962FF" stroke="#0039CB" stroke-width="0.8"/>
                    <!-- Ventanas azules -->
                    <line x1="8" y1="16" x2="8" y2="26" stroke="#448AFF" stroke-width="2"/>
                    <line x1="12" y1="16" x2="12" y2="26" stroke="#448AFF" stroke-width="2"/>
                    <line x1="16" y1="16" x2="16" y2="26" stroke="#448AFF" stroke-width="2"/>
                    <line x1="20" y1="16" x2="20" y2="26" stroke="#448AFF" stroke-width="2"/>
                    <line x1="24" y1="16" x2="24" y2="26" stroke="#448AFF" stroke-width="2"/>
                </svg>`;
                break;
            case 'usuarios':
                svgContent = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <!-- Pin exterior -->
                    <path d="M16 2C10 2 6 7 6 12c0 7 10 18 10 18s10-11 10-18c0-5-4-10-10-10z" 
                        fill="url(#grad1)" stroke="#D50000" stroke-width="1.2"/>
                    
                    <!-- Círculo interior -->
                    <circle cx="16" cy="12" r="4" fill="#FFF" stroke="#0D47A1" stroke-width="1.5"/>
                    
                    <!-- Gradiente para el pin -->
                    <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#FF1744;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#D500F9;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                </svg>`;
        break;

        }
        
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
    };



