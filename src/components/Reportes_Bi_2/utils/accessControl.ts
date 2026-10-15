import { UserRole, Permission } from '../../../types/permissions';
import { UserWithRole } from '../../../types/roles';
import type { View } from '../PowerBiDashboard';

// Mapeo oficial de id_age (Token JWT) -> Nombre de Agencia en el DWH
export const CODE_TO_BI_AGENCY: Record<string, string> = {
  '01': 'Wanchaq',
  '02': 'San Jerónimo',
  '03': 'Quillabamba',
  '04': 'Sicuani',
  '05': 'Molino',
  '06': 'Juliaca',
  '07': 'Lima Los Olivos',
  '08': 'Tica Tica',
  '09': 'Magisterio',
  '10': 'Lima SJL',
  '11': 'Chiclayo',
  '12': 'Arequipa',
  '13': 'Pucallpa',
};

const ALL_VIEWS: View[] = [
  'gerencia',
  'supervision',
  'agencia',
  'asesores',
  'colocaciones',
  'diaria',
  'evolucion',
  'cancelados',
  'avance',
  'ranking',
];

const ADMIN_AGENCIA_VIEWS: View[] = [
  'agencia',
  'asesores',
  'colocaciones',
  'diaria',
  'evolucion',
  'cancelados',
  'avance',
  'ranking',
];

const ANALISTA_VIEWS: View[] = [
  'asesores',
  'diaria',
  'evolucion',
  'cancelados',
  'avance',
  'ranking',
];

export interface AccessProfile {
  level: 'GLOBAL' | 'AGENCIA' | 'ASESOR';
  allowedViews: View[];
  defaultView: View;
  lockedAgency: string | null;   // Si no es null, el usuario no puede cambiar de agencia
  lockedAdvisor: string | null;  // Si no es null, el usuario no puede cambiar de asesor
}

export function resolveUserAccess(user: UserWithRole | null, dbFilters: any): AccessProfile {
  const role = user?.role || UserRole.BASIC_USER;
  const hasEditReport = user?.permissions?.includes(Permission.REPORTS_EDIT);

  // 1. NIVEL GLOBAL (Gerencia, SuperAdmin, Jefaturas o permiso REPORTS_EDIT)
  if (
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.GERENTE_GENERAL ||
    role === UserRole.JEFE_OPERACIONES ||
    role === UserRole.JEFE_RECUPERACIONES ||
    hasEditReport
  ) {
    return {
      level: 'GLOBAL',
      allowedViews: ALL_VIEWS,
      defaultView: 'gerencia',
      lockedAgency: null,
      lockedAdvisor: null,
    };
  }

  // Resolvemos la agencia del usuario a partir de user.id_age (ej: "1" -> "01" -> "Wanchaq")
  const rawAgeCode = String(user?.id_age || '').trim().padStart(2, '0');
  const resolvedAgency = CODE_TO_BI_AGENCY[rawAgeCode] || null;

  // 2. NIVEL ADMINISTRADOR DE AGENCIA
  if (role === UserRole.ADMINISTRADOR) {
    return {
      level: 'AGENCIA',
      allowedViews: ADMIN_AGENCIA_VIEWS,
      defaultView: 'agencia',
      lockedAgency: resolvedAgency,
      lockedAdvisor: null,
    };
  }

  // 3. NIVEL ANALISTA / RECUPERADOR
  // Buscamos el nombre del asesor en dbFilters.asesores cruzando por id_ana o user
  let resolvedAdvisor: string | null = null;
  if (dbFilters?.asesores && Array.isArray(dbFilters.asesores)) {
    const rawAna = String(user?.id_ana || user?.user || '').trim().toUpperCase();
    const rawName = String(user?.razon || '').trim().toUpperCase();

    const matched = dbFilters.asesores.find((a: any) => {
      const idSAsesor = String(a.IdSAsesor || '').trim().toUpperCase();
      const shortAsesor = String(a.Asesor || '').trim().toUpperCase();
      const fullName = String(a.AsesorNombresApellidos || '').trim().toUpperCase();
      return (
        (rawAna && (idSAsesor === rawAna || shortAsesor === rawAna)) ||
        (rawName && fullName === rawName)
      );
    });

    if (matched) {
      resolvedAdvisor = String(matched.AsesorNombresApellidos || matched.Asesor).trim();
    }
  }

  return {
    level: 'ASESOR',
    allowedViews: ANALISTA_VIEWS,
    defaultView: 'asesores',
    lockedAgency: resolvedAgency,
    lockedAdvisor: resolvedAdvisor,
  };
}