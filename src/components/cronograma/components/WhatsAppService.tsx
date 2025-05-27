interface WhatsAppMessage {
  phoneNumber: string;
  message: string;
  pdfBlob?: Blob;
  fileName?: string;
}

interface WhatsAppResult {
  success: boolean;
  error?: string;
}

export const sendWhatsAppMessage = async ({ phoneNumber, message, pdfBlob, fileName }: WhatsAppMessage): Promise<WhatsAppResult> => {
  try {
    if (!phoneNumber) {
      return { 
        success: false, 
        error: 'El número de teléfono es requerido' 
      };
    }

    // Limpiar el número de teléfono (eliminar espacios, guiones, etc.)
    const cleanPhoneNumber = phoneNumber.replace(/[\s-]/g, '');

    // Asegurarse que el número comience con el código de país
    const formattedNumber = cleanPhoneNumber.startsWith('51') ? cleanPhoneNumber : `51${cleanPhoneNumber}`;

    // Si hay un archivo PDF, crear un enlace temporal para descargarlo
    if (pdfBlob && fileName) {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      const fileUrl = URL.createObjectURL(file);
      
      // Codificar el mensaje con el enlace para la URL
      const fullMessage = encodeURIComponent(`${message}\n\nPuede descargar el cronograma aquí: ${fileUrl}`);

      // Crear el enlace de WhatsApp
      const whatsappUrl = `https://wa.me/${formattedNumber}?text=${fullMessage}`;

      // Abrir WhatsApp en una nueva ventana
      window.open(whatsappUrl, '_blank');

      // Limpiar el URL temporal después de un tiempo
      setTimeout(() => URL.revokeObjectURL(fileUrl), 60000);
    } else {
      // Si no hay archivo, enviar solo el mensaje
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    }

    return { success: true };
  } catch (error) {
    //console.error('Error al enviar mensaje de WhatsApp:', error);
    return {
      success: false,
      error: 'Error al enviar mensaje de WhatsApp'
    };
  }
};