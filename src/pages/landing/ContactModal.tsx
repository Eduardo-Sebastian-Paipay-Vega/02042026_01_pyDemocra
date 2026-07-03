import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import "./contact-modal.css";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [emailLabel, setEmailLabel] = useState("tu-correo@ejemplo.com");
  const [waLabel, setWaLabel] = useState("wa.me/51953714752");
  const [copyBtnLabel, setCopyBtnLabel] = useState("Copiar correo");

  const copyText = useCallback(
    async (text: string, setter: (v: string) => void, originalLabel: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setter("¡Copiado!");
        setTimeout(() => setter(originalLabel), 2000);
      } catch {
        /* clipboard blocked */
      }
    },
    []
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="democra-modal" role="presentation">

          {/* Backdrop */}
          <motion.div
            className="democra-modal__backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          />

          {/* Panel — spring entrance */}
          <motion.div
            className="democra-modal__panel"
            role="dialog"
            aria-modal="true"
            aria-label="Contacto"
            initial={{ opacity: 0, y: 28, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 360, damping: 26, mass: 0.75 }}
          >
            <div className="democra-modal__head">
              <div className="democra-modal__kicker">Conectemos</div>
              <button
                className="democra-modal__close"
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <h2 className="democra-modal__title">Impulsa tu proyecto</h2>
            <p className="democra-modal__desc">
              Acceso directo a consultoría especializada. Sin intermediarios.
            </p>

            <div className="contact-premium">
              <div className="contact-premium__grid">
                <div className="contact-premium__block">
                  <div className="contact-premium__label">E-mail Corporativo</div>
                  <button
                    className="contact-premium__value"
                    type="button"
                    onClick={() =>
                      copyText("tu-correo@ejemplo.com", setEmailLabel, "tu-correo@ejemplo.com")
                    }
                  >
                    {emailLabel}
                  </button>
                  <span className="contact-premium__hint">Clic para copiar correo</span>
                </div>
                <div className="contact-premium__block">
                  <div className="contact-premium__label">Línea de Consultoría</div>
                  <button
                    className="contact-premium__value"
                    type="button"
                    onClick={() =>
                      copyText("https://wa.me/51953714752", setWaLabel, "wa.me/51953714752")
                    }
                  >
                    {waLabel}
                  </button>
                  <a
                    href="https://wa.me/51953714752?text=Hola,%20me%20gustar%C3%ADa%20recibir%20asesor%C3%ADa%20sobre%20soluciones%20tecnol%C3%B3gicas."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-premium__hint"
                    style={{ color: "#25D366", textDecoration: "underline" }}
                  >
                    Click para ir directamente
                  </a>
                </div>
              </div>

              <div className="contact-premium__qrRow">
                <div className="contact-premium__qr">
                  <img
                    src="./Imagen/Line/qr_placeholder.png"
                    alt="QR de contacto"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div className="contact-premium__cta">
                  <div className="contact-premium__title">Soluciones a medida</div>
                  <div className="contact-premium__text">
                    Escanea el código para una respuesta inmediata vía WhatsApp o
                    utiliza nuestros accesos rápidos.
                  </div>
                  <div className="contact-premium__actions">
                    <button
                      className="dm-btn dm-btn--ghost"
                      type="button"
                      onClick={() =>
                        copyText("tu-correo@ejemplo.com", setCopyBtnLabel, "Copiar correo")
                      }
                    >
                      {copyBtnLabel}
                    </button>
                    <a
                      className="dm-btn dm-btn--solid"
                      href="https://wa.me/51953714752?text=Hola,%20me%20gustar%C3%ADa%20recibir%20asesor%C3%ADa%20sobre%20soluciones%20tecnol%C3%B3gicas."
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Iniciar Chat
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
