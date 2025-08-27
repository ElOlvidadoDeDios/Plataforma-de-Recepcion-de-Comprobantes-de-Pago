import { User, AgenciaCaja } from '../../../types';
import { UserRole } from '../../../types/roles';
import { updateUserAgencias, updateUserRole } from '../../../api';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

interface UseAgenciaManagementProps {
  selectedUser: User | null;
  userAgencias: AgenciaCaja[];
  setUserAgencias: (agencias: AgenciaCaja[]) => void;
  setShowAgenciaModal: (show: boolean) => void;
  setSelectedUser: (user: User | null) => void;
  pendingRoleChange: { userId: string; role: UserRole } | null;
  setPendingRoleChange: (change: { userId: string; role: UserRole } | null) => void;
}

export const useAgenciaManagement = ({
  selectedUser,
  userAgencias,
  setUserAgencias,
  setShowAgenciaModal,
  setSelectedUser,
  pendingRoleChange,
  setPendingRoleChange
}: UseAgenciaManagementProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleAgenciaChange = (index: number, field: keyof AgenciaCaja, value: string) => {
    const newAgencias = [...userAgencias];
    
    // 🔧 Validación segura del índice y objeto existente
    if (index >= 0 && index < newAgencias.length) {
      // Asegurar que existe un objeto válido en el índice
      if (!newAgencias[index]) {
        newAgencias[index] = { agencia: '', cod_caja: '', user_caja: '' };
      }
      
      newAgencias[index] = {
        ...newAgencias[index],
        [field]: typeof value === 'string' ? value : ''
      };
      setUserAgencias(newAgencias);
    }
  };

  const handleAddAgencia = () => {
    // 🔧 Filtrar agencias válidas (sin arrays vacíos)
    const agenciasValidas = userAgencias.filter(ag =>
      ag &&
      !Array.isArray(ag) &&
      typeof ag === 'object' &&
      typeof ag.agencia === 'string' &&
      typeof ag.cod_caja === 'string' &&
      typeof ag.user_caja === 'string'
    );

    const tieneFilaVacia = agenciasValidas.some(ag =>
      !ag.agencia.trim() && !ag.cod_caja.trim() && !ag.user_caja.trim()
    );
    
    if (!tieneFilaVacia) {
      setUserAgencias([...agenciasValidas, { agencia: '', cod_caja: '', user_caja: '' }]);
    } else {
      toast('Complete la fila vacía existente antes de agregar una nueva', {
        duration: 4000,
        style: {
          background: '#EFF6FF',
          color: '#1E40AF',
          border: '1px solid #93C5FD'
        }
      });
    }
  };

  const handleRemoveAgencia = (index: number) => {
    const newAgencias = userAgencias.filter((_, i) => i !== index);
    
    // 🔧 No agregar agencia vacía automáticamente - permitir cero agencias
    setUserAgencias(newAgencias);
    
    // 🔧 Marcar que hubo una eliminación para forzar guardado
    if (selectedUser) {
      // Agregar una propiedad temporal para indicar que hubo eliminación
      (selectedUser as any).__agenciaRemoved = true;
    }
  };

  const handleOpenAgenciaModal = (user: User, canManageAgenciasOf: (user: User) => boolean) => {
    if (!canManageAgenciasOf(user)) {
      if (user.status !== 1) {
        toast.error('El usuario debe estar activo para gestionar agencias');
      } else if (user.role !== UserRole.CAJERO &&
                 user.role !== UserRole.ADMINISTRADOR &&
                 user.role !== UserRole.ANALISTA_CREDITOS_PAGO_DIARIO &&
                 user.role !== UserRole.SUPER_ADMIN) {
        toast.error('Solo se pueden gestionar agencias para usuarios de pagos, admin y super admin');
      } else {
        toast.error('No tienes permisos para gestionar las agencias de este usuario');
      }
      return;
    }
    
    setSelectedUser(user);
    
    // 🔧 Validación segura para agencias (incluye arrays vacíos)
    const agenciasValidas = user.agencias?.filter(ag =>
      ag &&
      !Array.isArray(ag) &&  // ✅ Excluir arrays vacíos
      typeof ag === 'object' &&
      typeof ag.agencia === 'string' &&
      typeof ag.cod_caja === 'string' &&
      typeof ag.user_caja === 'string' &&
      ag.agencia.trim() !== '' &&  // ✅ Excluir strings vacíos
      ag.cod_caja.trim() !== '' &&
      ag.user_caja.trim() !== ''
    ) || [];
    
    // 🔧 Permitir que no haya agencias inicialmente
    const agenciasIniciales = agenciasValidas.length > 0
      ? [...agenciasValidas]
      : [];
    
    // 🔧 Solo agregar fila vacía si hay agencias y todas están completas
    if (agenciasIniciales.length > 0) {
      const todasLlenas = agenciasIniciales.every(ag =>
        ag &&
        typeof ag.agencia === 'string' && ag.agencia.trim() &&
        typeof ag.cod_caja === 'string' && ag.cod_caja.trim() &&
        typeof ag.user_caja === 'string' && ag.user_caja.trim()
      );
      
      if (todasLlenas) {
        agenciasIniciales.push({ agencia: '', cod_caja: '', user_caja: '' });
      }
    } else {
      // Si no hay agencias, agregar una fila vacía para empezar
      agenciasIniciales.push({ agencia: '', cod_caja: '', user_caja: '' });
    }
    
    setUserAgencias(agenciasIniciales);
    setShowAgenciaModal(true);
  };

  const handleSaveAgencias = async () => {
    if (!selectedUser) {
      toast.error('No se ha seleccionado ningún usuario');
      return;
    }

    // 🔧 Primero verificar si hay filas con datos incompletos
    const filasIncompletas = userAgencias.filter(ag =>
      ag && (
        // Tiene al menos un campo lleno pero no todos
        (ag.agencia.trim() || ag.cod_caja.trim() || ag.user_caja.trim()) &&
        (!ag.agencia.trim() || !ag.cod_caja.trim() || !ag.user_caja.trim())
      )
    );

    // Si hay filas incompletas, mostrar error específico
    if (filasIncompletas.length > 0) {
      toast.error('Complete todos los campos de las agencias o elimine las filas vacías');
      return;
    }

    // 🔧 Filtro para agencias completamente llenas
    const agenciasNoVacias = userAgencias.filter(ag =>
      ag &&
      typeof ag.agencia === 'string' && ag.agencia.trim() !== '' &&
      typeof ag.cod_caja === 'string' && ag.cod_caja.trim() !== '' &&
      typeof ag.user_caja === 'string' && ag.user_caja.trim() !== ''
    );

    // 🔧 Validación segura de agencias actuales (incluye arrays vacíos)
    const agenciasActuales = selectedUser.agencias?.filter(ag =>
      ag &&
      !Array.isArray(ag) &&  // ✅ Excluir arrays vacíos
      typeof ag === 'object' &&
      typeof ag.agencia === 'string' &&
      typeof ag.cod_caja === 'string' &&
      typeof ag.user_caja === 'string' &&
      ag.agencia.trim() !== '' &&  // ✅ Excluir strings vacíos
      ag.cod_caja.trim() !== '' &&
      ag.user_caja.trim() !== ''
    ) ?? [];

    // 🔧 Comparación mejorada de agencias - comparar por contenido no por orden
    const agenciasActualesNormalizadas = agenciasActuales.map(ag => ({
      agencia: ag.agencia.trim(),
      cod_caja: ag.cod_caja.trim(),
      user_caja: ag.user_caja.trim()
    })).sort((a, b) => a.cod_caja.localeCompare(b.cod_caja));

    const agenciasNuevasNormalizadas = agenciasNoVacias.map(ag => ({
      agencia: ag.agencia.trim(),
      cod_caja: ag.cod_caja.trim(),
      user_caja: ag.user_caja.trim()
    })).sort((a, b) => a.cod_caja.localeCompare(b.cod_caja));

    // 🔧 Verificar si hubo eliminación de agencia
    const huboEliminacion = (selectedUser as any).__agenciaRemoved;
    
    const agenciasIguales = !huboEliminacion &&
      agenciasNuevasNormalizadas.length === agenciasActualesNormalizadas.length &&
      agenciasNuevasNormalizadas.every((agNueva, idx) => {
        const agActual = agenciasActualesNormalizadas[idx];
        return agNueva.agencia === agActual.agencia &&
               agNueva.cod_caja === agActual.cod_caja &&
               agNueva.user_caja === agActual.user_caja;
      });
    
    if (agenciasIguales) {
      setShowAgenciaModal(false);
      setSelectedUser(null);
      setUserAgencias([]);
      return;
    }
    
    // 🔧 Limpiar el flag de eliminación antes de guardar
    if (huboEliminacion) {
      delete (selectedUser as any).__agenciaRemoved;
    }

    // 🔧 Permitir cero agencias - eliminar validación restrictiva
    // Los usuarios pueden no tener agencias asignadas

    try {
      // 🔧 Permitir array vacío de agencias
      const agenciasFormateadas = agenciasNoVacias.length > 0
        ? agenciasNoVacias.map(ag => ({
            agencia: ag.agencia.trim(),
            cod_caja: ag.cod_caja.trim(),
            user_caja: ag.user_caja.trim(),
          }))
        : []; // Permitir array vacío

      // 🔧 Solo validar si hay agencias para validar
      if (agenciasFormateadas.length > 0) {
        const validaciones = {
          camposCompletos: agenciasFormateadas.every(ag => ag.agencia && ag.cod_caja && ag.user_caja),
          formatoValido: agenciasFormateadas.every(ag =>
            ag.cod_caja.length >= 3 &&
            ag.user_caja.length >= 3 &&
            /^[A-Z0-9_-]+$/i.test(ag.cod_caja) &&
            /^[A-Z0-9_-]+$/i.test(ag.user_caja)
          ),
          codigosUnicos: new Set(agenciasFormateadas.map(ag => ag.cod_caja)).size === agenciasFormateadas.length,
          usuariosUnicos: new Set(agenciasFormateadas.map(ag => ag.user_caja)).size === agenciasFormateadas.length,
          longitudMaxima: agenciasFormateadas.every(ag =>
            ag.cod_caja.length <= 20 && ag.user_caja.length <= 20
          ),
          sinCaracteresEspeciales: agenciasFormateadas.every(ag =>
            !ag.cod_caja.includes(' ') && !ag.user_caja.includes(' ') && /^[A-Z0-9_-]+$/i.test(ag.cod_caja) && /^[A-Z0-9_-]+$/i.test(ag.user_caja)
          )
        };

        if (!validaciones.camposCompletos) {
          toast.error('Todos los campos son obligatorios');
          return;
        }
        if (!validaciones.formatoValido) {
          toast.error('Los códigos deben contener solo letras, números, guiones o guiones bajos y no tener espacios');
          return;
        }
        if (!validaciones.longitudMaxima) {
          toast.error('Los códigos no pueden exceder 20 caracteres');
          return;
        }
        if (!validaciones.sinCaracteresEspeciales) {
          toast.error('Los códigos no pueden contener espacios');
          return;
        }
        if (!validaciones.codigosUnicos) {
          toast.error('No puede haber códigos de caja duplicados');
          return;
        }
        if (!validaciones.usuariosUnicos) {
          toast.error('No puede haber usuarios de caja duplicados');
          return;
        }
      }

      
      // 🔍 Log simple para ver si se está enviando al crear agencia
      if (agenciasFormateadas.length > 0) {

      }
      
      await updateUserAgencias(selectedUser._id, agenciasFormateadas);
      
      
      // 🔧 Mensaje más descriptivo según el caso
      if (agenciasFormateadas.length === 0) {
        toast.success('Agencias eliminadas correctamente');
      } else {
        toast.success('Agencias actualizadas correctamente');
      }

      if (pendingRoleChange) {
        await updateUserRole(pendingRoleChange.userId, pendingRoleChange.role);
        setPendingRoleChange(null);
      }

      // Actualizar el cache de usuarios directamente para reflejar los cambios inmediatamente
      queryClient.setQueryData(['users'], (oldUsers: any) => {
        if (!oldUsers) return oldUsers;
        const updatedUsers = oldUsers.map((user: any) =>
          user._id === selectedUser._id
            ? { ...user, agencias: agenciasFormateadas }
            : user
        );
  
        
        return updatedUsers;
      });

      setShowAgenciaModal(false);
      setSelectedUser(null);
      setUserAgencias([]);
      
      // 🔧 Limpiar cualquier estado temporal del usuario seleccionado
      if (selectedUser && (selectedUser as any).__agenciaRemoved) {
        delete (selectedUser as any).__agenciaRemoved;
      }
      
      // Invalidar queries para refrescar desde el servidor
      queryClient.invalidateQueries({ queryKey: ['users'] });

    } catch (error: any) {
      const status = error.response?.status;
      switch (status) {
        case 400:
          toast.error(error.response.data.message || 'Datos de agencias inválidos');
          break;
        case 401:
          toast.error('Sesión expirada. Inicia sesión nuevamente');
          navigate('/login');
          break;
        case 403:
          toast.error('No tienes permisos para esta acción');
          break;
        case 404:
          toast.error('Usuario no encontrado');
          break;
        case 409:
          toast.error('Conflicto: Los códigos de caja deben ser únicos');
          break;
        default:
          toast.error('Error al actualizar agencias');
      }

      if (pendingRoleChange) {
        await updateUserRole(pendingRoleChange.userId, UserRole.BASIC_USER);
        setPendingRoleChange(null);
      }
    }
  };

  const handleCloseAgenciaModal = () => {
    // 🔧 Limpiar cualquier estado temporal antes de cerrar
    if (selectedUser && (selectedUser as any).__agenciaRemoved) {
      delete (selectedUser as any).__agenciaRemoved;
    }
    
    setShowAgenciaModal(false);
    setSelectedUser(null);
    setUserAgencias([]);
  };

  return {
    handleAgenciaChange,
    handleAddAgencia,
    handleRemoveAgencia,
    handleOpenAgenciaModal,
    handleSaveAgencias,
    handleCloseAgenciaModal
  };
};