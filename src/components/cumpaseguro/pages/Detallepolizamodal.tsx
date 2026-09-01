import React from 'react';
import { createPortal } from 'react-dom';
import { Poliza } from '../types';

interface DetallePolizaModalProps {
  poliza: Poliza;
  estadoContrato: string;
  obtenerBadgeEstado: (estado: string) => React.ReactNode;
  onClose: () => void;
}

const DetallePolizaModal: React.FC<DetallePolizaModalProps> = ({ poliza, estadoContrato, obtenerBadgeEstado, onClose }) => {
  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Detalles de la Póliza</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Información General */}
            <div className="bg-blue-50 p-4 sm:p-5 rounded-xl border border-blue-200 shadow-sm">
              <h4 className="font-semibold text-sm sm:text-base text-blue-800 mb-3 flex items-center gap-2">
                <span>📋</span>
                <span>Información General</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-600">Fecha de Registro:</span>
                  <p className="font-medium text-gray-900">{poliza.fecha_local}</p>
                </div>
                <div>
                  <span className="text-gray-600">Hora:</span>
                  <p className="font-medium text-gray-900">{poliza.hora_local}</p>
                </div>
                <div>
                  <span className="text-gray-600">Estado:</span>
                  <p className="font-medium">{obtenerBadgeEstado(estadoContrato)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Agencia:</span>
                  <p className="font-medium text-gray-900">{poliza.agencia_nom}</p>
                </div>
                <div>
                  <span className="text-gray-600">Usuario Registro:</span>
                  <p className="font-medium text-gray-900">{poliza.user}</p>
                </div>
                <div>
                  <span className="text-gray-600">ID Póliza:</span>
                  <p className="font-medium text-gray-900 text-xs">{poliza._id}</p>
                </div>
              </div>
            </div>

            {/* Información del Titular */}
            <div className="bg-green-50 p-4 sm:p-5 rounded-xl border border-green-200 shadow-sm">
              <h4 className="font-semibold text-sm sm:text-base text-green-800 mb-3 flex items-center gap-2">
                <span>👤</span>
                <span>Información del Titular</span>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-600">Nombre Completo:</span>
                  <p className="font-medium text-gray-900">
                    {poliza.titular.nombres} {poliza.titular.apellido_paterno} {poliza.titular.apellido_materno}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Tipo de Documento:</span>
                  <p className="font-medium text-gray-900">{poliza.titular.tipo_documento}</p>
                </div>
                <div>
                  <span className="text-gray-600">Número de Documento:</span>
                  <p className="font-medium text-gray-900">{poliza.titular.nro_documento}</p>
                </div>
                <div>
                  <span className="text-gray-600">Celular:</span>
                  <p className="font-medium text-gray-900">{poliza.titular.celular}</p>
                </div>
                <div>
                  <span className="text-gray-600">Correo Electrónico:</span>
                  <p className="font-medium text-gray-900">{poliza.titular.correo}</p>
                </div>
                <div>
                  <span className="text-gray-600">Dirección:</span>
                  <p className="font-medium text-gray-900">{poliza.titular.direccion}</p>
                </div>
                <div>
                  <span className="text-gray-600">Tipo de Atención:</span>
                  <p className="font-medium text-gray-900">{poliza.titular.tipo_atencion}</p>
                </div>
                <div>
                  <span className="text-gray-600">Costo del Seguro:</span>
                  <p className="font-bold text-green-700 text-base sm:text-lg">S/ {poliza.titular.costo.toFixed(2)}</p>
                </div>
              </div>

              {/* Imágenes del DNI del Titular */}
              {(poliza.titular.foto_dni_anverso_url || poliza.titular.foto_dni_reverso_url) && (
                <div className="mt-4">
                  <h5 className="font-medium text-xs sm:text-sm text-gray-700 mb-2 flex items-center gap-1">
                    <span>📷</span>
                    <span>Documentos del Titular</span>
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {poliza.titular.foto_dni_anverso_url && (
                      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 border-b border-gray-200">
                          DNI - Anverso
                        </div>
                        <div className="bg-white p-2">
                          <img
                            src={poliza.titular.foto_dni_anverso_url}
                            alt="DNI Anverso"
                            className="w-full h-32 sm:h-40 object-cover rounded cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(poliza.titular.foto_dni_anverso_url, '_blank')}
                          />
                        </div>
                      </div>
                    )}
                    {poliza.titular.foto_dni_reverso_url && (
                      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 border-b border-gray-200">
                          DNI - Reverso
                        </div>
                        <div className="bg-white p-2">
                          <img
                            src={poliza.titular.foto_dni_reverso_url}
                            alt="DNI Reverso"
                            className="w-full h-32 sm:h-40 object-cover rounded cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(poliza.titular.foto_dni_reverso_url, '_blank')}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Beneficiarios */}
            {poliza.beneficiarios.length > 0 && (
              <div className="bg-purple-50 p-4 sm:p-5 rounded-xl border border-purple-200 shadow-sm">
                <h4 className="font-semibold text-sm sm:text-base text-purple-800 mb-3 flex items-center gap-2">
                  <span>👥</span>
                  <span>Beneficiarios ({poliza.beneficiarios.length})</span>
                </h4>
                <div className="space-y-2">
                  {poliza.beneficiarios.map((ben: any, idx: number) => (
                    <div key={idx} className="bg-white p-3 sm:p-4 rounded-lg border border-purple-200 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-xs sm:text-sm text-gray-900">
                          Beneficiario #{idx + 1}
                        </h5>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-600">Nombre Completo:</span>
                          <p className="font-medium text-gray-900">
                            {ben.nombres} {ben.apellido_paterno} {ben.apellido_materno}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Documento:</span>
                          <p className="font-medium text-gray-900">
                            {ben.tipo_documento}: {ben.nro_documento}
                          </p>
                        </div>
                        {ben.celular && (
                          <div>
                            <span className="text-gray-600">Celular:</span>
                            <p className="font-medium text-gray-900">{ben.celular}</p>
                          </div>
                        )}
                        {ben.correo && (
                          <div>
                            <span className="text-gray-600">Correo:</span>
                            <p className="font-medium text-gray-900">{ben.correo}</p>
                          </div>
                        )}
                        {ben.direccion && (
                          <div className="col-span-2">
                            <span className="text-gray-600">Dirección:</span>
                            <p className="font-medium text-gray-900">{ben.direccion}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estado de Firma */}
            {poliza.firma && (
              <div className="bg-yellow-50 p-4 sm:p-5 rounded-xl border border-yellow-200 shadow-sm">
                <h4 className="font-semibold text-sm sm:text-base text-yellow-800 mb-3 flex items-center gap-2">
                  <span>✍️</span>
                  <span>Estado de Firma Digital</span>
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-gray-600">Estado General:</span>
                    <p className="font-medium">
                      {poliza.firma.status ? (
                        <span className="text-green-700 font-semibold">✅ Activo</span>
                      ) : (
                        <span className="text-red-700 font-semibold">❌ Inactivo</span>
                      )}
                    </p>
                  </div>
                  {poliza.firma.data?.firm_easy && (
                    <>
                      <div>
                        <span className="text-gray-600">Estado de Firma:</span>
                        <p className="font-medium">
                          {poliza.firma.data.firm_easy.status === 'signed' ? (
                            <span className="text-green-700 font-semibold">✅ Firmado</span>
                          ) : (
                            <span className="text-orange-700 font-semibold">⏳ Pendiente</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Token:</span>
                        <p className="font-medium text-xs text-gray-900 break-all">
                          {poliza.firma.data.firm_easy.token}
                        </p>
                      </div>
                      {poliza.firma.data.firm_easy.signed_file && (
                        <div>
                          <span className="text-gray-600">Archivo Firmado:</span>
                          <button
                            onClick={() => poliza.firma?.data?.firm_easy?.signed_file &&
                              window.open(poliza.firma.data.firm_easy.signed_file, '_blank')}
                            className="text-blue-600 hover:text-blue-800 underline font-medium text-xs break-all"
                          >
                            Ver documento firmado
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {poliza.firma.message && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Mensaje:</span>
                      <p className="font-medium text-gray-900">{poliza.firma.message}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* URLs de Documentos */}
            {(poliza.contrato_url || poliza.voucher_url) && (
              <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-sm sm:text-base text-gray-800 mb-3 flex items-center gap-2">
                  <span>📎</span>
                  <span>Documentos Adjuntos</span>
                </h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  {poliza.contrato_url && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-medium">Contrato:</span>
                      <button
                        onClick={() => window.open(poliza.contrato_url, '_blank')}
                        className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
                      >
                        Ver contrato
                      </button>
                    </div>
                  )}
                  {poliza.voucher_url && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-medium">Voucher:</span>
                      <button
                        onClick={() => window.open(poliza.voucher_url, '_blank')}
                        className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
                      >
                        Ver voucher
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 font-medium shadow-sm hover:shadow transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DetallePolizaModal;