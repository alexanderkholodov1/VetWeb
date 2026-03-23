import { randomUUID } from "crypto";

export interface PaymentResult {
  success: boolean;
  pagoId: string | null;
  error: string | null;
}

class PaymentService {
  async procesarPago(params: {
    monto: number;
    metodo: string;
    descripcion?: string;
  }): Promise<PaymentResult> {
    const { monto, metodo } = params;

    if (monto <= 0 || !metodo) {
      return {
        success: false,
        pagoId: null,
        error: "Parametros de pago invalidos"
      };
    }

    // Integracion futura: reemplazar este bloque por llamada al SDK de Stripe o MercadoPago.
    const success = Math.random() < 0.9;

    if (!success) {
      return {
        success: false,
        pagoId: null,
        error: "Pago rechazado por el procesador"
      };
    }

    return {
      success: true,
      pagoId: randomUUID(),
      error: null
    };
  }
}

export const paymentService = new PaymentService();
