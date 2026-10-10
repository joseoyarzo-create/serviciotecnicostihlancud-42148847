# Recepción: implementación y comprobaciones

## Cambios
- Nuevos `src/pages/Recepciones.tsx`, `src/lib/recepciones.ts` y `src/lib/boletaRecepcion.ts`; navegación y acciones del inicio integradas sin retirar módulos.
- Se reutiliza la ficha existente para los datos de máquina y reparación. Nueva tabla `recepciones` con referencia única a ficha, solicitud idempotente, número único, accesorios, motivo original y observaciones.
- Campos aditivos en fichas: origen (histórico, físico o digital) y referencia de boleta física. Ninguna ficha antigua se clasificó como digital y no se reiniciaron contadores.
- Migraciones `0000_recepciones_digitales_independientes.sql` y `0001_corregir_recepcion_y_conservar_motivo.sql` aplicadas; tipos regenerados.
- RLS habilitada y lectura solo autenticada para recepciones; creación exclusivamente por RPC autenticado con validación, transacción, bloqueo de solicitud y secuencia independiente. La secuencia puede tener saltos y nunca reutiliza números.
- Plantilla monocromática de ancho 80/58 mm y altura variable, logo Sotavento recortado de la referencia. Condiciones transcritas de la imagen, sin valoración de su validez jurídica.

## Pruebas realizadas
- Creación real de recepción temporal D-000001 y ficha vinculada: sin repuestos/servicios ni fecha de reparación.
- Dos llamadas concurrentes con la misma solicitud devolvieron el mismo registro sin duplicados.
- Vista previa y reimpresión mantienen número; no llaman a la función de creación.
- Guardado de reparación física desde el formulario y por la función de persistencia; referencia física preservada, cero recepciones asociadas. Reintento del mismo ID conserva una ficha.
- Número digital deshabilitado al editar y protegido en la base.
- Precio editado 1.234 × cantidad 3 mostró subtotal/total 3.702 en el selector real de repuestos.
- Inicio, repuestos, clientes, estadísticas y administración cargaron sin errores de ejecución. No se probaron todas las acciones de cada módulo.
- Usuario sin sesión redirigido a login; lectura y creación de recepciones rechazadas.
- Ventana de impresión bloqueada mostró error y conservó la recepción.
- Inspección visual de boleta 80 y 58 mm: sin desbordamiento horizontal ni texto cortado. Se sustituyó el logo STIHL inicial por el logo Sotavento y se corrigió la dirección de Achao. El logo CDN respondió correctamente; en pruebas locales se sirvió el mismo archivo mediante interceptación para evitar esperas de red externa.
- Registros temporales de pruebas eliminados, sin borrar datos reales ni reutilizar D-000001.
- Compilación automática sin errores.

## Límites
- No se ha impreso en una Epson real. Verificar controlador con ancho instalado, escala 100%, márgenes mínimos y sin encabezados/pies del navegador. CSS no configura el controlador ni el corte de papel.
- No se ha probado entrega real por WhatsApp ni todas las exportaciones/importaciones anteriores.
- No se publicó la aplicación.